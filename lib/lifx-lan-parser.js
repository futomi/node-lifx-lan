/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-parser.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-06-09
* ---------------------------------------------------------------- */
'use strict';

/* ------------------------------------------------------------------
* Constructor: LifxLanParser()
* ---------------------------------------------------------------- */
const LifxLanParser = function() {
	// Private
	this._LIFX_PRODUCTS = require('./products.json');
};

/* ------------------------------------------------------------------
* Method: parse(buffer)
* ---------------------------------------------------------------- */
LifxLanParser.prototype.parse = function(buf) {
	if(buf.length < 36) {
		return null;
	}
	// Header
	let header = this._parseHeader(buf);
	if(!header) {
		return null;
	}
	// Payload
	let payload = null;
	if(header['size'] > 36) {
		let pbuf = buf.slice(36, header['size']);
		payload = this._parsePayload(header['type'], pbuf);
	}
	return {
		header  : header,
		payload : payload
	};
};

LifxLanParser.prototype._parseHeader = function(buf) {
	// Frame
	let size = buf.readUInt16LE(0);
	if(size !== buf.length) {
		return null;
	}
	let tagged = (buf.readUInt8(3) & 0b00100000) ? true : false;
	let addressable = (buf.readUInt8(3) & 0b00010000) ? true : false;
	let protocol = buf.readUInt16LE(2) & 0b0000111111111111;
	let source = buf.readUInt32LE(4);
	// Frame Address
	let target_parts = [];
	for(let i=8; i<16; i++) {
		target_parts.push(buf.slice(i, i+1).toString('hex').toUpperCase());
	}
	let target = target_parts.join(':');
	let ack = (buf.readUInt8(22) & 0b00000010) ? true : false;
	let res = (buf.readUInt8(22) & 0b00000001) ? true : false;
	let sequence = buf.readUInt8(23);
	// Protocol Header
	let type = buf.readUInt16LE(32);

	return {
		size        : size,
		tagged      : tagged,
		addressable : addressable,
		protocol    : protocol,
		source      : source,
		target      : target,
		ack         : ack,
		res         : res,
		sequence    : sequence,
		type        : type
	};
};

LifxLanParser.prototype._parsePayload = function(type, pbuf) {
	let psize = pbuf.length;
	let payload = null;
	// ------------------------------------------------
	// Device Messages
	// ------------------------------------------------
	if(type === 3) { // StateService - 3
		if(psize === 5) {
			payload = {
				service : pbuf.readUInt8(0),
				port    : pbuf.readUInt32LE(1)
			};
		}
	} else if(type === 13) { // StateHostInfo - 13
		if(psize === 14) {
			payload = {
				signal : pbuf.readFloatLE(0),
				tx     : pbuf.readUInt32LE(4),
				rx     : pbuf.readUInt32LE(8)
			};
		}
	} else if(type === 15) { // StateHostFirmware - 15
		if(psize === 20) {
			payload = {
				build   : new Date(this._conv64BitTimeStampToMsec(pbuf, 0)),
				version : pbuf.readUInt32LE(16)
			};
		}
	} else if(type === 17) { // StateWifiInfo - 17
		if(psize === 14) {
			payload = {
				signal : pbuf.readFloatLE(0),
				tx     : pbuf.readUInt32LE(4),
				rx     : pbuf.readUInt32LE(8)
			};
		}
	} else if(type === 19) { // StateWifiFirmware - 19
		if(psize === 20) {
			payload = {
				build   : new Date(this._conv64BitTimeStampToMsec(pbuf, 0)),
				version : pbuf.readUInt32LE(16)
			};
		}
	} else if(type === 22) { // StatePower - 22
		if(psize === 2) {
			payload = {
				level : pbuf.readUInt16LE(0) ? 1 : 0
			};
		}
	} else if(type === 25) { // StateLabel - 25
		if(psize === 32) {
			payload = {
				label : this._convertBufferToString(pbuf)
			};
		}
	} else if(type === 33) { // StateVersion - 33
		if(psize === 12) {
			let vid = pbuf.readUInt32LE(0);
			let pid = pbuf.readUInt32LE(4);
			let hwv = pbuf.readUInt32LE(8);

			let v = null;
			for(let i=0; i<this._LIFX_PRODUCTS.length; i++) {
				let o = this._LIFX_PRODUCTS[i];
				if(o['vid'] === vid) {
					v = o;
					break;
				}
			}
			let vname = '';
			let pname = '';
			let features = null;
			if(v) {
				vname = v['name'];
				let p = null;
				for(let i=0; i<v['products'].length; i++) {
					let o = v['products'][i];
					if(o['pid'] === pid) {
						p = o;
						break;
					}
				}
				if(p) {
					pname = p['name'];
					features = p['features'];
				}
			}
			payload = {
				vendorId    : vid,
				vendorName  : vname,
				productId   : pid,
				productName : pname,
				hwVersion   : hwv,
				features    : features
			};
		}
	} else if(type === 35) { // StateInfo - 35
		if(psize === 24) {
			payload = {
				time     : new Date(this._conv64BitTimeStampToMsec(pbuf, 0)),
				uptime   : this._conv64BitTimeStampToMsec(pbuf, 8),  // msec
				downtime : this._conv64BitTimeStampToMsec(pbuf, 16)  // msec
			};
		}
	} else if(type === 50) { // StateLocation - 50
		if(psize === 56) {
			payload = {
				guid    : pbuf.slice(0, 16).toString('hex'),
				label   : this._convertBufferToString(pbuf.slice(16, 48)),
				updated : new Date(this._conv64BitTimeStampToMsec(pbuf, 48))
			};
		}
	} else if(type === 53) { // StateGroup - 53
		if(psize === 56) {
			payload = {
				guid    : pbuf.slice(0, 16).toString('hex'),
				label   : this._convertBufferToString(pbuf.slice(16, 48)),
				updated : new Date(this._conv64BitTimeStampToMsec(pbuf, 48))
			};
		}
	} else if(type === 59) { // EchoResponse - 59
		if(psize === 64) {
			payload = {
				text : this._convertBufferToString(pbuf)
			};
		}
	// ------------------------------------------------
	// Light Messages
	// ------------------------------------------------
	} else if(type === 107) { // State - 107
		if(psize === 52) {
			payload = {
				color : this._parseColor(pbuf.slice(0, 8)),
				power : pbuf.readUInt16LE(10) ? 1 : 0,
				label : this._convertBufferToString(pbuf.slice(12, 42)),
			};
		}
	} else if(type === 118) { // StatePower - 118
		if(psize === 2) {
			payload = {
				level : pbuf.readUInt16LE(0) ? 1 : 0
			};
		}
	} else if(type === 121) { // StateInfrared - 121
		if(psize === 2) {
			payload = {
				brightness : pbuf.readUInt16LE(0) / 65535
			};
		}
	// ------------------------------------------------
	// MultiZone Messages
	// ------------------------------------------------
	} else if(type === 503) { // StateZone - 503
		if(psize === 10) {
			payload = {
				count : pbuf.readUInt8(0),
				index : pbuf.readUInt8(1),
				color : this._parseColor(pbuf.slice(2, 10))
			};
		}
	} else if(type === 506) { // StateMultiZone - 506
		if(psize === 66) {
			let colors = [];
			for(let offset=2; offset<66; offset+=8) {
				let c = this._parseColor(pbuf.slice(offset, offset+8))
				colors.push(c);
			}
			payload = {
				count  : pbuf.readUInt8(0),
				index  : pbuf.readUInt8(1),
				colors : colors
			};
		}
	}
	return payload;
};

LifxLanParser.prototype._convertBufferToString = function(buf) {
	let str = '';
	let offset = 0;
	for(let i=0; i<buf.length; i++) {
		if(buf.readUInt8(i) === 0x00) {
			break;
		} else {
			offset = i;
		}
	}
	if(offset === 0) {
		return '';
	} else {
		return buf.slice(0, offset + 1).toString('utf8');
	}
};

LifxLanParser.prototype._parseColor = function(buf) {
	return {
		hue        : parseFloat((buf.readUInt16LE(0) / 65535).toFixed(5)),
		saturation : parseFloat((buf.readUInt16LE(2) / 65535).toFixed(5)),
		brightness : parseFloat((buf.readUInt16LE(4) / 65535).toFixed(5)),
		kelvin     : buf.readUInt16LE(6)
	};
};

LifxLanParser.prototype._conv64BitTimeStampToMsec = function(buf, offset) {
	let msec = buf.readUIntLE(offset + 2, 6) * (Math.pow(2, 16) / 1000000);
	return parseInt(msec, 10);
};

module.exports = new LifxLanParser();
