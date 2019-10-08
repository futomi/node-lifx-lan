/* ------------------------------------------------------------------
 * node-lifx-lan - lifx-lan.js
 *
 * Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
 * Released under the MIT license
 * Date: 2018-08-08
 * ---------------------------------------------------------------- */
'use strict';
const mDgram = require('dgram');
const mLifxUdp = require('./lifx-lan-udp');
const mLifxDevice = require('./lifx-lan-device');
const mLifxLanColor = require('./lifx-lan-color');

/* ------------------------------------------------------------------
 * Constructor: LifxLan()
 * ---------------------------------------------------------------- */
const LifxLan = function () {
	// Private
	this._is_scaning = false;
	this._initialized = false;
	this._device_list = null;
};

/* ------------------------------------------------------------------
 * Method: init()
 * ---------------------------------------------------------------- */
LifxLan.prototype.init = function () {
	let promise = new Promise((resolve, reject) => {
		if (this._initialized) {
			resolve();
		} else {
			mLifxUdp.init().then(() => {
				this._initialized = true;
				resolve();
			}).catch((error) => {
				reject(error);
			})
		}
	});
	return promise;
};

LifxLan.prototype._request = function (type, payload) {
	let promise = new Promise((resolve, reject) => {
		this.init().then(() => {
			return mLifxUdp.request({
				type: type,
				payload: payload || null,
				broadcast: true
			});
		}).then((res) => {
			resolve(res);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LifxLan.prototype._wait = function (msec) {
	if (!msec) {
		msec = 50;
	}
	let promise = new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, msec);
	});
	return promise;
};

/* ------------------------------------------------------------------
 * Method: discover([params])
 * - params:
 *   - wait | Integer | Optional | The default value is 3000 (msec)
 * ---------------------------------------------------------------- */
LifxLan.prototype.discover = function (params) {
	let promise = new Promise((resolve, reject) => {
		this.init().then(() => {
			return mLifxUdp.discover(params);
		}).then((found_list) => {
			let devices = {};
			if (this._device_list) {
				this._device_list.forEach((dev) => {
					let k = dev['ip'] + ' ' + dev['mac'];
					devices[k] = dev;
				});
			}
			let device_list = [];
			found_list.forEach((res) => {
				let ip = res['address'];
				let mac_parts = res['header']['target'].split(':');
				let mac = mac_parts.slice(0, 6).join(':');
				let k = ip + ' ' + mac;
				if (devices[k]) {
					device_list.push(devices[k]);
				} else {
					let lifxdev = new mLifxDevice({
						mac: mac,
						ip: ip,
						udp: mLifxUdp
					});
					device_list.push(lifxdev);
				}
			});
			return this._discoverGetDeviceInfo(device_list);
		}).then((device_list) => {
			this._device_list = device_list;
			let new_list = [];
			device_list.forEach((dev) => {
				new_list.push(dev);
			})
			resolve(new_list);
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LifxLan.prototype._discoverGetDeviceInfo = function (dev_list) {
	let promise = new Promise((resolve, reject) => {
		let new_list = [];
		let getDeviceInfo = (callback) => {
			let dev = dev_list.shift();
			if (!dev) {
				callback();
				return;
			}
			dev.getDeviceInfo().then(() => {
				new_list.push(dev);
				getDeviceInfo(callback);
			}).catch((error) => {
				getDeviceInfo(callback);
			});
		};
		getDeviceInfo(() => {
			resolve(new_list);
		});
	});
	return promise;
};

/* ------------------------------------------------------------------
 * Method: createDevice(params)
 * - params:
 *   - ip  | String | Required | IPv4 address (e.g., "192.168.10.4")
 *   - mac | String | Required | MAC address (e.g., "D0:73:D5:25:36:B0")
 * ---------------------------------------------------------------- */
LifxLan.prototype.createDevice = function (params) {
	let promise = new Promise((resolve, reject) => {
		if (!params || typeof (params) !== 'object') {
			reject(new Error('The `params` is required.'));
			return;
		}
		this.init().then(() => {
			let lifxdev = new mLifxDevice({
				mac: params['mac'],
				ip: params['ip'],
				udp: mLifxUdp
			});
			resolve(lifxdev);
		}).catch((error) => {
			reject(error);
		})
	});
	return promise;
};

/* ------------------------------------------------------------------
 * Method: turnOnBroadcast([params])
 * - params:
 *   - color        | Color   | Optional |
 *   - duration     | Integer | Optional | The default value is 0 msec
 *
 * The `Color` object must be:
 *
 *     - hue        | Float   | Required | 0.0 - 1.0
 *     - saturation | Float   | Required | 0.0 - 1.0
 *     - brightness | Float   | Required | 0.0 - 1.0
 *     - kelvin     | Integer | Optional | 1500 - 9000. The default is 3500.
 *
 * or
 *
 *     - red        | Float   | Required | 0.0 - 1.0
 *     - green      | Float   | Required | 0.0 - 1.0
 *     - blue       | Float   | Required | 0.0 - 1.0
 *     - brightness | Float   | Optional | 0.0 - 1.0
 *     - kelvin     | Integer | Optional | 1500 - 9000. The default is 3500.
 *
 * or
 *
 *     - css        | String  | Required | "#ff0000" or "rgb(255, 0, 0)" or "red" format
 *     - brightness | Float   | Optional | 0.0 - 1.0
 *     - kelvin     | Integer | Optional | 1500 - 9000. The default is 3500.
 * ---------------------------------------------------------------- */
LifxLan.prototype.turnOnBroadcast = function (params) {
	if (!params) {
		params = {};
	}
	let promise = new Promise((resolve, reject) => {
		this._turnOnBroadcastSetColor(params).then(() => {
			return this._wait();
		}).then(() => {
			let reqp = {
				level: 1
			};
			if ('duration' in params) {
				reqp['duration'] = params['duration'];
			}
			return this._request(117, reqp);
		}).then(() => {
			resolve();
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

LifxLan.prototype._turnOnBroadcastSetColor = function (params) {
	let promise = new Promise((resolve, reject) => {
		if (params['color']) {
			this.setColorBroadcast(params).then(() => {
				resolve();
			}).catch((error) => {
				reject(error);
			});
		} else {
			resolve();
		}
	});
	return promise;
};

/* ------------------------------------------------------------------
 * Method: setColorBroadcast(params)
 * - params:
 *   - color        | Color   | Required |
 *   - duration     | Integer | Optional | The default value is 0 msec
 *
 * The `Color` object must be:
 *
 *     - hue        | Float   | Required | 0.0 - 1.0
 *     - saturation | Float   | Required | 0.0 - 1.0
 *     - brightness | Float   | Required | 0.0 - 1.0
 *     - kelvin     | Integer | Optional | 1500 - 9000. The default is 3500.
 *
 * or
 *
 *     - red        | Float   | Required | 0.0 - 1.0
 *     - green      | Float   | Required | 0.0 - 1.0
 *     - blue       | Float   | Required | 0.0 - 1.0
 *     - brightness | Float   | Optional | 0.0 - 1.0
 *     - kelvin     | Integer | Optional | 1500 - 9000. The default is 3500.
 *
 * or
 *
 *     - css        | String  | Required | "#ff0000" or "rgb(255, 0, 0)" or "red" format
 *     - brightness | Float   | Optional | 0.0 - 1.0
 *     - kelvin     | Integer | Optional | 1500 - 9000. The default is 3500.
 * ---------------------------------------------------------------- */
LifxLan.prototype.setColorBroadcast = function (params) {
	let promise = new Promise((resolve, reject) => {
		let color = null;
		let duration = 0;
		if (!params && typeof (params) !== 'object') {
			reject(new Error('The argument `params` is invalid.'));
			return;
		}
		if (!('color' in params)) {
			reject(new Error('The `color` is required.'));
			return;
		}
		let c = params['color'];
		if (typeof (c) !== 'object') {
			reject(new Error('The `color` is invalid.'));
			return;
		}
		if ('hue' in c && 'saturation' in c && 'brightness' in c) {
			color = {
				hue: c['hue'],
				saturation: c['saturation'],
				brightness: c['brightness']
			};
		} else if ('x' in c && 'y' in c) {
			let converted = mLifxLanColor.xybToHsb({
				x: c['x'],
				y: c['y'],
				brightness: c['brightness']
			});
			if (converted['error']) {
				throw converted['error'];
			}
			let hsb = converted['hsb'];
			color = {
				hue: hsb['hue'],
				saturation: hsb['saturation'],
				brightness: hsb['brightness']
			};
		} else if ('red' in c && 'green' in c && 'blue' in c) {
			let converted = mLifxLanColor.rgbToHsb({
				red: c['red'],
				green: c['green'],
				blue: c['blue'],
				brightness: c['brightness']
			});
			if (converted['error']) {
				throw converted['error'];
			}
			let hsb = converted['hsb'];
			color = {
				hue: hsb['hue'],
				saturation: hsb['saturation'],
				brightness: hsb['brightness']
			};
		} else if ('css' in c) {
			let converted = mLifxLanColor.cssToHsb(c);
			if (converted['error']) {
				throw converted['error'];
			}
			let hsb = converted['hsb'];
			color = {
				hue: hsb['hue'],
				saturation: hsb['saturation'],
				brightness: hsb['brightness']
			};
		} else {
			reject(new Error('The `color` is invalid.'));
			return;
		}

		if ('kelvin' in c) {
			color['kelvin'] = c['kelvin'];
		} else {
			color['kelvin'] = 3500;
		}

		let reqp = {
			color: color
		};
		if ('duration' in params) {
			reqp['duration'] = params['duration'];
		}

		if (params['color']) {
			this._request(102, reqp).then(() => {
				resolve();
			}).catch((error) => {
				reject(error);
			});
		} else {
			resolve();
		}
	});
	return promise;
};

/* ------------------------------------------------------------------
 * Method: turnOffBroadcast(params)
 * - params:
 *   - duration | Integer | Optional | The default value is 0 msec
 * ---------------------------------------------------------------- */
LifxLan.prototype.turnOffBroadcast = function (params) {
	let promise = new Promise((resolve, reject) => {
		let p = {
			level: 0
		};
		if ('duration' in params) {
			p['duration'] = params['duration'];
		}
		this._request(117, p).then(() => {
			resolve();
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

/* ------------------------------------------------------------------
 * Method: turnOnFilter([params])
 * - params:
 *   - filters      | Array   | Optional | List of Filter object
 *   - color        | Color   | Optional |
 *   - duration     | Integer | Optional | The default value is 0 msec
 *
 * The `Filter` object must be:
 *
 *     - label      | String  | Optional | Label of bulb
 *     - productId  | Integer | Optional | Product ID
 *     - features   | Object  | Optional |
 *       - color    | Boolean | Optional | `true` or `false`
 *       - infrared | Boolean | Optional | `true` or `false`
 *       - multizone| Boolean | Optional | `true` or `false`
 *       - chain    | Boolean | Optional | `true` or `false`
 *     - group      | Object  | Optional |
 *       - guid     | String  | Optiona  | GUID of group
 *       - label    | String  | Optiona  | Label of group
 *     - location   | Object  | Optional |
 *       - guid     | String  | Optiona  | GUID of location
 *       - label    | String  | Optiona  | Label of location
 *
 * The `Color` object must be:
 *
 *     - hue        | Float   | Optional | 0.0 - 1.0
 *     - saturation | Float   | Optional | 0.0 - 1.0
 *     - brightness | Float   | Optional | 0.0 - 1.0
 *     - kelvin     | Integer | Optional | 1500 - 9000
 *
 * or
 *
 *     - red        | Float   | Optional | 0.0 - 1.0
 *     - green      | Float   | Optional | 0.0 - 1.0
 *     - blue       | Float   | Optional | 0.0 - 1.0
 *     - kelvin     | Integer | Optional | 1500 - 9000
 *
 * or
 *
 *     - css        | String  | Optional | "#ff0000" or "rgb(255, 0, 0)" or "red" format
 *     - kelvin     | Integer | Optional | 1500 - 9000
 * ---------------------------------------------------------------- */
LifxLan.prototype.turnOnFilter = function (params) {
	let promise = new Promise((resolve, reject) => {
		if (params) {
			if (typeof (params) !== 'object') {
				reject(new Error('The autument `params` is invalid.'));
				return;
			}
		} else {
			params = {};
		}
		let res = this._filtereDevices(params);
		if (res['error']) {
			reject(res['error']);
			return;
		}
		let filtered_device_list = res['list'];
		let turnOn = (callback) => {
			let dev = filtered_device_list.shift();
			if (dev) {
				dev.turnOn(params).then(() => {
					turnOn(callback);
				}).catch((error) => {
					callback(error);
				});
			} else {
				callback();
			}
		};
		turnOn((error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
	return promise;
};


/* ------------------------------------------------------------------
 * Method: seColorFilter(params)
 * - params:
 *   - filters      | Array   | Optional | List of Filter object
 *   - color        | Color   | Optional |
 *   - duration     | Integer | Optional | The default value is 0 msec
 *
 * The `Filter` object must be:
 *
 *     - label      | String  | Optional | Label of bulb
 *     - productId  | Integer | Optional | Product ID
 *     - features   | Object  | Optional |
 *       - color    | Boolean | Optional | `true` or `false`
 *       - infrared | Boolean | Optional | `true` or `false`
 *       - multizone| Boolean | Optional | `true` or `false`
 *       - chain    | Boolean | Optional | `true` or `false`
 *     - group      | Object  | Optional |
 *       - guid     | String  | Optiona  | GUID of group
 *       - label    | String  | Optiona  | Label of group
 *     - location   | Object  | Optional |
 *       - guid     | String  | Optiona  | GUID of location
 *       - label    | String  | Optiona  | Label of location
 *
 * The `Color` object must be:
 *
 *     - hue        | Float   | Optional | 0.0 - 1.0
 *     - saturation | Float   | Optional | 0.0 - 1.0
 *     - brightness | Float   | Optional | 0.0 - 1.0
 *     - kelvin     | Integer | Optional | 1500 - 9000
 *
 * or
 *
 *     - red        | Float   | Optional | 0.0 - 1.0
 *     - green      | Float   | Optional | 0.0 - 1.0
 *     - blue       | Float   | Optional | 0.0 - 1.0
 *     - kelvin     | Integer | Optional | 1500 - 9000
 *
 * or
 *
 *     - css        | String  | Optional | "#ff0000" or "rgb(255, 0, 0)" or "red" format
 *     - kelvin     | Integer | Optional | 1500 - 9000
 * ---------------------------------------------------------------- */
LifxLan.prototype.setColorFilter = function (params) {
	let promise = new Promise((resolve, reject) => {
		if (params) {
			if (typeof (params) !== 'object') {
				reject(new Error('The autument `params` is invalid.'));
				return;
			}
		} else {
			params = {};
		}
		let res = this._filtereDevices(params);
		if (res['error']) {
			reject(res['error']);
			return;
		}
		let filtered_device_list = res['list'];
		let setColor = (callback) => {
			let dev = filtered_device_list.shift();
			if (dev) {
				dev.setColor(params).then(() => {
					setColor(callback);
				}).catch((error) => {
					callback(error);
				});
			} else {
				callback();
			}
		};
		setColor((error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
	return promise;
};

/* ------------------------------------------------------------------
 * Method: turnOffFilter([params])
 * - params:
 *   - filters      | Array   | Optional | List of Filter object
 *   - duration     | Integer | Optional | The default value is 0 msec
 *
 * The `Filter` object must be:
 *
 *     - label      | String  | Optional | Label of bulb
 *     - productId  | Integer | Optional | Product ID
 *     - features   | Object  | Optional |
 *       - color    | Boolean | Optional | `true` or `false`
 *       - infrared | Boolean | Optional | `true` or `false`
 *       - multizone| Boolean | Optional | `true` or `false`
 *       - chain    | Boolean | Optional | `true` or `false`
 *     - group      | Object  | Optional |
 *       - guid     | String  | Optiona  | GUID of group
 *       - label    | String  | Optiona  | Label of group
 *     - location   | Object  | Optional |
 *       - guid     | String  | Optiona  | GUID of location
 *       - label    | String  | Optiona  | Label of location
 * ---------------------------------------------------------------- */
LifxLan.prototype.turnOffFilter = function (params) {
	let promise = new Promise((resolve, reject) => {
		if (params) {
			if (typeof (params) !== 'object') {
				reject(new Error('The autument `params` is invalid.'));
				return;
			}
		} else {
			params = {};
		}
		let res = this._filtereDevices(params);
		if (res['error']) {
			reject(res['error']);
			return;
		}
		let filtered_device_list = res['list'];
		let turnOff = (callback) => {
			let dev = filtered_device_list.shift();
			if (dev) {
				dev.turnOff(params).then(() => {
					turnOff(callback);
				}).catch((error) => {
					callback(error);
				});
			} else {
				callback();
			}
		};
		turnOff((error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
	return promise;
};

LifxLan.prototype._filtereDevices = function (params) {
	if (this._device_list === null || this._device_list.length === 0) {
		return {
			error: new Error('No device was found. Run the `discover()` method then try this method again.')
		};
	}
	// Check the `filters`
	let filter_list = [];
	if ('filters' in params) {
		let res = this._checkFilters(params['filters']);
		if (res['error']) {
			return {
				error: res['error']
			};
		} else {
			filter_list = res['filters'];
		}
	}
	// Filter devices
	let filtered_device_list = [];
	if (filter_list.length > 0) {
		filtered_device_list = this._getFilteredDeviceList(filter_list);
	} else {
		filtered_device_list = this._device_list;
	}
	if (filtered_device_list.length === 0) {
		return {
			error: new Error('No device was found. Run the `discover()` method then try this method again.')
		};
	}
	return {
		list: filtered_device_list
	};
};

LifxLan.prototype._getFilteredDeviceList = function (filter_list) {
	let filtered_devices = {};
	filter_list.forEach((filter) => {
		let candidates = {};
		this._device_list.forEach((dev) => {
			let ip = dev['ip'];
			candidates[ip] = dev;
		});
		if ('label' in filter) {
			let v = filter['label'];
			Object.keys(candidates).forEach((ip) => {
				let info = candidates[ip]['deviceInfo'];
				if (info['label'] !== v) {
					delete candidates[ip];
				}
			});
		}
		if ('productId' in filter) {
			let v = filter['productId'];
			Object.keys(candidates).forEach((ip) => {
				let info = candidates[ip]['deviceInfo'];
				if (info['productId'] !== v) {
					delete candidates[ip];
				}
			});
		}
		if ('features' in filter) {
			let features = filter['features'];
			Object.keys(features).forEach((k) => {
				let v = features[k];
				Object.keys(candidates).forEach((ip) => {
					let info = candidates[ip]['deviceInfo'];
					if (info['features'][k] !== v) {
						delete candidates[ip];
					}
				});
			});
		}
		if ('group' in filter) {
			let group = filter['group'];
			if ('guid' in group) {
				let v = group['guid'];
				Object.keys(candidates).forEach((ip) => {
					let info = candidates[ip]['deviceInfo'];
					if (info['group']['guid'] !== v) {
						delete candidates[ip];
					}
				});
			}
			if ('label' in group) {
				let v = group['label'];
				Object.keys(candidates).forEach((ip) => {
					let info = candidates[ip]['deviceInfo'];
					if (info['group']['label'] !== v) {
						delete candidates[ip];
					}
				});
			}
		}
		if ('location' in filter) {
			let location = filter['location'];
			if ('guid' in location) {
				let v = location['guid'];
				Object.keys(candidates).forEach((ip) => {
					let info = candidates[ip]['deviceInfo'];
					if (info['location']['guid'] !== v) {
						delete candidates[ip];
					}
				});
			}
			if ('label' in location) {
				let v = location['label'];
				Object.keys(candidates).forEach((ip) => {
					let info = candidates[ip]['deviceInfo'];
					if (info['location']['label'] !== v) {
						delete candidates[ip];
					}
				});
			}
		}
		Object.keys(candidates).forEach((ip) => {
			filtered_devices[ip] = candidates[ip];
		})
	});
	let filtered_list = [];
	Object.keys(filtered_devices).forEach((ip) => {
		filtered_list.push(filtered_devices[ip]);
	});
	return filtered_list;
};

LifxLan.prototype._checkFilters = function (filter_list) {
	if (!Array.isArray(filter_list)) {
		return {
			error: new Error('The `filters` must be an Array object.')
		};
	}
	if (filter_list.length === 0) {
		return {
			filters: []
		};
	}
	let new_filter_list = [];
	let error = null;
	filter_list.forEach((filter) => {
		let res = this._checkFilter(filter);
		if (res['error']) {
			error = res['error'];
		} else {
			new_filter_list.push(res['filter']);
		}
	});
	if (error) {
		return {
			error: error
		};
	} else {
		return {
			filters: new_filter_list
		};
	}
};

LifxLan.prototype._checkFilter = function (filter) {
	let o = {};
	// Check the `label`
	if ('label' in filter) {
		let v = filter['label'];
		if (typeof (v) !== 'string') {
			return {
				error: new Error('The `Filter.label` must be a string.')
			};
		}
		if (v) {
			o['label'] = v;
		}
	}
	// Check the `productId`
	if ('productId' in filter) {
		let v = filter['productId'];
		if (typeof (v) !== 'number' || v % 1 !== 0) {
			return {
				error: new Error('The `Filter.productId` must be an integer.')
			};
		}
		o['productId'] = v;
	}
	// Check the `features`
	if ('features' in filter) {
		if (typeof (filter['features']) !== 'object') {
			return {
				error: new Error('The `Filter.features` is invalid.')
			};
		}
		let error = null;
		let features = {};
		['color', 'infrared', 'multizone', 'chain'].forEach((k) => {
			if (k in filter['features']) {
				let v = filter['features'][k];
				if (typeof (v) === 'boolean') {
					features[k] = v;
				} else {
					error = new Error('The `Filter.' + k + '` must be a boolean.');
				}
			}
		});
		if (error) {
			return {
				error: error
			};
		}
		if (Object.keys(features).length > 0) {
			o['features'] = features;
		}
	}
	// Check the `group`
	if ('group' in filter) {
		if (typeof (filter['group']) !== 'object') {
			return {
				error: new Error('The `Filter.group` is invalid.')
			};
		}
		let group = {};
		if ('guid' in filter['group']) {
			let v = filter['group']['guid'];
			if (typeof (v) !== 'string') {
				return {
					error: new Error('The `Filter.group.guid` must be a string.')
				};
			}
			if (v) {
				group['guid'] = v;
			}
		}
		if ('label' in filter['group']) {
			let v = filter['group']['label'];
			if (typeof (v) !== 'string') {
				return {
					error: new Error('The `Filter.group.label` must be a string.')
				};
			}
			if (v) {
				group['label'] = v;
			}
		}
		if (Object.keys(group).length > 0) {
			o['group'] = group;
		}
	}
	// Check the `location`
	if ('location' in filter) {
		if (typeof (filter['location']) !== 'object') {
			return {
				error: new Error('The `Filter.location` is invalid.')
			};
		}
		let location = {};
		if ('guid' in filter['location']) {
			let v = filter['location']['guid'];
			if (typeof (v) !== 'string') {
				return {
					error: new Error('The `Filter.location.guid` must be a string.')
				};
			}
			if (v) {
				location['guid'] = v;
			}
		}
		if ('label' in filter['location']) {
			let v = filter['location']['label'];
			if (typeof (v) !== 'string') {
				return {
					error: new Error('The `Filter.location.label` must be a string.')
				};
			}
			if (v) {
				location['label'] = v;
			}
		}
		if (Object.keys(location).length > 0) {
			o['location'] = location;
		}
	}
	return {
		filter: o
	};
};


/* ------------------------------------------------------------------
 * Method: destroy()
 * ---------------------------------------------------------------- */
LifxLan.prototype.destroy = function () {
	let promise = new Promise((resolve, reject) => {
		mLifxUdp.destroy().then(() => {
			this._is_scaning = false;
			this._initialized = false;
			this._device_list = null;
			resolve();
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

module.exports = new LifxLan();
