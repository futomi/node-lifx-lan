/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-udp.js
*
* Copyright (c) 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2017-10-20
* ---------------------------------------------------------------- */
'use strict';
const mDgram = require('dgram');
const mOs = require('os');
const mParser = require('./lifx-lan-parser');
const mComposer = require('./lifx-lan-composer');
const mAddress = require('./lifx-lan-address.js');

/* ------------------------------------------------------------------
* Constructor: LifxLanUdp()
* ---------------------------------------------------------------- */
const LifxLanUdp = function() {
	// Private
	this._UDP_PORT = 56700;
	this._udp = null; 
	this._requests = {};
	this._sequence = 0;
	this._timeout = 3000; // msec
	this._source_address = '';
	this._network_address = '';
	this._broadcast_address = '';
};

/* ------------------------------------------------------------------
* Method: destroy()
* ---------------------------------------------------------------- */
LifxLanUdp.prototype.destroy = function() {
	let promise = new Promise((resolve, reject) => {
		if(this._udp) {
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
LifxLanUdp.prototype.init = function() {
	let promise = new Promise((resolve, reject) => {
		let addrs = mAddress.get();
		if(!addrs) {
			reject(new Error('Failed to determine the network address.'));
			return;
		}
		this._source_address = addrs['source'];
		this._network_address = addrs['network'];
		this._broadcast_address = addrs['broadcast'];
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
		this._udp.bind({port: this._UDP_PORT});
	});
	return promise;
};

LifxLanUdp.prototype._getNetworkAddresses = function() {
	let netifs = mOs.networkInterfaces();
	let mask_bit_num_max = 0;
	let source_address = '';
	let network_address = '';
	for(let dev in netifs) {
		netifs[dev].forEach((info) => {
			if(info.family === 'IPv4' && info.internal === false) {
				let addr = this._parseIpAddrV4(info.address);
				let mask = this._parseIpAddrV4(info.netmask);
				if(addr && mask) {
					let addr_buf = Buffer.from([addr[0], addr[1], addr[2], addr[3]]);
					let addr_n = addr_buf.readUInt32BE(0);
					let mask_buf = Buffer.from([mask[0], mask[1], mask[2], mask[3]]);
					let mask_n = mask_buf.readUInt32BE(0);
					mask_buf = Buffer.alloc(4);
					mask_buf.writeUInt32BE(mask_n);
					let mask_bit_num = 0;
					for(let i=31; i>=0; i--) {
						if(((mask_n >> i) & 0b1) >>> 0) {
							mask_bit_num ++;
						} else {
							break;
						}
					}
					if(mask_bit_num > mask_bit_num_max) {
						let net_n = (addr_n & mask_n) >>> 0
						let net_buf = Buffer.alloc(4);
						net_buf.writeUInt32BE(net_n);
						let a1 = net_buf.readUInt8(0);
						let a2 = net_buf.readUInt8(1);
						let a3 = net_buf.readUInt8(2);
						let a4 = net_buf.readUInt8(3);
						network_address = [a1, a2, a3, a4].join('.') + '/' + mask_bit_num;
						source_address = info.address;
						mask_bit_num_max = mask_bit_num;
					}
				}
			}
		});
	}
	if(!network_addr) {
		return null;
	}
	let broadcast_address = this._getBroadcastAddress(network_address);
	return {
		source    : source_address,
		network   : network_address,
		broadcast : broadcast_address
	};
};

LifxLanUdp.prototype._parseIpAddrV4 = function(address) {
	if(typeof(address) !== 'string') {
		return null;
	}
	let m = address.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})($|\/\d{1,2}$)/);
	if(!m) {
		return null;
	}
	let a1 = parseInt(m[1], 10);
	let a2 = parseInt(m[2], 10);
	let a3 = parseInt(m[3], 10);
	let a4 = parseInt(m[4], 10);
	let mb = m[5];
	if(mb) {
		mb = parseInt(mb.replace('/', ''), 10);
	} else {
		mb = 0;
	}
	if(a1 < 256 && a2 < 256 && a3 < 256 && a4 < 256 && mb <= 32) {
		return [a1, a2, a3, a4, mb];
	} else {
		return null;
	}
};

LifxLanUdp.prototype._getBroadcastAddress = function(net_address) {
	let addr = this._parseIpAddrV4(net_address);
	let n = Buffer.from([addr[0], addr[1], addr[2], addr[3]]).readUInt32BE(0);
	let mb = addr[4];
	for(let i=0; i<32-mb; i++) {
		n = (n | (0b1 << i)) >>> 0;
	}
	let buf = Buffer.alloc(4);
	buf.writeUInt32BE(n);
	return [buf.readUInt8(0), buf.readUInt8(1), buf.readUInt8(2), buf.readUInt8(3)].join('.');
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
LifxLanUdp.prototype.request = function(params) {
	let promise = new Promise((resolve, reject) => {
		// Check the parameters
		if(!params) {
			reject(new Error('The argument `params` is required.'));
			return;
		} else if(typeof(params) !== 'object') {
			reject(new Error('The argument `params` is invalid.'));
			return;
		}

		let broadcast = params['broadcast'] ? true : false;

		let dst_address = '';
		if(broadcast) {
			dst_address = this._broadcast_address;
		} else {
			let address = params['address'];
			if(!address) {
				reject(new Error('The parameter `address` is required.'));
				return;
			} else if(typeof(address) !== 'string' || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(address)) {
				reject(new Error('The parameter `address` is invalid.'));
				return;
			}
			dst_address = address;
		}

		let ack_required = params['ack_required'];
		let res_required = params['res_required'];
		if(broadcast) {
			ack_required = false;
			res_required = false;
		}

		let target = params['target'];
		if(broadcast) {
			target = '00:00:00:00:00:00';
		}
		// message sequence number
		let seq = (this._sequence + 1) % 255;
		this._sequence = seq;
		// Timer
		let timer = null;
		if(params['ack_required'] || params['res_required']) {
			timer = setTimeout(() => {
				delete this._requests[seq];
				reject(new Error('Timeout'));
			}, this._timeout);
		}
		// Create a request packet
		let packet = mComposer.compose({
			type          : params['type'],
			payload       : params['payload'],
			sequence      : seq,
			ack_required  : ack_required,
			res_required  : res_required,
			target        : target,
			source        : this._source_address,
			tagged        : false
		});
		if(packet['error']) {
			reject(packet['error']);
			return;
		}
		// Set a callback
		if(ack_required || res_required) {
			this._requests[seq] = (res) => {
				delete this._requests[seq];
				if(timer) {
					clearTimeout(timer);
				}
				resolve(res);
			};
		}
		// Send a packet
		this._udp.setBroadcast(broadcast);
		let buf = packet['buffer'];
		this._udp.send(buf, 0, buf.length, this._UDP_PORT, dst_address, (error, bytes) => {
			if(error) {
				delete this._requests[seq];
				if(timer) {
					clearTimeout(timer);
				}
				reject(error);
			} else {
				if(!ack_required && !res_required) {
					resolve();
				}
			}
		});
	});
	return promise;
};

LifxLanUdp.prototype._receivePacket = function(buf, rinfo) {
	if(rinfo.address === this._source_address) {
		return;
	}
	let parsed = mParser.parse(buf);
	if(!parsed) {
		return;
	}
	parsed['address'] = rinfo.address;
	let seq = parsed['header']['sequence'];
	let callback = this._requests[seq];
	if(callback) {
		callback(parsed);
	}
};

/* ------------------------------------------------------------------
* Method: discover([params])
* - params:
*   - wait | Number | Optional | The default value is 3000 (msec).
* ---------------------------------------------------------------- */
LifxLanUdp.prototype.discover = function(params) {
	let promise = new Promise((resolve, reject) => {
		// Check the parameters
		if(params) {
			if(typeof(params) !== 'object') {
				reject(new Error('The argument `params` is invalid.'));
				return;
			}
		} else {
			params = {};
		}

		let wait = 3000;
		if('wait' in params) {
			if(typeof(params['wait']) === 'number' && params['wait'] > 0 || params['wait'] % 1 === 0) {
				wait = params['wait'];
			} else {
				reject(new Error('The parameter `wait` is invalid.'));
				return;
			}
		}
		// message sequence number
		let seq = (this._sequence + 1) % 255;
		this._sequence = seq;
		// Timer
		let devices = {};
		let timer = setTimeout(() => {
			delete this._requests[seq];
			let device_list = [];
			for(let id in devices) {
				device_list.push(devices[id]);
			}
			resolve(device_list);
		}, wait);
		// Create a request packet
		let packet = mComposer.compose({
			type          : 2,
			payload       : null,
			sequence      : seq,
			ack_required  : false,
			res_required  : false,
			target        : '00:00:00:00:00:00',
			source        : this._source_address,
			tagged        : true
		});
		if(packet['error']) {
			reject(packet['error']);
			return;
		}
		// Set a callback
		this._requests[seq] = (res) => {
			let addr = res['address'];
			if(!devices[addr]) {
				devices[addr] = res;
			}
		};
		// Send a packet
		this._udp.setBroadcast(true);
		let buf = packet['buffer'];
		this._udp.send(buf, 0, buf.length, this._UDP_PORT, this._broadcast_address, (error, bytes) => {
			if(error) {
				delete this._requests[seq];
				reject(error);
			}
		});
	});
	return promise;
};

module.exports = new LifxLanUdp();
