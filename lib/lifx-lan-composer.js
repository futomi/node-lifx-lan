/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-composer.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-07-01
* ---------------------------------------------------------------- */
'use strict';
const mCrypto = require('crypto');

/* ------------------------------------------------------------------
* Constructor: LifxLanParser()
* ---------------------------------------------------------------- */
const LifxLanComposer = function() {
	// Private
};

/* ------------------------------------------------------------------
* Method: compose(params)
* - params:
*   - type          | Required    | Integer | Message Type (e.g., 101)
*   - sequence      | Required    | Integer | Message sequence number
*   - ack_required  | Optional    | Boolean | Default value is `false`
*   - res_required  | Optional    | Boolean | Default value is `false`
*   - target        | Required    | String  | MAC Address
*   - tagged        | Optional    | Boolean | Deafult value is `false`
*   - source        | Required    | Integer | Source ID
*   - payload       | Conditional | Object  | Depends on the type
* ---------------------------------------------------------------- */
LifxLanComposer.prototype.compose = function(params) {
	let type = params['type'];
	let payload = params['payload'];
	let sequence = params['sequence'];
	let ack_required = params['ack_required'] ? 1 : 0;
	let res_required = params['res_required'] ? 1 : 0;
	let target = params['target'];
	let tagged = params['tagged'] ? 1 : 0;
	let source = params['source'];
	// Check parameters
	if(typeof(type) !== 'number' || type % 1 > 0) {
		return {error: new Error('The value of the parameter `type` is invalid.')};
	}

	let compose_payload_res = this._composePayload(type, payload);
	let payload_buf = null;
	if(compose_payload_res['error']) {
		return {error: compose_payload_res['error']};
	} else {
		payload_buf = compose_payload_res['buffer'];
	}

	if(typeof(sequence) !== 'number' || sequence % 1 !== 0) {
		return {error: new Error('The value of the parameter `sequence` is invalid.' + sequence)};
	}

	let target_parts = target.split(':');
	if(target_parts.length !== 6) {
		return {error: new Error('The value of the parameter `target` is invalid as a MAC address.')};
	}
	for(let i=0; i<target_parts.length; i++) {
		let v = target_parts[i];
		if(!/^[0-9a-fA-F]{2}$/.test(v)) {
			return {error: new Error('The value of the parameter `target` is invalid as a MAC address.')};
		}
		target_parts[i] = parseInt(v, 16);
	}

	if(source) {
		if(typeof(source) !== 'number' || source % 1 !== 0) {
			return {error: new Error('The value of the parameter `source` is invalid.')};
		}
	} else {
		return {error: new Error('The value of the parameter `source` is required.')};
	}

	// Frame
	let origin = 0;
	let addressable = 1;
	let protocol = 1024;

	let buf1 = Buffer.alloc(8);

	let buf1n2 = protocol | (origin << 14) | (tagged << 13) | (addressable << 12);
	buf1.writeUInt16LE(buf1n2, 2);
	buf1.writeUInt32LE(source, 4);

	// Frame Address
	let buf2 = Buffer.alloc(16);
	target_parts.forEach((v, i) => {
		buf2.writeUInt8(v, i);
	});

	let byte14 = (ack_required << 1) | res_required;
	buf2.writeUInt8(byte14, 14);
	buf2.writeUInt8(sequence, 15);

	// Protocol Header
	let buf3 = Buffer.alloc(12);
	buf3.writeUInt16LE(type, 8);

	let buf_list = [buf1, buf2, buf3];
	// Payload
	if(payload_buf) {
		buf_list.push(payload_buf);
	}

	let buf = Buffer.concat(buf_list);

	let size = buf.length;
	buf.writeUInt16LE(size, 0);

	// Multiple Responses
	let multi_res_total = compose_payload_res['multi_res_total'] || null;

	return {buffer: buf, multi_res_total};
};

LifxLanComposer.prototype._composePayload = function(type, payload) {
	if(type === 21) { // deviceSetPower
		return this._composePayload21(payload);
	} else if(type === 24) { // deviceSetLabel
		return this._composePayload24(payload);
	} else if(type === 49) { // deviceSetLocation
		return this._composePayload49(payload);
	} else if(type === 52) { // deviceSetGroup
		return this._composePayload52(payload);
	} else if(type === 58) { // deviceEchoRequest
		return this._composePayload58(payload);
	} else if(type === 102) { // lightSetColor
		return this._composePayload102(payload);
	} else if(type === 103) { // lightSetWaveform
		return this._composePayload103(payload);
	} else if(type === 117) { // lightSetPower
		return this._composePayload117(payload);
	} else if(type === 122) { // lightSetInfrared
		return this._composePayload122(payload);
	} else if(type === 501) { // multiZoneSetColorZones
		return this._composePayload501(payload);
	} else if(type === 502) { // multiZoneGetColorZones
		return this._composePayload502(payload);
	} else if(type === 703) { // tileSetUserPosition
		return this._composePayload703(payload);
	} else if(type === 707) { // tileGetTitleState64
		return this._composePayload707(payload);
	} else if(type === 715) { // tileSetTitleState64
		return this._composePayload715(payload);
	} else {
		return {buffer: null};
	}
};

/* ------------------------------------------------------------------
* Method: _composePayload21(payload) : deviceSetPower
* - payload:
*   - level | Integer | Required | 0 or 1
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload21 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `level`
	if(!('level' in payload)) {
		return {error: new Error('The `level` is required.')};
	}
	let level = payload['level'];
	if(typeof(level) !== 'number' || level % 1 !== 0) {
		return {error: new Error('The `level` must be an integer.')};
	} else if(!(level === 0 || level === 1)) {
		return {error: new Error('The `level` must be 0 or 1.')};
	}
	if(level === 1) {
		level = 0xffff; // 65535
	}
	// Compose a payload
	let buf = Buffer.alloc(2);
	buf.writeUInt16LE(level, 0);
	return {buffer: buf};
};

/* ------------------------------------------------------------------
* Method: _composePayload24(payload) : deviceSetLabel
* - payload:
*   - label | String | Required | up to 32 bytes in UTF-8 encoding
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload24 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `label`
	if(!('label' in payload)) {
		return {error: new Error('The `label` is required.')};
	}
	let label = payload['label'];
	if(typeof(label) !== 'string') {
		return {error: new Error('The `label` must be a string.')};
	} else if(label.length === 0) {
		return {error: new Error('The `label` must not be an empty string.')};
	} else if(Buffer.byteLength(label, 'utf8') > 32) {
		return {error: new Error('The `label` must be equal to or less than 32 bytes encoded in UTF-8')};
	}
	// Compose a payload
	let label_buf = Buffer.from(label, 'utf8');
	let padding_buf = Buffer.alloc(32 - label_buf.length);
	let buf = Buffer.concat([label_buf, padding_buf]);
	return {buffer: buf};
};

/* ------------------------------------------------------------------
* Method: _composePayload49(payload) : deviceSetLocation
* - payload:
*   - location | String | Optional | 16 bytes hex representation
*   - label    | String | Required | up to 32 bytes in UTF-8 encoding
*   - updated  | Date   | Optional | a JavaScript `Date` object
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload49 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `location`
	let location_buf = null;
	if('location' in payload) {
		let v = payload['location'];
		if(typeof(v) !== 'string' || v.length !== 32 || !/^([a-fA-F0-9]{2}){16}$/.test(v)) {
			return {error: new Error('The `location` must be a 16 bytes hex representation string.')};
		}
		location_buf = Buffer.alloc(16);
		for(let i=0; i<16; i++) {
			let n = parseInt(v.substr(i*2, 2), 16);
			location_buf.writeUInt8(n, i);
		}
	} else {
		location_buf = mCrypto.randomBytes(16);
	}
	// Check the `label`
	if(!('label' in payload)) {
		return {error: new Error('The `label` is required.')};
	}
	let label = payload['label'];
	if(typeof(label) !== 'string') {
		return {error: new Error('The `label` must be a string.')};
	} else if(label.length === 0) {
		return {error: new Error('The `label` must not be an empty string.')};
	} else if(Buffer.byteLength(label, 'utf8') > 32) {
		return {error: new Error('The `label` must be equal to or less than 32 bytes encoded in UTF-8')};
	}
	let label_buf = Buffer.from(label, 'utf8');
	let padding_buf = Buffer.alloc(32 - label_buf.length);
	label_buf = Buffer.concat([label_buf, padding_buf]);
	// Check the `updated`
	let updated = 0;
	if('updated' in payload) {
		let v = payload['updated'];
		if(typeof(v) === 'object' && v.constructor && v.constructor.name === 'Date') {
			updated = v.getTime() * 1000000;
		} else {
			return {error: new Error('The `updated` must not be a `Date` object.')};
		}
	} else {
		updated = (new Date()).getTime() * 1000000;
	}
	let updated_buf = Buffer.alloc(8);
	updated_buf.writeUIntLE(updated, 0, 8);
	// Compose a payload
	let buf = Buffer.concat([location_buf, label_buf, updated_buf]);
	return {buffer: buf};
};

/* ------------------------------------------------------------------
* Method: _composePayload52(payload) : deviceSetGroup
* - payload:
*   - group   | String | Optional | 16 bytes hex representation
*   - label   | String | Required | up to 32 bytes in UTF-8 encoding
*   - updated | Date   | Optional | a JavaScript `Date` object
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload52 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `group`
	let group_buf = null;
	if('group' in payload) {
		let v = payload['group'];
		if(typeof(v) !== 'string' || v.length !== 32 || !/^([a-fA-F0-9]{2}){16}$/.test(v)) {
			return {error: new Error('The `location` must be a 16 bytes hex representation string.')};
		}
		group_buf = Buffer.alloc(16);
		for(let i=0; i<16; i++) {
			let n = parseInt(v.substr(i*2, 2), 16);
			group_buf.writeUInt8(n, i);
		}
	} else {
		group_buf = mCrypto.randomBytes(16);
	}
	// Check the `label`
	if(!('label' in payload)) {
		return {error: new Error('The `label` is required.')};
	}
	let label = payload['label'];
	if(typeof(label) !== 'string') {
		return {error: new Error('The `label` must be a string.')};
	} else if(label.length === 0) {
		return {error: new Error('The `label` must not be an empty string.')};
	} else if(Buffer.byteLength(label, 'utf8') > 32) {
		return {error: new Error('The `label` must be equal to or less than 32 bytes encoded in UTF-8')};
	}
	let label_buf = Buffer.from(label, 'utf8');
	let padding_buf = Buffer.alloc(32 - label_buf.length);
	label_buf = Buffer.concat([label_buf, padding_buf]);
	// Check the `updated`
	let updated = 0;
	if('updated' in payload) {
		let v = payload['updated'];
		if(typeof(v) === 'object' && v.constructor && v.constructor.name === 'Date') {
			updated = v.getTime() * 1000000;
		} else {
			return {error: new Error('The `updated` must not be a `Date` object.')};
		}
	} else {
		updated = (new Date()).getTime() * 1000000;
	}
	let updated_buf = Buffer.alloc(8);
	updated_buf.writeUIntLE(updated, 0, 8);
	// Compose a payload
	let buf = Buffer.concat([group_buf, label_buf, updated_buf]);
	return {buffer: buf};
};

/* ------------------------------------------------------------------
* Method: _composePayload58(payload) : deviceEchoRequest
* - payload:
*   - text | String | Required | up to 64 bytes in UTF-8 encoding
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload58 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `text`
	if(!('text' in payload)) {
		return {error: new Error('The `text` is required.')};
		return;
	}
	let text = payload['text'];
	if(typeof(text) !== 'string') {
		return {error: new Error('The `text` must be a string.')};
	} else if(text.length === 0) {
		return {error: new Error('The `text` must not be an empty string.')};
	} else if(Buffer.byteLength(text, 'utf8') > 64) {
		return {error: new Error('The `text` must be equal to or less than 64 bytes encoded in UTF-8')};
	}
	// Compose a payload
	let text_buf = Buffer.from(text, 'utf8');
	let padding_buf = Buffer.alloc(64 - text_buf.length);
	let buf = Buffer.concat([text_buf, padding_buf]);
	return {buffer: buf};
};

/* ------------------------------------------------------------------
* Method: _composePayload102(payload) : lightSetColor
* - payload:
*   - color        | Object  | Required |
*     - hue        | Float   | Required | 0.0 - 1.0
*     - saturation | Float   | Required | 0.0 - 1.0
*     - brightness | Float   | Required | 0.0 - 1.0
*     - kelvin     | Float   | Required | 1500 - 9000
*   - duration     | Integer | Optional | The default value is 0 msec
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload102 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `color`
	if(!('color' in payload)) {
		return {error: new Error('The `color` is required.')};
	}
	let color_check_res = this._checkColorValues(payload['color']);
	if(color_check_res['error']) {
		return {error: color_check_res['error']};
	}
	let color = color_check_res['color'];
	// Check the `duration`
	let duration = 0;
	if('duration' in payload) {
		duration = payload['duration'];
		if(typeof(duration) !== 'number' || duration % 1 !== 0 || duration < 0 || duration > 65535) {
			return {error: new Error('The `duration` must be an integer between 0 and 65535.')};
		}
	}
	// Compose a payload
	let buf = Buffer.alloc(13);
	buf.writeUInt16LE(color['hue'], 1);
	buf.writeUInt16LE(color['saturation'], 3);
	buf.writeUInt16LE(color['brightness'], 5);
	buf.writeUInt16LE(color['kelvin'], 7);
	buf.writeUInt32LE(duration, 9);
	return {buffer: buf};
};

LifxLanComposer.prototype._checkColorValues = function(data) {
	let color = {
		hue        : 0,
		saturation : 0,
		brightness : 0
	};
	let color_key_list = Object.keys(color);
	for(let i=0; i<color_key_list.length; i++) {
		let k = color_key_list[i];
		if(k in data) {
			let v = data[k];
			if(typeof(v) !== 'number' || v < 0 || v > 1) {
				return {
					error: new Error('The `color.' + k + '` must be a float between 0.0 and 1.0.')
				};
			}
			color[k] = Math.round(v * 65535);
		} else {
			return {
				error: new Error('The `color.' + k + '` is required.')
			};
		}
	}
	let kelvin = 0;
	if('kelvin' in data) {
		kelvin = data['kelvin'];
		if(typeof(kelvin) !== 'number' || kelvin % 1 !== 0 || kelvin < 1500 || kelvin > 9000) {
			return {
				error: new Error('The `color.kelvin` must be an integer between 1500 and 9000.')
			};
		}
		color['kelvin'] = kelvin;
	} else {
		return {
			error: new Error('The `color.kelvin` is required.')
		};
	}
	return {color: color};
};

/* ------------------------------------------------------------------
* Method: _composePayload103(payload) : lightSetWaveform
* - payload:
*   - transient    | Integer | Required    | 0 or 1.
*   - color        | Object  | Required    |
*     - hue        | Float   | Required    | 0.0 - 1.0
*     - saturation | Float   | Required    | 0.0 - 1.0
*     - brightness | Float   | Required    | 0.0 - 1.0
*     - kelvin     | Float   | Required    | 1500 - 9000
*   - period       | Integer | Required    | milliseconds
*   - cycles       | Float   | Required    | Number of cycles
*   - skew_ratio   | Float   | Conditional | 0.0 - 1.0.
*                                            Required only when the `waveform` is 4 (PLUSE).
*   - waveform     | Integer | Required    | 0: SAW
*                                            1: SINE
*                                            2: HALF_SINE
*                                            3: TRIANGLE
*                                            4: PLUSE
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload103 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `transient`
	let transient = 0;
	if('transient' in payload) {
		transient = payload['transient'];
		if(typeof(transient) !== 'number' || !(transient === 0 || transient === 1)) {
			return {error: new Error('The `transient` must be 0 or 1.')};
		}
	} else {
		reject(new Error('The `transient` is required.'));
		return;
	}
	// Check the `color`
	if(!('color' in payload)) {
		return {error: new Error('The `color` is required.')};
	}
	let color_check_res = this._checkColorValues(payload['color']);
	if(color_check_res['error']) {
		return {error: color_check_res['error']};
	}
	let color = color_check_res['color'];
	// Check the `period`
	let period = 0;
	if('period' in payload) {
		period = payload['period'];
		if(typeof(period) !== 'number' || period % 1 !== 0 || period < 0 || period > 0xffffffff) {
			return {error: new Error('The `period` must be an integer between 0 and 0xffffffff.')};
		}
	} else {
		return {error: new Error('The `period` is required.')};
	}
	// Check the `cycles`
	let cycles = 0;
	if('cycles' in payload) {
		cycles = payload['cycles'];
		if(typeof(cycles) !== 'number') {
			return {error: new Error('The `cycles` must be a float.')};
		}
	} else {
		return {error: new Error('The `cycles` is required.')};
	}
	// Check the `waveform`
	let waveform = 0;
	if('waveform' in payload) {
		waveform = payload['waveform'];
		if(typeof(waveform) !== 'number' || !/^(0|1|2|3|4)$/.test(waveform.toString())) {
			return {error: new Error('The `waveform` must be 0, 1, 2, 3, or 4.')};
		}
	} else {
		return {error: new Error('The `waveform` is required.')};
	}
	// Check the `skew_ratio`
	let skew_ratio = 0;
	if(waveform === 4) {
		if('skew_ratio' in payload) {
			skew_ratio = payload['skew_ratio'];
			if(typeof(skew_ratio) !== 'number' || skew_ratio < 0 || skew_ratio > 1) {
				return {error: new Error('The `skew_ratio` must be a float between 0.0 and 1.0.')};
			}
			skew_ratio = skew_ratio * 65535 - 32768;
		} else {
			return {error: new Error('The `skew_ratio` is required.')};
		}
	}
	// Compose a payload
	let buf = Buffer.alloc(21);
	buf.writeUInt8(transient, 1);
	buf.writeUInt16LE(color['hue'], 2);
	buf.writeUInt16LE(color['saturation'], 4);
	buf.writeUInt16LE(color['brightness'], 6);
	buf.writeUInt16LE(color['kelvin'], 8);
	buf.writeUInt32LE(period, 10);
	buf.writeFloatLE(cycles, 14);
	buf.writeInt16LE(skew_ratio, 18);
	buf.writeUInt8(waveform, 20);
	return {buffer: buf};
};

/* ------------------------------------------------------------------
* Method: _composePayload117(payload) : lightSetPower
* - payload:
*   - level    | Integer | Required | 0 or 1
*   - duration | Integer | Optional | The default value is 0 msec.
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload117 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the parameter `level`
	if(!('level' in payload)) {
		return {error: new Error('The `level` is required.')};
	}
	let level = payload['level'];
	if(typeof(level) !== 'number' || level % 1 !== 0) {
		return {error: new Error('The value of the `level` must be an integer.')};
	} else if(!(level === 0 || level === 1)) {
		return {error: new Error('The value of the `level` must be 0 or 1.')};
	}
	if(level === 1) {
		level = 0xffff; // 65535
	}
	// check the parameter `duration`
	let duration = 0;
	if('duration' in payload) {
		let v = payload['duration'];
		if(typeof(v) === 'number' && v % 1 === 0 && v >= 0 && v <= 0xffffffff) {
			duration = v;
		} else {
			return {error: new Error('The value of the `duration` must be an integer between 0 and 65535.')};
		}
	}
	// Compose a payload
	let buf = Buffer.alloc(6);
	buf.writeUInt16LE(level, 0);
	buf.writeUInt32LE(duration, 2);
	return {buffer: buf};
};

/* ------------------------------------------------------------------
* Method: _composePayload122(payload) : lightSetInfrared
* - payload:
*   - brightness | Float | Required | 0.0 - 1.0
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload122 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `brightness`
	let brightness = 0;
	if('brightness' in payload) {
		brightness = payload['brightness'];
		if(typeof(brightness) !== 'number' || brightness < 0 || brightness > 1) {
			return {error: new Error('The value of the `brightness` must be a float between 0.0 and 1.0.')};
		}
	} else {
		return {error: new Error('The `brightness` is required.')};
	}
	brightness = Math.round(brightness * 65535);
	// Compose a payload
	let buf = Buffer.alloc(2);
	buf.writeUInt16LE(brightness, 0);
	return {buffer: buf};
};

/* ------------------------------------------------------------------
* Method: _composePayload501(payload) : multiZoneSetColorZones
* - payload:
*   - start        | Integer | Required | 0 - 255
*   - end          | Integer | Required | 0 - 255
*   - color        | Object  | Required |
*     - hue        | Float   | Required | 0.0 - 1.0
*     - saturation | Float   | Required | 0.0 - 1.0
*     - brightness | Float   | Required | 0.0 - 1.0
*     - kelvin     | Float   | Required | 1500 - 9000
*   - duration     | Integer | Optional | The default value is 0 msec
*   - apply        | Integer | Optional | The default value is 1.
*                                         0: NO_APPLY, 1: APPLY, 2: APPLY_ONLY
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload501 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `start`
	let start = 0;
	if('start' in payload) {
		start = payload['start'];
		if(typeof(start) !== 'number' || start % 1 !== 0 || start < 0 || start > 255) {
			return {error: new Error('The value of the `start` must be an integer between 0 and 255.')};
		}
	} else {
		return {error: new Error('The `start` is required.')};
	}
	// Check the `end`
	let end = 0;
	if('end' in payload) {
		end = payload['end'];
		if(typeof(end) !== 'number' || end % 1 !== 0 || end < 0 || end > 255) {
			return {error: new Error('The value of the `end` must be an integer between 0 and 255.')};
		}
	} else {
		return {error: new Error('The `end` is required.')};
	}
	if(start > end) {
		let s = start;
		start = end;
		end = s;
	}
	// Check the `color`
	if(!('color' in payload)) {
		return {error: new Error('The `color` is required.')};
	}
	let color_check_res = this._checkColorValues(payload['color']);
	if(color_check_res['error']) {
		return {error: color_check_res['error']};
	}
	let color = color_check_res['color'];
	// check the parameter `duration`
	let duration = 0;
	if('duration' in payload) {
		let v = payload['duration'];
		if(typeof(v) === 'number' && v % 1 === 0 && v >= 0 && v <= 0xffffffff) {
			duration = v;
		} else {
			return {error: new Error('The value of the `duration` must be an integer between 0 and 0xffffffff.')};
		}
	}
	// Check the `apply`
	let apply = 1;
	if('apply' in payload) {
		apply = payload['apply'];
		if(typeof(apply) !== 'number' || !/^(0|1|2)$/.test(apply.toString())) {
			return {error: new Error('The `apply` must be 0, 1, or 2.')};
		}
	}
	// Compose a payload
	let buf = Buffer.alloc(15);
	buf.writeUInt8(start, 0);
	buf.writeUInt8(end, 1);
	buf.writeUInt16LE(color['hue'], 2);
	buf.writeUInt16LE(color['saturation'], 4);
	buf.writeUInt16LE(color['brightness'], 6);
	buf.writeUInt16LE(color['kelvin'], 8);
	buf.writeUInt32LE(duration, 10);
	buf.writeUInt8(apply, 14);
	return {buffer: buf};
};

/* ------------------------------------------------------------------
* Method: _composePayload502(payload) : multiZoneGetColorZones
* - payload:
*   - start | Integer | Required | 0 - 255
*   - end   | Integer | Required | 0 - 255
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload502 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `start`
	let start = 0;
	if('start' in payload) {
		start = payload['start'];
		if(typeof(start) !== 'number' || start % 1 !== 0 || start < 0 || start > 255) {
			return {error: new Error('The value of the `start` must be an integer between 0 and 255.')};
		}
	}
	// Check the `end`
	let end = 0;
	if('end' in payload) {
		end = payload['end'];
		if(typeof(end) !== 'number' || end % 1 !== 0 || end < 0 || end > 255) {
			return {error: new Error('The value of the `end` must be an integer between 0 and 255.')};
		}
	}
	if(start > end) {
		let s = start;
		start = end;
		end = s;
	}
	// Compose a payload
	let buf = Buffer.alloc(2);
	buf.writeUInt8(start, 0);
	buf.writeUInt8(end, 1);
	return {buffer: buf};
};

/* ------------------------------------------------------------------
* Method: _composePayload703(payload) : tileSetUserPosition
* - payload:
*   - tile_index  | Integer | Required | Tile chain index
*   - user_x      | Float   | Required | Horizontal tile offset
*   - user_y      | Float   | Required | Vertical tile offset
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload703 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `tile_index`
	if(!('tile_index' in payload)) {
		return { error: new Error('The `tile_index` is required.') };
	}
	let tile_index = payload['tile_index'];
	if(typeof(tile_index) !== 'number' || tile_index % 1 !== 0 || tile_index < 0) {
		return {error: new Error('The value of `tile_index` must be an integer >= 0.')};
	}
	// Check the `user_x`
	if(!('user_x' in payload)) {
		return { error: new Error('The `user_x` is required.') };
	}
	let user_x = payload['user_x'];
	if(typeof(user_x) !== 'number') {
		return { error: new Error('The `user_x` must be a float.') };
	}
	// Check the `user_y`
	if(!('user_y' in payload)) {
		return { error: new Error('The `user_y` is required.') };
	}
	let user_y = payload['user_y'];
	if(typeof(user_y) !== 'number') {
		return { error: new Error('The `user_y` must be a float.') };
	}
	// Compose a payload
	const reserved = 0
	let buf = Buffer.alloc(11);
	buf.writeUInt8(tile_index, 0);
	buf.writeUInt16LE(reserved, 1);
	buf.writeFloatLE(user_x, 3);
	buf.writeFloatLE(user_y, 7);
	return {buffer: buf};
};

/* ------------------------------------------------------------------
* Method: _composePayload707(payload) : tileGetTileState64
* - payload:
*   - tile_index  | Integer | Required | Starting tile index
*   - length      | Integer | Optional | Tiles retrieved from/including tile_index (default: 1)
*   - x           | Integer | Optional | (default: 0)
*   - y           | Integer | Optional | (default: 0)
*   - width       | Integer | Optional | (default: 8)
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload707 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `tile_index`
	if(!('tile_index' in payload)) {
		return { error: new Error('The `tile_index` is required.') };
	}
	let tile_index = payload['tile_index'];
	if(typeof(tile_index) !== 'number' || tile_index % 1 !== 0 || tile_index < 0) {
		return {error: new Error('The value of `tile_index` must be an integer >= 0.')};
	}
	// Check the `length`
	let length = 1;
	if('length' in payload) {
		length = payload['length'];
		if(typeof(length) !== 'number' || length % 1 !== 0 || length < 1) {
			return {error: new Error('The value of `length` must be an integer >= 1.')};
		}
	}
	// Reserved
	let reserved = 0
	// Check the `x`
	let x = 0;
	if('x' in payload) {
		x = payload['x'];
		if(typeof(x) !== 'number' || x % 1 !== 0 || x < 0) {
			return {error: new Error('The value of `x` must be an integer >= 0.')};
		}
	}
	// Check the `y`
	let y = 0;
	if('y' in payload) {
		y = payload['y'];
		if(typeof(y) !== 'number' || y % 1 !== 0 || y < 0) {
			return {error: new Error('The value of `y` must be an integer >= 0.')};
		}
	}
	// Check the `width`
	let width = 8;
	if('width' in payload) {
		width = payload['width'];
		if(typeof(width) !== 'number' || width % 1 !== 0 || width < 0) {
			return {error: new Error('The value of `width` must be an integer >= 1.')};
		}
	}
	// Compose a payload
	let buf = Buffer.alloc(6);
	buf.writeUInt8(tile_index, 0);
	buf.writeUInt8(length, 1);
	buf.writeUInt8(reserved, 2);
	buf.writeUInt8(x, 3);
	buf.writeUInt8(y, 4);
	buf.writeUInt8(width, 5);
	return {buffer: buf, multi_res_total: length};
};

/* ------------------------------------------------------------------
* Method: _composePayload715(payload) : tileSetTileState64
* - payload:
*   - tile_index    | Integer       | Required | Starting tile index
*   - length        | Integer       | Optional | Tiles updated from/including tile_index (default: 1)
*   - x             | Integer       | Optional | (default: 0)
*   - y             | Integer       | Optional | (default: 0)
*   - width         | Integer       | Optional | (default: 8)
*   - duration      | Integer       | Optional | Duration in milliseconds (default: 0)
*   - colors        | Array[Object] | Required | Array of 64 HSBK objects
*     - hue         | Float   | Required | 0.0 - 1.0
*     - saturation  | Float   | Required | 0.0 - 1.0
*     - brightness  | Float   | Required | 0.0 - 1.0
*     - kelvin      | Float   | Required | 1500 - 9000
* ---------------------------------------------------------------- */
LifxLanComposer.prototype._composePayload715 = function(payload) {
	// Check the payload
	if(!payload || typeof(payload) !== 'object') {
		return {error: new Error('The `payload` is invalid.')};
	}
	// Check the `tile_index`
	if(!('tile_index' in payload)) {
		return { error: new Error('The `tile_index` is required.') };
	}
	let tile_index = payload['tile_index'];
	if(typeof(tile_index) !== 'number' || tile_index % 1 !== 0 || tile_index < 0) {
		return {error: new Error('The value of `tile_index` must be an integer >= 0.')};
	}
	// Check the `length`
	let length = 1;
	if('length' in payload) {
		length = payload['length'];
		if(typeof(length) !== 'number' || length % 1 !== 0 || length < 1) {
			return {error: new Error('The value of `length` must be an integer >= 1.')};
		}
	}
	// Reserved
	let reserved = 0
	// Check the `x`
	let x = 0;
	if('x' in payload) {
		x = payload['x'];
		if(typeof(x) !== 'number' || x % 1 !== 0 || x < 0) {
			return {error: new Error('The value of `x` must be an integer >= 0.')};
		}
	}
	// Check the `y`
	let y = 0;
	if('y' in payload) {
		y = payload['y'];
		if(typeof(y) !== 'number' || y % 1 !== 0 || y < 0) {
			return {error: new Error('The value of `y` must be an integer >= 0.')};
		}
	}
	// Check the `width`
	let width = 8;
	if('width' in payload) {
		width = payload['width'];
		if(typeof(width) !== 'number' || width % 1 !== 0 || width < 0) {
			return {error: new Error('The value of `width` must be an integer >= 1.')};
		}
	}
	// Check the `duration`
	let duration = 0;
	if('duration' in payload) {
		duration = payload['duration'];
		if(typeof(duration) !== 'number' || duration % 1 !== 0 || duration < 0 || duration > 65535) {
			return {error: new Error('The `duration` must be an integer between 0 and 65535.')};
		}
	}
	// Check the `colors`
	if(!('colors' in payload)) {
		return {error: new Error('The `colors` is required.')};
	}
	let colors = payload['colors']
	if (!Array.isArray(colors)) {
		return {error: new Error('The value of `colors` must be an array.')};
	}
	for (let i = 0; i < colors.length; i++) {
		let color_check_res = this._checkColorValues(colors[i]);
		if(color_check_res['error']) {
			return {error: color_check_res['error']};
		}
		colors[i] = color_check_res['color'];
	}
	// Compose a payload
	let buf = Buffer.alloc(10+512);
	buf.writeUInt8(tile_index, 0);
	buf.writeUInt8(length, 1);
	buf.writeUInt8(reserved, 2);
	buf.writeUInt8(x, 3);
	buf.writeUInt8(y, 4);
	buf.writeUInt8(width, 5);
	buf.writeUInt32LE(duration, 6);
	let i = 0
	for(let offset=10; offset<=(10+512-8); offset+=8) {
		let color = colors[i]
		buf.writeUInt16LE(color['hue'], offset);
		buf.writeUInt16LE(color['saturation'], offset+2);
		buf.writeUInt16LE(color['brightness'], offset+4);
		buf.writeUInt16LE(color['kelvin'], offset+6);
		i++
	}
	return {buffer: buf};
};

module.exports = new LifxLanComposer();
