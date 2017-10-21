/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-address.js
*
* Copyright (c) 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2017-10-12
* ---------------------------------------------------------------- */
'use strict';
const mOs = require('os');

/* ------------------------------------------------------------------
* Constructor: LifxLanAddress()
* ---------------------------------------------------------------- */
const LifxLanAddress = function() {};

/* ------------------------------------------------------------------
* Method: get()
* ---------------------------------------------------------------- */
LifxLanAddress.prototype.get = function() {
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
	if(!network_address) {
		return null;
	}
	let broadcast_address = this._getBroadcastAddress(network_address);
	return {
		source    : source_address,
		network   : network_address,
		broadcast : broadcast_address
	};
};

LifxLanAddress.prototype._parseIpAddrV4 = function(address) {
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

LifxLanAddress.prototype._getBroadcastAddress = function(net_address) {
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

module.exports = new LifxLanAddress();
