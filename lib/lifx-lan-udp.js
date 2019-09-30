/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-udp.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-07-01
* ---------------------------------------------------------------- */
'use strict';
const mDgram = require('dgram');
const mParser = require('./lifx-lan-parser');
const mComposer = require('./lifx-lan-composer');
const mAddress = require('./lifx-lan-address.js');

/* ------------------------------------------------------------------
* Constructor: LifxLanUdp()
* ---------------------------------------------------------------- */
const LifxLanUdp = function () {
	// Private
	this._UDP_PORT = 56700;
	this._udp = null;
	this._requests = {};
	this._sequence = 0;
	this._timeout = 3000; // msec
	this._source_id = 0;
	this._netif_list = null;
};

/* ------------------------------------------------------------------
* Method: destroy()
* ---------------------------------------------------------------- */
LifxLanUdp.prototype.destroy = function () {
	let promise = new Promise((resolve, reject) => {
		if (this._udp) {
			this._udp.close(() => {
				this._udp.unref()
				this._udp = null;
				resolve();
			});
		} else {
			this._udp.unref()
			this._udp = null;
			resolve();
		}
	});
	return promise;
};

/* ------------------------------------------------------------------
* Method: init()
* ---------------------------------------------------------------- */
LifxLanUdp.prototype.init = function () {
	let promise = new Promise((resolve, reject) => {
		this._source_id = Math.floor(Math.random() * 0xffffffff);
		let netif_list = mAddress.getNetworkInterfaces();
		if (!netif_list || netif_list.length === 0) {
			reject(new Error('No available network interface was found.'));
			return;
		}
		this._netif_list = netif_list;
		// Set up a UDP tranceiver
		this._udp = mDgram.createSocket('udp4');
		this._udp.once('error', (error) => {
			reject(error);
			return;
		});
		this._udp.once('listening', () => {
			resolve();
			return;
		});
		this._udp.on('message', (buf, rinfo) => {
			this._receivePacket(buf, rinfo);
		});
		this._udp.bind({ port: this._UDP_PORT });
	});
	return promise;
};

/* ------------------------------------------------------------------
* Method: request(params)
* - params:
*   - address       | String  | Required | IP address of the destination (e.g., "192.168.10.10")
*   - type          | Integer | Required | Message Type (e.g., 101)
*   - payload       | Object  | Optional | Depends on the type
*   - ack_required  | Boolean | Optional | The default value is `false`
*   - res_required  | Boolean | Optional | The default value is `false`
*   - target        | String  | Required | MAC Address
*   - broadcast     | Boolean | Optional | `true` or `false`. The default is `false`.
*
* If the `broadcast` is `true`, the `address`, `ack_required`, `res_required`, and `target` are not required (ignored).
* ---------------------------------------------------------------- */
LifxLanUdp.prototype.request = function (params) {
	let promise = new Promise((resolve, reject) => {
		// Check the parameters
		let param_check_result = this._checkRequestParams(params);
		if (param_check_result['error']) {
			reject(param_check_result['error']);
			return;
		}
		let p = param_check_result['params'];
		if(p['broadcast']) {
			this._requestBroadcast(p).then((res) => {
				resolve(res);
			}).catch((error) => {
				reject(error);
			});
		} else {
			this._requestUnicast(p).then((res) => {
				resolve(res);
			}).catch((error) => {
				reject(error);
			});
		}
	});
	return promise;
};

LifxLanUdp.prototype._requestUnicast = function (p) {
	let promise = new Promise((resolve, reject) => {
		// message sequence number
		let seq = (this._sequence + 1) % 255;
		this._sequence = seq;
		// Timer
		let timer = null;
		if (p['ack_required'] || p['res_required']) {
			timer = setTimeout(() => {
				delete this._requests[seq];
				reject(new Error('Timeout'));
			}, this._timeout);
		}
		// Create a request packet
		let packet = mComposer.compose({
			type: p['type'],
			payload: p['payload'],
			sequence: seq,
			ack_required: p['ack_required'],
			res_required: p['res_required'],
			target: p['target'],
			source: this._source_id,
			tagged: false
		});
		if (packet['error']) {
			reject(packet['error']);
			return;
		}
		// Set a callback
		if (p['ack_required'] || p['res_required']) {
			let multi_res_total = packet['multi_res_total'];
			let multi_res = [];
			this._requests[seq] = (res) => {
				if (multi_res_total) {
					multi_res.push(res);
					if (multi_res.length < multi_res_total) return;
					res = multi_res;
				}
				delete this._requests[seq];
				if (timer) {
					clearTimeout(timer);
				}
				resolve(res);
			};
		}
		// Send a packet
		this._udp.setBroadcast(false);
		let buf = packet['buffer'];
		this._udp.send(buf, 0, buf.length, this._UDP_PORT, p['address'], (error) => {
			if (error) {
				delete this._requests[seq];
				if (timer) {
					clearTimeout(timer);
				}
				reject(error);
			} else {
				if (!p['ack_required'] && !p['res_required']) {
					resolve();
				}
			}
		});
	});
	return promise;
};

LifxLanUdp.prototype._requestBroadcast = function (p) {
	let promise = new Promise((resolve, reject) => {
		let req_list = [];
		this._netif_list.forEach((netif) => {
			// message sequence number
			let seq = (this._sequence + 1) % 255;
			this._sequence = seq;
			// Create a request packet
			let packet = mComposer.compose({
				type: p['type'],
				payload: p['payload'],
				sequence: seq,
				ack_required: p['ack_required'], // false
				res_required: p['res_required'], // false
				target: p['target'], // 00:00:00:00:00:00
				source: this._source_id,
				tagged: false
			});
			if (packet['error']) {
				reject(packet['error']);
				return;
			}
			req_list.push({
				seq: seq,
				address: netif['broadcast'],
				buffer: packet['buffer']
			});
		});

		// Send a packet
		this._sendBroadcast(req_list).then(() => {
			resolve();
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LifxLanUdp.prototype._checkRequestParams = function (params) {
	if (!params) {
		return {error: new Error('The argument `params` is required.')};
	} else if (typeof (params) !== 'object') {
		return {error: new Error('The argument `params` is invalid.')};
	}

	let type = params['type'];
	if(typeof(type) !== 'number' || type % 1 !== 0) {
		return {error: new Error('The parameter `type` must be an integer.')};
	}

	let broadcast = params['broadcast'] ? true : false;

	let dst_address = '';
	if (!broadcast) {
		let address = params['address'];
		if (!address) {
			return {error: new Error('The parameter `address` is required.')};
		} else if (typeof (address) !== 'string' || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(address)) {
			return {error: new Error('The parameter `address` is invalid.')};
		}
		dst_address = address;
	}

	let ack_required = params['ack_required'];
	let res_required = params['res_required'];
	if (broadcast) {
		ack_required = false;
		res_required = false;
	}

	let target = params['target'];
	if (broadcast) {
		target = '00:00:00:00:00:00';
	}

	let p = {
		address       : dst_address ? dst_address : params['address'],
		type          : type,
		payload       : params['payload'],
		ack_required  : ack_required,
		res_required  : res_required,
		target        : target,
		broadcast     : broadcast
	};
	return {params: p};
};

LifxLanUdp.prototype._receivePacket = function (buf, rinfo) {
	if (this._isNetworkInterfaceAddress(rinfo.address)) {
		return;
	}
	let parsed = mParser.parse(buf);
	if (!parsed) {
		return;
	}
	parsed['address'] = rinfo.address;
	let seq = parsed['header']['sequence'];
	let callback = this._requests[seq];
	if (callback) {
		callback(parsed);
	}
};

LifxLanUdp.prototype._isNetworkInterfaceAddress = function (addr) {
	let flag = false;
	for (let i = 0; i < this._netif_list.length; i++) {
		let netif = this._netif_list[i];
		if (netif['address'] === addr) {
			flag = true;
			break;
		}
	}
	return flag;
};

/* ------------------------------------------------------------------
* Method: discover([params])
* - params:
*   - wait | Number | Optional | The default value is 3000 (msec).
* ---------------------------------------------------------------- */
LifxLanUdp.prototype.discover = function (params) {
	let promise = new Promise((resolve, reject) => {
		// Check the parameters
		let param_check_result = this._checkDiscoverParams(params);
		if (param_check_result['error']) {
			reject(param_check_result['error']);
			return;
		}
		let wait = param_check_result['params']['wait'];

		let req_list = [];
		let devices = {};
		this._netif_list.forEach((netif) => {
			// message sequence number
			let seq = (this._sequence + 1) % 255;
			this._sequence = seq;
			// Create a request packet
			let packet = mComposer.compose({
				type: 2,
				payload: null,
				sequence: seq,
				ack_required: false,
				res_required: false,
				target: '00:00:00:00:00:00',
				source: this._source_id,
				tagged: true
			});
			if (packet['error']) {
				reject(packet['error']);
				return;
			}
			req_list.push({
				seq: seq,
				address: netif['broadcast'],
				buffer: packet['buffer']
			});
			// Set a callback
			this._requests[seq] = (res) => {
				let addr = res['address'];
				if (!devices[addr]) {
					devices[addr] = res;
				}
			};
		});

		// Timer
		let timer = setTimeout(() => {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			req_list.forEach((req) => {
				delete this._requests[req['seq']];
			});
			let device_list = [];
			for (let id in devices) {
				device_list.push(devices[id]);
			}
			resolve(device_list);
		}, wait);

		// Send a packet
		this._sendBroadcast(req_list).then(() => {
			// Do nothing
		}).catch((error) => {
			req_list.forEach((req) => {
				delete this._requests[req['seq']];
			});
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			reject(error);
		});
	});
	return promise;
};

LifxLanUdp.prototype._checkDiscoverParams = function (params) {
	if (params) {
		if (typeof (params) !== 'object') {
			return { error: new Error('The argument `params` is invalid.') };
		}
	} else {
		params = {};
	}

	let wait = 3000;
	if ('wait' in params) {
		if (typeof (params['wait']) === 'number' && params['wait'] > 0 || params['wait'] % 1 === 0) {
			wait = params['wait'];
		} else {
			return { error: new Error('The parameter `wait` is invalid.') };
		}
	}
	let p = {
		wait: wait
	};
	return { params: p };
};

LifxLanUdp.prototype._sendBroadcast = function (req_list) {
	let promise = new Promise((resolve, reject) => {
		this._udp.setBroadcast(true);
		let req_idx = 0;
		let sendPacket = (callback) => {
			let req = req_list[req_idx];
			if (req) {
				let buf = req['buffer'];
				this._udp.send(buf, 0, buf.length, this._UDP_PORT, req['address'], (error) => {
					if (error) {
						callback(error);
					} else {
						setTimeout(() => {
							req_idx++;
							sendPacket(callback);
						}, 100);
					}
				});
			} else {
				callback();
			}
		};
		sendPacket((error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
	return promise;
};

module.exports = new LifxLanUdp();
