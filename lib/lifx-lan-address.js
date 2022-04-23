/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-address.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-07-01
* ---------------------------------------------------------------- */
'use strict';
const mOs = require('os');

/* ------------------------------------------------------------------
* Constructor: LifxLanAddress()
* ---------------------------------------------------------------- */
const LifxLanAddress = function () {
};

/* ------------------------------------------------------------------
* Method: getNetworkInterfaces()
* ---------------------------------------------------------------- */
LifxLanAddress.prototype.getNetworkInterfaces = function () {
	let list = [];
	let netifs = mOs.networkInterfaces();
	for (let dev in netifs) {
		netifs[dev].forEach((info) => {
			if (info.family !== 'IPv4' || info.internal === true) {
				return;
			}
			if (/^169\.254\./.test(info.address)) {
				return;
			}
			info['broadcast'] = this._getBroadcastAddress(info);
			list.push(info);
		});
	}
	return list;
};

LifxLanAddress.prototype._getBroadcastAddress = function (info) {
	let addr_parts = this._convIPv4ToNumList(info.address);
	let mask_parts = this._convIPv4ToNumList(info.netmask);
  // bitwise OR over the splitted NAND netmask, then glue them back together with a dot character to form an ip
  // we have to do a NAND operation because of the 2-complements; getting rid of all the 'prepended' 1's with & 0xFF
	return addr_parts.map((e, i) => (~mask_parts[i] & 0xFF) | e).join('.');
};

LifxLanAddress.prototype._convIPv4ToNumList = function (address) {
	let parts = address.split(/\./);
	let list = [];
	parts.forEach((n, i) => {
		list.push(parseInt(n, 10));
	});
	return list;
};

module.exports = new LifxLanAddress();
