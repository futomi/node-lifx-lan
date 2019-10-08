node-lifx-lan
===============

The node-lifx-lan is a Node.js module which allows you to communicate with the Wi-Fi LED smart light products "[LIFX](https://www.lifx.com/)" using the [LAN protocol](https://lan.developer.lifx.com/).

## Dependencies

* [Node.js](https://nodejs.org/en/) 6 +

## Installation

```
$ cd ~
$ npm install node-lifx-lan
```

---------------------------------------
## Table of Contents

* [Quick Start](#Quick-Start)
  * [Turn on all bulbs simultaneously](#Quick-Start-1)
  * [Turn on bulbs satisfying a filter](#Quick-Start-2)
  * [Turn on a bulb](#Quick-Start-3)
* [`LifxLan` object](#LifxLan-object)
  * [discover() method](#LifxLan-discover-method)
  * [turnOnBroadcast() method](#LifxLan-turnOnBroadcast-method)
  * [setColorBroadcast() method](#LifxLan-setColorBroadcast-method)
  * [turnOffBroadcast() method](#LifxLan-turnOffBroadcast-method)
  * [turnOnFilter() method](#LifxLan-turnOnFilter-method)
  * [setColorFilter() method](#LifxLan-setColorFilter-method)
  * [turnOffFilter() method](#LifxLan-turnOffFilter-method)
  * [destroy() method](#LifxLan-destroy-method)
  * [createDevice() method](#LifxLan-createDevice-method)
* [`LifxLanColor` object](#LifxLanColor-object)
  * [`LifxLanColorHSB` object](#LifxLanColorHSB-object)
  * [`LifxLanColorRGB` object](#LifxLanColorRGB-object)
  * [`LifxLanColorXyb` object](#LifxLanColorXyb-object)
  * [`LifxLanColorCSS` object](#LifxLanColorCSS-object)
* [`LifxLanFilter` object](#LifxLanFilter-object)
* [`LifxLanDevice` object](#LifxLanDevice-object)
  * [Properties](#LifxLanDevice-properties)
  * [turnOn() method](#LifxLanDevice-turnOn-method)
  * [setColor() method](#LifxLanDevice-setColor-method)
  * [turnOff() method](#LifxLanDevice-turnOff-method)
  * [getDeviceInfo() method](#LifxLanDevice-getDeviceInfo-method)
  * [getLightState() method](#LifxLanDevice-getLightState-method)
* [Low level methods in the `LifxLanDevice` object](#Low-level-methods)
  * [deviceGetService() method](#LifxLanDevice-deviceGetService-method)
  * [deviceGetHostInfo() method](#LifxLanDevice-deviceGetHostInfo-method)
  * [deviceGetHostFirmware() method](#LifxLanDevice-deviceGetHostFirmware-method)
  * [deviceGetWifiInfo() method](#LifxLanDevice-deviceGetWifiInfo-method)
  * [deviceGetWifiFirmware() method](#LifxLanDevice-deviceGetWifiFirmware-method)
  * [deviceGetPower() method](#LifxLanDevice-deviceGetPower-method)
  * [deviceSetPower() method](#LifxLanDevice-deviceSetPower-method)
  * [deviceGetLabel() method](#LifxLanDevice-deviceGetLabel-method)
  * [deviceSetLabel() method](#LifxLanDevice-deviceSetLabel-method)
  * [deviceGetVersion() method](#LifxLanDevice-deviceGetVersion-method)
  * [deviceGetInfo() method](#LifxLanDevice-deviceGetInfo-method)
  * [deviceGetLocation() method](#LifxLanDevice-deviceGetLocation-method)
  * [deviceSetLocation() method](#LifxLanDevice-deviceSetLocation-method)
  * [deviceGetGroup() method](#LifxLanDevice-deviceGetGroup-method)
  * [deviceSetGroup() method](#LifxLanDevice-deviceSetGroup-method)
  * [deviceEchoRequest() method](#LifxLanDevice-deviceEchoRequest-method)
  * [lightGet() method](#LifxLanDevice-lightGet-method)
  * [lightSetColor() method](#LifxLanDevice-lightSetColor-method)
  * [lightSetWaveform() method](#LifxLanDevice-lightSetWaveform-method)
  * [lightGetPower() method](#LifxLanDevice-lightGetPower-method)
  * [lightSetPower() method](#LifxLanDevice-lightSetPower-method)
  * [lightGetInfrared() method](#LifxLanDevice-lightGetInfrared-method)
  * [lightSetInfrared() method](#LifxLanDevice-lightSetInfrared-method)
  * [multiZoneSetColorZones() method](#LifxLanDevice-multiZoneSetColorZones-method)
  * [multiZoneGetColorZones() method](#LifxLanDevice-multiZoneGetColorZones-method)
  * [tileGetDeviceChain() method](#LifxLanDevice-tileGetDeviceChain-method)
  * [tileSetUserPosition() method](#LifxLanDevice-tileSetUserPosition-method)
  * [tileGetTileState64() method](#LifxLanDevice-tileGetTileState64-method)
  * [tileSetTileState64() method](#LifxLanDevice-tileSetTileState64-method)
  * [tileGetTiles() method](#LifxLanDevice-tileGetTiles-method)
  * [tileGetTilesAndBounds() method](#LifxLanDevice-tileGetTilesAndBounds-method)
* [Release Note](#Release-Note)
* [References](#References)
* [License](#License)

---------------------------------------
## <a id="Quick-Start">Quick Start</a>

### <a id="Quick-Start-1">Turn on all bulbs simultaneously</a>

The code below turns on all LIFX bulbs in the local network.

```JavaScript
// Create a LifxLan object
const Lifx  = require('node-lifx-lan');

// Turn on all LIFX bulbs in the local network
Lifx.turnOnBroadcast({
  color: {css: 'green'}
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="Quick-Start-2">Turn on bulbs satisfying a filter</a>

The code blow turns on LIFX bulbs whose group is `Room 1` in blue.


```JavaScript
// Create a LifxLan object
const Lifx  = require('node-lifx-lan');

// Discover LIFX bulbs in the local network
Lifx.discover().then(() => {
  // Turn on LIFX bulbs whose group is `Room 1` in blue
  return Lifx.turnOnFilter({
    filters: [{
      group: {label: 'Room 1',}
    }],
    color: {css: 'blue'}
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="Quick-Start-3">Turn on a bulbs</a>

The code below turns on a LIFX bulb found first in yellow.

```JavaScript
// Create a LifxLan object
const Lifx  = require('node-lifx-lan');

// Discover LIFX bulbs in the local network
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  if(!dev) {
    throw new Error('No bulb was found.');
  }
  // Turn on a LIFX bulb found first in yellow
  return dev.turnOn({
    color: {css: 'yellow'}
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

---------------------------------------
## <a id="LifxLan-object">`LifxLan` object</a>

In order to use the node-lifx-lan, you have to load the node-lifx-lan module as follows:

```JavaScript
const Lifx  = require('node-lifx-lan');
```

In the code snippet above, the variable `Lifx` is a `LifxLan` object. The `LifxLan` object has methods as described in the sections below.

### <a id="LifxLan-discover-method">`discover([params])` method</a>

The `discover()` method starts to scan LIFX bulbs in the local network. This method returns a `Promise` object. The discovery process completes successfully, a list of [`LifxLanDevice`](#LifxLanDevice-object) object will be passed to the `resolve()` function. The [`LifxLanDevice`](#LifxLanDevice-object) object represents a LIFX bulb.

This method takes a hash object containing the properties as follows:

Property | Type    | Requred  | Description
:--------|:--------|:---------|:-----------
`wait`   | Integer | Optional | Wait time of the discovery process. The unit is millisecond. The default value is `3000`.

Basically you don't need to pass the `wait` property to this method. In most cases, the default value `3000` works well.


```JavaScript
Lifx.discover().then((device_list) => {
  device_list.forEach((device) => {
    console.log([
      device['ip'],
      device['mac'],
      device['deviceInfo']['label']
    ].join(' | '));
  });
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```
192.168.10.5 | D0:73:D5:13:96:7E | LIFX Bulb 13967e
192.168.10.2 | D0:73:D5:25:A7:28 | LIFX A19 25A728
192.168.10.4 | D0:73:D5:25:36:B0 | LIFX Pls A19 2536B0
```

### <a id="LifxLan-turnOnBroadcast-method">turnOnBroadcast(*[params]*) method</a>

The `turnOnBroadcast()` method turns on all LIFX bulbs in the local network. This method sends a broadcast packet. Therefore, it turns on all bulbs pretty much simultaneously.

This method takes a hash object containing the properties as follows:

Property   | Type    | Requred  | Description
:----------|:------------|:---------|:-----------
`color`    | [`LifxLanColor`](#LifxLanColor-object) | Optional | a [`LifxLanColor`](#LifxLanColor-object) object representing a color
`duration` | Integer | Optional | Color transition time in milliseconds. The default value is `0`.

The code below turns on all LIFX bulb.

```JavaScript
Lifx.turnOnBroadcast().then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

The code below turns on all LIFX bulbs in red with 3 seconds color transition.

```JavaScript
Lifx.turnOnBroadcast({
  color: {css: 'red'},
  duration: 3000
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

Note that this method just sends a broadcast packet, it is agnostic on the results. If you need to turn on lights in a more reliable way, it is recommended to use the [`turnOnFilter()`](#LifxLan-turnOnFilter-method) method.


### <a id="LifxLan-setColorBroadcast-method">setColorBroadcast(*params*) method</a>

The `setColorBroadcast()` method changes color setting on all LIFX bulbs in the local network. This method sends a broadcast packet. Therefore, it changes the color setting on all bulbs pretty much simultaneously.

This method takes a hash object containing the properties as follows:

Property   | Type    | Requred  | Description
:----------|:------------|:---------|:-----------
`color`    | [`LifxLanColor`](#LifxLanColor-object) | Required | a [`LifxLanColor`](#LifxLanColor-object) object representing a color
`duration` | Integer | Optional | Color transition time in milliseconds. The default value is `0`.

The code below changes the color of all LIFX bulbs to blue.

```JavaScript
Lifx.setColorBroadcast({
  color: {css: 'blue'}
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

Note that this method just sends a broadcast packet, it is agnostic on the results. If you need to change the color setting in a more reliable way, it is recommended to use the [`setColorFilter()`](#LifxLan-setColorFilter-method) method.

### <a id="LifxLan-turnOffBroadcast-method">turnOffBroadcast(*[params]*) method</a>

The `turnOffBroadcast()` method turns off all LIFX bulbs in the local network. This method sends a broadcast packet. Therefore, it turns off all bulbs pretty much simultaneously.

This method takes a hash object containing the properties as follows:

Property   | Type    | Requred  | Description
:----------|:--------|:---------|:-----------
`duration` | Integer | Optional | Color transition time in milliseconds. The default value is `0`.

The code below turns off all LIFX bulbs with 3 seconds color transition.

```JavaScript
Lifx.turnOffBroadcast({
  duration: 3000
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

Note that this method just sends a broadcast packet, it is agnostic on the results. If you need to turn off lights in a more reliable way, it is recommended to use the [`turnOffFilter()`](#LifxLan-turnOnFilter-method) method.

### <a id="LifxLan-turnOnFilter-method">turnOnFilter(*[params]*) method</a>

The `turnOnFilter()` method turns on the LIFX bulbs satisfying the filters specified to this method.

This method takes a hash object containing the properties as follows:

Property   | Type    | Requred  | Description
:----------|:--------|:---------|:-----------
`filters`  | Array   | Optional | A list of [`LifxLanFilter`](#LifxLanFilter-object) object
`color`    | [`LifxLanColor`](#LifxLanColor-object) | Optional | A [`LifxLanColor`](#LifxLanColor-object) object representing a color
`duration` | Integer | Optional | Color transition time in milliseconds. The default value is `0`.

Be sure to call this method after calling the [`discover()`](#LifxLan-discover-method) method. Otherwise, no LIFX bulbs satisfying the filter will be found. That is, this method will result in error.

The code below turns on LIFX bulbs whose group is set to `Room 1`.

```JavaScript
Lifx.discover().then(() => {
  return Lifx.turnOnFilter({
    filters: [{
      group: {label: 'Room 1'},
    }]
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

The [`LifxLanFilter`](#LifxLanFilter-object) object supports some types of filter. See the section ["`LifxLanFilter` object"](#LifxLanFilter-object) for more details.

If the [`LifxLanFilter`](#LifxLanFilter-object) object is not passed to this method, all LIFX bulbs recognized by the [`discover()`](#LifxLan-discover-method) method will be turned on.

```JavaScript
Lifx.discover().then(() => {
  return Lifx.turnOnFilter();
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

Though the outcome of the code above is as same as the [`turnOnBroadcast()`](#LifxLan-turnOnBroadcast-method) method (all LIFX bulbs in the local network will be turned on), the prosess is completely different.

While the [`turnOnBroadcast()`](#LifxLan-turnOnBroadcast-method) method just sends a broadcast packet, the `turnOnFilter()` method sends a packet to each devices one by one and checks responses. Though this method takes more time than the [`turnOnBroadcast()`](#LifxLan-turnOnBroadcast-method) method, it turns on all bulbs in a more reliable way. That is, this method can let you know if an error was occurred.

### <a id="LifxLan-setColorFilter-method">setColorFilter(*params*) method</a>

The `setColorFilter()` method changes the color of the LIFX bulbs satisfying the filters specified to this method.

This method takes a hash object containing the properties as follows:

Property   | Type    | Requred  | Description
:----------|:--------|:---------|:-----------
`filters`  | Array   | Optional | A list of [`LifxLanFilter`](#LifxLanFilter-object) object
`color`    | [`LifxLanColor`](#LifxLanColor-object) | Required | a [`LifxLanColor`](#LifxLanColor-object) object representing a color
`duration` | Integer | Optional | Color transition time in milliseconds. The default value is `0`.

The code below changes the color of the LIFX bulbs whose label is set to `LIFX Pls A19 2536B0`.

```JavaScript
Lifx.discover().then((device_list) => {
  return Lifx.setColorFilter({
    filters: [{
      label: 'LIFX Pls A19 2536B0'
    }],
    color: {css: 'green'}
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

The [`LifxLanFilter`](#LifxLanFilter-object) object supports some types of filter. See the section ["`LifxLanFilter` object"](#LifxLanFilter-object) for more details.

If the [`LifxLanFilter`](#LifxLanFilter-object) object is not passed to this method, the color settings of all LIFX bulbs recognized by the [`discover()`](#LifxLan-discover-method) method will be changed.

```JavaScript
Lifx.discover().then((device_list) => {
  return Lifx.setColorFilter({
    color: {css: 'green'}
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

Though the outcome of the code above is as same as the [`setColorBroadcast()`](#LifxLan-setColorBroadcast-method) method (The color settings of all LIFX bulbs in the local network will be changed), the process is completely different.

While the [`setColorBroadcast()`](#LifxLan-setColorBroadcast-method) method just sends a broadcast packet, the `setColorFilter()` method sends a packet to each devices one by one and checks responses. Though this method takes more time than the [`setColorBroadcast()`](#LifxLan-setColorBroadcast-method) method, it changes the color settings on all bulbs in a more reliable way. That is, this method can let you know if an error was occurred.

### <a id="LifxLan-turnOffFilter-method">turnOffFilter(*[params]*) method</a>

The `turnOffFilter()` method turns off the LIFX bulbs satisfying the filters specified to this method.

This method takes a hash object containing the properties as follows:

Property   | Type    | Requred  | Description
:----------|:--------|:---------|:-----------
`filters`  | Array   | Optional | A list of [`LifxLanFilter`](#LifxLanFilter-object) object
`duration` | Integer | Optional | Color transition time in milliseconds. The default value is `0`.

Be sure to call this method after calling the [`discover()`](#LifxLan-discover-method) method. Otherwise, no LIFX bulbs satisfying the filter will be found. That is, this method will result in error.

The code below turns off LIFX bulbs whose group label is set to `Room 1`.

```JavaScript
Lifx.discover().then(() => {
  return Lifx.turnOffFilter({
    filters: [{
      group: {label: 'Room 1'},
    }]
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

The [`LifxLanFilter`](#LifxLanFilter-object) object supports some types of filter. See the section ["`LifxLanFilter` object"](#LifxLanFilter-object) for more details.

If the [`LifxLanFilter`](#LifxLanFilter-object) object is not passed to this method, all LIFX bulbs recognized by the [`discover()`](#LifxLan-discover-method) method will be turned off.

```JavaScript
Lifx.discover().then(() => {
  return Lifx.turnOffFilter();
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

Though the outcome of the code above is as same as the [`turnOffBroadcast()`](#LifxLan-turnOffBroadcast-method) method (all LIFX bulbs in the local network will be turned off), the prosess is completely different.

While the [`turnOffBroadcast()`](#LifxLan-turnOffBroadcast-method) method just sends a broadcast packet, the `turnOffFilter()` method sends a packet to each devices one by one and checks responses. Though this method takes more time than the [`turnOffBroadcast()`](#LifxLan-turnOffBroadcast-method) method, it turns off all bulbs in a more reliable way. That is, this method can let you know if an error was occurred.

### <a id="LifxLan-destroy-method">destroy() method</a>

The `destroy()` method closes the UDP socket, then disables the `LifxLan` object.

Once the node-lifx-lan module is loaded, the script can not finish automatically because UDP socket keeps to be open. Calling this method, the script can finish as expected.

```JavaScript
Lifx.destroy().then(() => {
  console.log('Bye!');
}).catch((error) => {
  console.error();
});
```

### <a id="LifxLan-createDevice-method">createDevice(*params*) method</a>

The `createDevice()` method creates a [`LifxLanDevice`](#LifxLanDevice-object) object.

The [`LifxLanDevice`](#LifxLanDevice-object) object can be obtained using the [`discover()`](#LifxLan-discover-method) method as well. However, if you have already known the IPv4 address and the MAC address of the device, this method allows you to obtain the [`LifxLanDevice`](#LifxLanDevice-object) object without the discovery process.

This method takes a hash object containing the properties as follows:

Property   | Type   | Requred  | Description
:----------|:-------|:---------|:-----------
`ip`       | String | Required | IPv4 address. (e.g., `"192.168.10.4"`)
`mac`      | String | Required | MAC address. (e.g., `"D0:73:D5:25:36:B0"`)

The code below creates a [`LifxLanDevice`](#LifxLanDevice-object) object and turns on the LIFX bulb:

```JavaScript
Lifx.createDevice({
  mac: 'D0:73:D5:25:36:B0',
  ip: '192.168.11.32'
}).then((dev) => {
  return dev.turnOn({
    color: { css: 'red' }
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

Note that the [`deviceInfo`](#LifxLanDevice-properties) property in a [`LifxLanDevice`](#LifxLanDevice-object) object created by this method is set to `null` by default. If you want to get the device information, call the [`getDeviceInfo()`](#LifxLanDevice-getDeviceInfo-method) method by yourself.

---------------------------------------
## <a id="LifxLanColor-object">`LifxLanColor` object</a>

The `LifxLanColor` object represents a color, which is just a hash object. It supports 4 expressions: HSB, RGB, xy/brightness, and CSS.

### <a id="LifxLanColorHSB-object">`LifxLanColorHSB` object</a>

Property     | Type    | Required    | Description
:------------|:--------|:------------|:-----------
`hue`        | Float   | Conditional | Hue in the range of 0.0 to 1.0.
`saturation` | Float   | Conditional | Saturation in the range of 0.0 to 1.0.
`brightness` | Float   | Conditional | Brightness in the range of 0.0 to 1.0.
`kelvin`     | Integer | Optional    | Color temperature (°) in the range of 1500 to 9000.

When the `LifxLanColorHSB` object is used for the [`LifxLan.turnOnBroadcast()`](#LifxLan-turnOnBroadcast-method), [`LifxLan.turnOffBroadcast()`](#LifxLan-turnOffBroadcast-method), and [`LifxLan.setColorBroadcast()`](#LifxLan-setColorBroadcast-method), the `hue`, `saturation`, and `brightness` properties are required. If the `kelvin` property is not specified, it is set to `3500`.

When the `LifxLanColorHSB` object is used for the [`lightSetColor()`](#LifxLanDevice-lightSetColor-method), the `hue`, `saturation`, `brightness`, and `kelvin` properties are required.

When the `LifxLanColorHSB` object is used for other methods, all properties are optional.

### <a id="LifxLanColorRGB-object">`LifxLanColorRGB` object</a>

Property     | Type    | Required    | Description
:------------|:--------|:------------|:-----------
`red`        | Float   | Conditional | Red component in the range of 0.0 to 1.0.
`green`      | Float   | Conditional | Green component in the range of 0.0 to 1.0.
`blue`       | Float   | Conditional | Blue component in the range of 0.0 to 1.0.
`brightness` | Float   | Optional    | Brightness in the range of 0.0 to 1.0.
`kelvin`     | Integer | Optional    | Color temperature (°) in the range of 1500 to 9000.

When the `LifxLanColorRGB` object is used for the [`LifxLan.turnOnBroadcast()`](#LifxLan-turnOnBroadcast-method), [`LifxLan.setColorBroadcast()`](#LifxLan-setColorBroadcast-method), [`LifxLanDevice.turnOn()`](#LifxLanDevice-turnOn-method), and [`LifxLanDevice.setColor()`](#LifxLanDevice-setColor-method), the `red`, `green`, and `blue` properties are required. If the `kelvin` property is not specified, it is set to `3500`.

When the `LifxLanColorRGB` object is used for other methods, all properties are optional.

The specified RGB is converted to HSB internally. If the `brightness` is specified, The B component in the HSB is replaced by the value of the `brightness`.

### <a id="LifxLanColorXyb-object">`LifxLanColorXyb` object</a>

Property      | Type    | Required    | Description
:-------------|:--------|:------------|:-----------
`x`           | Float   | Conditional | X value in the range of 0.0 to 1.0.
`y`           | Float   | Conditional | Y value in the range of 0.0 to 1.0.
`brightness`  | Float   | Conditional | Brightness in the range of 0.0 to 1.0.
`kelvin`      | Integer | Optional    | Color temperature (°) in the range of 1500 to 9000.

When the `LifxLanColorXyb` object is used for the [`LifxLan.turnOnBroadcast()`](#LifxLan-turnOnBroadcast-method), [`LifxLan.turnOffBroadcast()`](#LifxLan-turnOffBroadcast-method), and [`LifxLan.setColorBroadcast()`](#LifxLan-setColorBroadcast-method), the `x`, `y`, and `brightness` properties are required. If the `kelvin` property is not specified, it is set to `3500`.

When the `LifxLanColorXyb` object is used for other methods, all properties are optional.

### <a id="LifxLanColorCSS-object">`LifxLanColorCSS` object</a>

Property     | Type    | Required    | Description
:------------|:--------|:------------|:-----------
`css`        | String  | Conditional | CSS color (`"red"`, `"#ff0000"`, or `"rgb(255, 0, 0)"`)
`brightness` | Float   | Optional    | Brightness in the range of 0.0 to 1.0.
`kelvin`     | Integer | Optional    | Color temperature (°) in the range of 1500 to 9000.

The `css` property supports all of the named colors specified in the [W3C CSS Color Module Level 4](https://drafts.csswg.org/css-color/#named-colors), such as `"red"`, `"blue"`, `"blueviolet"`, etc.

In addition to the named colors, the `css` property supports CSS Hexadecimal color (e.g., `"#ff0000"`) and RGB color (e.g., `"rgb(255, 0, 0)"`). Note that the `css` property does **not** support CSS RGBA color (e.g., `"rgba(255, 0, 0, 1.0)"`) and HSL color (e.g., `"hsl(0, 100%, 100%)"`) and HSLA color (e.g., `"hsl(0, 100%, 100%, 1.0)"`).

When the `LifxLanColorCSS` object is used for the [`LifxLan.turnOnBroadcast()`](#LifxLan-turnOnBroadcast-method), [`LifxLan.setColorBroadcast()`](#LifxLan-setColorBroadcast-method), [`LifxLanDevice.turnOn()`](#LifxLanDevice-turnOn-method), and [`LifxLanDevice.setColor()`](#LifxLanDevice-setColor-method), the `css` property is required. If the `kelvin` property is not specified, it is set to `3500`.

When the `LifxLanColorCSS` object is used for other methods, the `css` property is optional.

The specified CSS is converted to RGB, finally to HSB internally. If the `brightness` is specified, The B component in the HSB is replaced by the value of the `brightness`.

---------------------------------------
## <a id="LifxLanFilter-object">`LifxLanFilter` object</a>

The `LifxLanFilter` object represents a filter, which is just a hash object. It is used for the [`LifxLan.turnOnFilter()`](#LifxLan-turnOnFilter-method), [`LifxLan.turnOffFilter()`](#LifxLan-turnOffFilter-method), and [`LifxLan.setColorFilter()`](#LifxLan-setColorFilter-method) methods.


Property      | Type    | Required | Description
:-------------|:--------|:---------|:-----------
`label`       | String  | Optional | Label of bulb
`productId`   | Integer | Optional | [Product ID](https://lan.developer.lifx.com/v2.0/docs/lifx-products)
`features`    | Object  | Optional |
+`color`     | Boolean | Optional | If the bulb has [color capability](https://lan.developer.lifx.com/v2.0/docs/lifx-products), the value is `true`. Otherwise, `false`.
+`infrared`  | Boolean | Optional | If the bulb has [infrared capability](https://lan.developer.lifx.com/v2.0/docs/lifx-products), the value is `true`. Otherwise, `false`.
+`multizone` | Boolean | Optional | If the bulb has [multizone capability](https://lan.developer.lifx.com/v2.0/docs/lifx-products), the value is `true`. Otherwise, `false`.
+`chain`     | Boolean | Optional | If the bulb has [chain capability](https://lan.developer.lifx.com/v2.0/docs/lifx-products), the value is `true`. Otherwise, `false`.
`group`       | Object  | Optional |
+`guid`      | String  | Optional | GUID of group
+`label`     | String  | Optional | Label of group
`location`    | Object  | Optional |
+`guid`      | String  | Optional | GUID of location
+`label`     | String  | Optional | Label of location

As you can see the table above, all of the properties are optional. No `LifxLanFilter` means no filter. That is, all bulbs are targeted.

```JavaScript
{
  productId: 29
}
```

The filter above limits to bulbs whose product ID is `29` ([LIFX + A19](https://lan.developer.lifx.com/v2.0/docs/lifx-products)).

You can specify multiple properties:

```JavaScript
{
  features: {infrared: true},
  group   : {label: 'Room 1'}
}
```

The filter above limits to bulbs which have infrared capability **AND** whose group label is equivalent to `Room 1`. Note that multiple properties means AND condition.

The methods supporting filter takes filters as a list of the `LifxLanFilter` object.

```JavaScript
Lifx.turnOnFilter({
  filters: [
    {group: {label: 'Room 1'}},
    {group: {label: 'Room 2'}}
  ]
});
```

Multiple `LifxLanFilter` objects means OR condition. The code above turns on the LIFX bulbs whose group label equivalent to `Room 1` **OR** `Room 2`.

---------------------------------------
## <a id="LifxLanDevice-object">`LifxLanDevice` object</a>

The `LifxLanDevice` object represents a LIFX bulb, which is created through the discovery process triggered by the [`LifxLan.discover()`](#LifxLan-discover-method) method. This section describes the properties and methods implemented in this object.

### <a id="LifxLanDevice-properties">Properties</a>

The `LifxLanDevice` object supports the properties as follows:

Property      | Type    | Description
:-------------|:--------|:-----------
`ip`          | String  | IP address. (e.g., `"192.168.10.4"`)
`mac`         | String  | MAC address. (e.g., `"D0:73:D5:25:36:B0"`)
`deviceInfo`  | Object  |
+`label`     | String  | Label of the bulb.
+`vendorId`  | Integer | [Vendor ID](https://lan.developer.lifx.com/v2.0/docs/lifx-products). The value is always `1`.
+`productId` | Integer  | [Product ID](https://lan.developer.lifx.com/v2.0/docs/lifx-products). The value depends on the product.
+`productName` | String | Product name. The value depends on the product.
+`hwVersion`   | Integer | Hardware version number.
+`features`    | Object  |
++`color`      | Boolean | The bulb has color capability, the value is `true`. Otherwise, `false`.
++`infrared`   | Boolean | The bulb has infrared capability, the value is `true`. Otherwise, `false`.
++`multizone`  | Boolean | The bulb has multizone capability, the value is `true`. Otherwise, `false`.
++`chain`      | Boolean | The bulb has chain capability, the value is `true`. Otherwise, `false`.
+`location`    | Object  |
++`guid`       | String  | GUID of location.
++`label`      | String  | Label of location.
++`updated`    | `Date`  | A JavaScript `Date` object representing the date and time when the location was updated.
+`group`       | Object  |
++`guid`       | String  | GUID of group.
++`label`      | String  | Label of group.
++`updated`    | `Date`  | A JavaScript `Date` object representing the date and time when the group was updated.
+`multizone`   | Object  | If the bulb does not have multizone capability, the value is `null`.
++`count`      | Integer | Number of zone.
+`chain`       | Object  | If the bulb does not have chain capability, the value is `null`.
++`start_index`  | Integer | Starting tile index.
++`total_count`  | Integer | Total number of tiles from `start_index`.
++`tile_devices` | Array   | A list of [Tile](https://lan.developer.lifx.com/docs/tile-messages#section-tile) objects.

The code below discovers LIFX bulbs, then shows the structure of the  `deviceInfo` of one of the found bulbs:

```JavaScript
Lifx.discover().then((device_list) => {
  let device = device_list[0];
  console.log(JSON.stringify(device.deviceInfo, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output as follows:

```JavaScript
{
  "label": "LIFX Bulb 14b048",
  "vendorId": 1,
  "vendorName": "LIFX",
  "productId": 31,
  "productName": "LIFX Z",
  "hwVersion": 0,
  "features": {
    "color": true,
    "infrared": false,
    "multizone": true
  },
  "location": {
    "guid": "1ec285bd7b3bf739107d668f58f3668b",
    "label": "My Home",
    "updated": "2017-10-14T13:48:24.918Z"
  },
  "group": {
    "guid": "b4cfbfe12a8527cef9c95f159f67dfe6",
    "label": "Room 1",
    "updated": "2017-10-14T13:48:24.979Z"
  },
  "multizone": {
    "count": 16
  },
  "chain": null
}
```

### <a id="LifxLanDevice-turnOn-method">turnOn(*[params]*) method</a>

The `turnOn()` method turns on the LIFX bulb. This method returns a `Promise` object. This method takes a hash object as an argument containing properties as follows:

Property   | Type    | Requred  | Description
:----------|:--------|:---------|:-----------
`color`    | [`LifxLanColor`](#LifxLanColor-object) | Optional | A [`LifxLanColor`](#LifxLanColor-object) object representing a color
`duration` | Integer | Optional | Color transition time in milliseconds. The default value is `0`.

The code below turns on the LIFX bulb in green with 3 seconds color transition:

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.turnOn({
    color: {css: 'green'},
    duration: 3000
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-setColor-method">setColor(*params*) method</a>

The `setColor()` method changes the color setting of the LIFX bulb. This method returns a `Promise` object. This method takes a hash object containing the properties as follows:

Property   | Type    | Requred  | Description
:----------|:--------|:---------|:-----------
`color`    | [`LifxLanColor`](#LifxLanColor-object) | Optional | A [`LifxLanColor`](#LifxLanColor-object) object representing a color
`duration` | Integer | Optional | Color transition time in milliseconds. The default value is `0`.

The code below changes the color setting of the LIFX bulb to blue with 3 seconds color transition:

```JavaScript
Lifx.discover({wait:3000}).then((device_list) => {
  let dev = device_list[0];
  return dev.setColor({
    color: {
      hue: 0.5,
      saturation: 1.0,
      brightness: 0.3
    },
    duration: 3000
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-turnOff-method">turnOff(*[params]*) method</a>

The `turnOff()` method turns off the LIFX bulb. This method returns a `Promise` object. This method takes a hash object containing the properties as follows:

Property   | Type    | Required  | Description
:----------|:--------|:---------|:-----------
`duration` | Integer | Optional | Color transition time in milliseconds. The default value is `0`.

The code below turns off the LIFX bulb with 3 seconds color transition:

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.turnOff({
    duration: 3000
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-getDeviceInfo-method">getDeviceInfo() method</a>

The `getDeviceInfo()` method fetches the device information from the LIFX bulb. This method returns a `Promise` object.

If the information is fetched successfully, a hash object containing the information will be passed to the `resolve()` function. The hash object has the properties as follows:

Property      | Type    | Description
:-------------|:--------|:-----------
`label`       | String  | Label of the bulb.
`vendorId`    | Integer | [Vendor ID](https://lan.developer.lifx.com/v2.0/docs/lifx-products). The value is always `1`.
`productId`   | Integer  | [Product ID](https://lan.developer.lifx.com/v2.0/docs/lifx-products). The value depends on the product.
`productName` | String | Product name. The value depends on the product.
`hwVersion`   | Integer | Hardware version number.
`features`    | Object  |
+`color`     | Boolean | The bulb has color capability, the value is `true`. Otherwise, `false`.
+`infrared`  | Boolean | The bulb has infrared capability, the value is `true`. Otherwise, `false`.
+`multizone` | Boolean | The bulb has multizone capability, the value is `true`. Otherwise, `false`.
`location`    | Object  |
+`guid`      | String  | GUID of location.
+`label`     | String  | Label of location.
+`updated`   | `Date`  | A JavaScript `Date` object representing the date and time when the location was updated.
`group`       | Object  |
+`guid`      | String  | GUID of group.
+`label`     | String  | Label of group.
+`updated`   | `Date`  | A JavaScript `Date` object representing the date and time when the group was updated.
`multizone`   | Object  | If the bulb does not have multizone capability, the value is `null`.
+`count`     | Integer | Number of zone.
`chain`         | Object  | If the bulb does not have chain capability, the value is `null`.
+`start_index`  | Integer | Starting tile index.
+`total_count`  | Integer | Total number of tiles from `start_index`.
+`tile_devices` | Array  | A list of [Tile](https://lan.developer.lifx.com/docs/tile-messages#section-tile) objects.


```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.getDeviceInfo();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "label": "LIFX Bulb 14b048",
  "vendorId": 1,
  "vendorName": "LIFX",
  "productId": 31,
  "productName": "LIFX Z",
  "hwVersion": 0,
  "features": {
    "color": true,
    "infrared": false,
    "multizone": true,
    "chain": false
  },
  "location": {
    "guid": "1ec285bd7b3bf739107d668f58f3668b",
    "label": "My Home",
    "updated": "2017-10-14T13:48:24.918Z"
  },
  "group": {
    "guid": "b4cfbfe12a8527cef9c95f159f67dfe6",
    "label": "Room 1",
    "updated": "2017-10-14T13:48:24.979Z"
  },
  "multizone": {
    "count": 16
  },
  "chain": null
}
```

### <a id="LifxLanDevice-getLightState-method">getLightState() method</a>

The `getLightState()` method fetches the current state of the LIFX bulb. This method returns a `Promise` object.

If the information is fetched successfully, a hash object containing the information will be passed to the `resolve()` function. The hash object has the properties as follows:

Property       | Type    | Description
:--------------|:--------|:-----------
`color`        | Object  |
+`hue`        | Float   | Hue in the range of 0.0 to 1.0.
+`saturation` | Float   | Saturation in the range of 0.0 to 1.0.
+`brightness` | Float   | Brightness in the range of 0.0 to 1.0.
+`kelvin`     | Integer | Color temperature (°) in the range of 1500 to 9000.
`power`        | Integer | If the bulb is turned on, the value is `true`. Otherwise, the value is `false`.
`label`        | String  | The label of the bulb.
`infrared`     | Object  | If the bulb does not have infrared capability, the value is `null`.
+`brightness` | Float   | Infrared brightness in the range of 0.0 to 1.0.
`multizone`    | Object  | If the bulb does not have multizone capability, the value is `null`.
+`count`      | Integer | Number of zone.
+`colors`     | Array   |
++`hue`       | Float   | Hue in the range of 0.0 to 1.0.
++`saturation`| Float   | Saturation in the range of 0.0 to 1.0.
++`brightness`| Float   | Brightness in the range of 0.0 to 1.0.
++`kelvin`    | Integer | Color temperature (°) in the range of 1500 to 9000.
`chain`        | Object       | If the bulb does not have chain capability, the value is `null`.
+`count`       | Integer      | Number of chained devices.
+`colors`      | Array[Array] | Array of device color arrays.
+++`hue`       | Float        | Hue in the range of 0.0 to 1.0.
+++`saturation`| Float        | Saturation in the range of 0.0 to 1.0.
+++`brightness`| Float        | Brightness in the range of 0.0 to 1.0.
+++`kelvin`    | Integer      | Color temperature (°) in the range of 1500 to 9000.

The code below shows the state of the LIFX bulb:

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.getLightState();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "color": {
    "hue": 0,
    "saturation": 1,
    "brightness": 1,
    "kelvin": 3500
  },
  "power": 1,
  "label": "LIFX bulb 14b048",
  "infrared": null,
  "multizone": {
    "count": 16,
    "colors": [
      {
        "hue": 0,
        "saturation": 1,
        "brightness": 1,
        "kelvin": 3500
      },
      {
        "hue": 0,
        "saturation": 1,
        "brightness": 1,
        "kelvin": 3500
      },
      ...
    ]
  }
}
```

---------------------------------------
## <a id="Low-level-methods">Low level methods in the `LifxLanDevice` object</a>

Other than the methods described above, the [`LifxLanDevice`](#LifxLanDevice-object) has low-level methods. The low-level methods based on the command packets specified in the [LIFX Lan Protocol](#https://lan.developer.lifx.com/docs). Each command is assigned to a method. Actually, the high-level methods described above are just a combination of some low-level methods. Using the low-level methods, you can develop more sophisticated actions.

### <a id="LifxLanDevice-deviceGetService-method">deviceGetService() method</a>

The `deviceGetService()` method fetches the service information exposed by the bulb [[GetService - 2](https://lan.developer.lifx.com/docs/device-messages#section-getservice-2)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateService - 3](https://lan.developer.lifx.com/docs/device-messages#section-stateservice-3)]:

Property  | Type    | Description
:---------|:--------|:-----------
`service` | Integer | The value is always `1` which means UDP.
`port`    | Integer | UDP port number.

Actually, the result of this method is useless. This command is usually used for the discovery process.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceGetService();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "service": 1,
  "port": 56700
}
```

### <a id="LifxLanDevice-deviceGetHostInfo-method">deviceGetHostInfo() method</a>

The `deviceGetHostInfo()` method fetches the host MCU information exposed by the bulb [[GetHostInfo - 12](https://lan.developer.lifx.com/docs/device-messages#section-gethostinfo-12)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateHostInfo - 13](https://lan.developer.lifx.com/docs/device-messages#section-statehostinfo-13)]:

Property | Type    | Description
:--------|:--------|:-----------
`signal` | Integer | Radio receive signal strength in milliWatts.
`tx`     | Integer | Bytes transmitted since power on.
`rx`     | Integer | Bytes received since power on.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceGetHostInfo();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "signal": 0,
  "tx": 0,
  "rx": 0
}
```

### <a id="LifxLanDevice-deviceGetHostFirmware-method">deviceGetHostFirmware() method</a>

The `deviceGetHostFirmware()` method fetches the host MCU firmware information exposed by the bulb [[GetHostFirmware - 14](https://lan.developer.lifx.com/docs/device-messages#section-gethostfirmware-14)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateHostFirmware - 15](https://lan.developer.lifx.com/docs/device-messages#section-statehostfirmware-15)]:

Property  | Type    | Description
:---------|:--------|:-----------
`build `  | `Date`  | Firmware build time
`version` | Integer | Firmware version.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceGetHostFirmware();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "build": "2017-08-09T00:12:50.000Z",
  "version": 65558
}
```

### <a id="LifxLanDevice-deviceGetWifiInfo-method">deviceGetWifiInfo() method</a>

The `deviceGetWifiInfo()` method fetches the Wifi subsystem information exposed by the bulb [[GetWifiInfo - 16](https://lan.developer.lifx.com/docs/device-messages#section-getwifiinfo-16)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateWifiInfo - 17](https://lan.developer.lifx.com/docs/device-messages#section-statewifiinfo-17)]:

Property | Type    | Description
:--------|:--------|:-----------
`signal` | Integer | Radio receive signal strength in milliWatts.
`tx`     | Integer | Bytes transmitted since power on.
`rx`     | Integer | Bytes received since power on.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceGetWifiInfo();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "signal": 46,
  "tx": 2158016404,
  "rx": 2158016404
}
```

### <a id="LifxLanDevice-deviceGetWifiFirmware-method">deviceGetWifiFirmware() method</a>

The `deviceGetWifiFirmware()` method fetches the Wifi subsystem information exposed by the bulb [[GetWifiFirmware - 18](https://lan.developer.lifx.com/docs/device-messages#section-getwififirmware-18)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateWifiFirmware - 19](https://lan.developer.lifx.com/docs/device-messages#section-statewififirmware-19)]:

Property  | Type    | Description
:---------|:--------|:-----------
`build `  | `Date`  | Firmware build time
`version` | Integer | Firmware version.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceGetWifiFirmware();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "build": "1970-01-01T00:00:00.000Z",
  "version": 0
}
```

### <a id="LifxLanDevice-deviceGetPower-method">deviceGetPower() method</a>

The `deviceGetPower()` method fetches the power status exposed by the bulb [[GetPower - 20](https://lan.developer.lifx.com/docs/device-messages#section-getpower-20)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StatePower - 22](https://lan.developer.lifx.com/docs/device-messages#section-statepower-22)]:

Property  | Type    | Description
:---------|:--------|:-----------
`level `  | Integer | If the bulb is powered on, the value is `1`. Otherwise, the value is `0`.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceGetPower();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "level": 1
}
```

### <a id="LifxLanDevice-deviceSetPower-method">deviceSetPower(*params*) method</a>

The `deviceSetPower()` method set the device power level [[SetPower - 21](https://lan.developer.lifx.com/docs/device-messages#section-setpower-21)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property | Type    | Requred  | Description
:--------|:--------|:---------|:-----------
`level`  | Integer | Required | `0` (off) or `1` (on).

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceSetPower({
    level: 1
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-deviceGetLabel-method">deviceGetLabel() method</a>

The `deviceGetLabel()` method fetches the device label exposed by the bulb [[GetLabel - 23](https://lan.developer.lifx.com/docs/device-messages#section-getlabel-23)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateLabel - 25](https://lan.developer.lifx.com/docs/device-messages#section-statelabel-25)]:

Property  | Type   | Description
:---------|:-------|:-----------
`label `  | String | Device label.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceGetLabel();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "label": "LIFX Pls A19 2536B0"
}
```

### <a id="LifxLanDevice-deviceSetLabel-method">deviceSetLabel(*params*) method</a>

The `deviceSetLabel()` method set the device label text [[SetLabel - 24](https://lan.developer.lifx.com/docs/device-messages#section-setlabel-24)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property | Type    | Requred  | Description
:--------|:--------|:---------|:-----------
`label`  | String  | Required | Device label text (up to 32 bytes in UTF-8 encoding).

```JavaScript
Lifx.discover().then((device_list) => {
  dev = device_list[0];
  return dev.deviceSetLabel({
    label: 'My desk light'
  });
}).then((res) => {
  console.log('done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-deviceGetVersion-method">deviceGetVersion() method</a>

The `deviceGetVersion()` method fetches the device label exposed by the bulb [[GetVersion - 32](https://lan.developer.lifx.com/docs/device-messages#section-getversion-32)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateVersion - 33](https://lan.developer.lifx.com/docs/device-messages#section-stateversion-33)]:

Property      | Type    | Description
:-------------|:--------|:-----------
`vendorId`    | Integer | Vendor ID.
`vendorName`  | String  | Vendor name.
`productId`   | Integer | Product ID.
`productName` | String  | Product name.
`hwVersion`   | Integer | Hardware version.
`features`    | Object  |
+`color`     | Boolean | If the bulb has color capability, the value is `true`. Otherwise, the value is `false`.
+`infrared`  | Boolean | If the bulb has infrared capability, the value is `true`. Otherwise, the value is `false`.
+`multizone` | Boolean | If the bulb has multizone capability, the value is `true`. Otherwise, the value is `false`.
+`chain`     | Boolean | If the bulb has chain capability, the value is `true`. Otherwise, the value is `false`.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceGetVersion();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "vendorId": 1,
  "vendorName": "LIFX",
  "productId": 29,
  "productName": "LIFX+ A19",
  "hwVersion": 0,
  "features": {
    "color": true,
    "infrared": true,
    "multizone": false,
    "chain": false
  }
}
```

### <a id="LifxLanDevice-deviceGetInfo-method">deviceGetInfo() method</a>

The `deviceGetInfo()` method fetches the run-time information exposed by the bulb [[GetInfo - 34](https://lan.developer.lifx.com/docs/device-messages#section-getinfo-34)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateInfo - 35](https://lan.developer.lifx.com/docs/device-messages#section-stateinfo-35)]:

Property   | Type    | Description
:----------|:--------|:-----------
`time`     | `Date`  | Cueent time.
`uptime`   | Integer | Time since last power on (relative time in millisecond)
`downtime` | Integer | Last power off period, 5 second accuracy (in millisecond)

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceGetInfo();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "time": "2017-10-21T01:55:21.090Z",
  "uptime": 38843404,
  "downtime": 0
}
```

### <a id="LifxLanDevice-deviceGetLocation-method">deviceGetLocation() method</a>

The `deviceGetLocation()` method fetches the location information exposed by the bulb [[GetLocation - 48](https://lan.developer.lifx.com/docs/device-messages#section-getlocation-48)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateLocation - 50](https://lan.developer.lifx.com/docs/device-messages#section-statelocation-50)]:

Property | Type   | Description
:--------|:-------|:-----------
`guid`   | String | GUID of location.
`label`  | String | Label of location.
`updated`| `Date` | UTC timestamp of last label update.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceGetLocation();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "guid": "1ec285bd7b3bf739107d668f58f3668b",
  "label": "My Home",
  "updated": "2017-10-14T13:48:24.918Z"
}
```

### <a id="LifxLanDevice-deviceSetLocation-method">deviceSetLocation(*params*) method</a>

The `deviceSetLocation()` method set the device location [[SetLocation - 49](https://lan.developer.lifx.com/docs/device-messages#section-setlocation-49)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property   | Type    | Requred  | Description
:----------|:--------|:---------|:-----------
`location` | String  | Optional | GUID of location (16 bytes hex representation). If this property is not specified, this method generates a rondom GUID.
`label`    | String | Required | Text label for location (up to 32 bytes in UTF-8 encoding)
`updated`  | `Date` | Optional | UTC timestamp of last label update. If this property is not specified, this method set this value to the current time.

```JavaScript
Lifx.discover().then((device_list) => {
  dev = device_list[0];
  return dev.deviceSetLocation({
    label: 'My Studio',
  });
}).then((res) => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-deviceGetGroup-method">deviceGetGroup() method</a>

The `deviceGetGroup()` method fetches the location information exposed by the bulb [[GetGroup - 51](https://lan.developer.lifx.com/docs/device-messages#section-getgroup-51)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateGroup - 53](https://lan.developer.lifx.com/docs/device-messages#section-stategroup-53)]:

Property | Type   | Description
:--------|:-------|:-----------
`guid`   | String | GUID of group.
`label`  | String | Label of group.
`updated`| `Date` | UTC timestamp of last group update.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceGetGroup();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "guid": "b4cfbfe12a8527cef9c95f159f67dfe6",
  "label": "Room 1",
  "updated": "2017-10-14T13:48:24.979Z"
}
```

### <a id="LifxLanDevice-deviceSetGroup-method">deviceSetGroup(*params*) method</a>

The `deviceSetGroup()` method set the device group [[SetGroup - 52](https://lan.developer.lifx.com/docs/device-messages#section-setgroup-52)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property   | Type   | Requred  | Description
:----------|:-------|:---------|:-----------
`group`    | String | Optional | GUID of group (16 bytes hex representation). If this property is not specified, this method generates a rondom GUID.
`label`    | String | Required | Text label for group (up to 32 bytes in UTF-8 encoding)
`updated`  | `Date` | Optional | UTC timestamp of last label update. If this property is not specified, this method set this value to the current time.

```JavaScript
Lifx.discover().then((device_list) => {
  dev = device_list[0];
  return dev.deviceSetGroup({
    label: 'My Desk'
  });
}).then((res) => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-deviceEchoRequest-method">deviceEchoRequest() method</a>

The `deviceEchoRequest()` method requests a text echo-back to the bulb [[EchoRequest - 58](https://lan.developer.lifx.com/docs/device-messages#section-echorequest-58)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property | Type   | Requred  | Description
:--------|:-------|:---------|:-----------
`text`   | String | Required | An arbitrary string (up to 64 bytes in UTF-8 encoding)

Note that this method accepts only text though the LIFX LAN protocol specification says that you can send binary data,

If this method send a request successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[EchoResponse - 59](https://lan.developer.lifx.com/docs/device-messages#section-echoresponse-59)]:

Property | Type   | Description
:--------|:-------|:-----------
`text`   | String | The text echoed back by the bulb.


```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.deviceEchoRequest({
    text: 'Bonjour, ça va bien ?'
  });
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "text": "Bonjour, ça va bien ?"
}
```

### <a id="LifxLanDevice-lightGet-method">lightGet() method</a>

The `lightGet()` method fetches the light state  exposed by the bulb [[Get - 101](https://lan.developer.lifx.com/docs/light-messages#section-get-101)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[State - 107](https://lan.developer.lifx.com/docs/light-messages#section-state-107)]:

Property | Type   | Description
:--------|:-------|:-----------
`color`  | [`LifxLanColorHSB`](#LifxLanColorHSB-object) | HSB color information.
`power`  | Integer | `0` (off) or `1` (on)
`label`  | String  | Text label of the bulb.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.lightGet();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "color": {
    "hue": 0.66407,
    "saturation": 1,
    "brightness": 1,
    "kelvin": 3500
  },
  "power": 1,
  "label": "LIFX A19 25A728"
}
```

### <a id="LifxLanDevice-lightSetColor-method">lightSetColor() method</a>

The `lightSetColor()` method changes the light state [[SetColor - 102](https://lan.developer.lifx.com/docs/light-messages#section-setcolor-102)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property   | Type    | Requred  | Description
:----------|:--------|:---------|:-----------
`color`    | [`LifxLanColorHSB`](#LifxLanColorHSB-object) | Required | HSB color information.
`duration` | Integer | Optional | Color transition time in milliseconds. The default value is `0`.

Note that `hue`, `saturation`, `brightness`, and `kelvin` properties in the [`LifxLanColorHSB`](#LifxLanColorHSB-object) are all required in this method.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.lightSetColor({
    color   : {
      hue        : 0.16,
      saturation : 1.0,
      brightness : 1.0,
      kelvin     : 5000
    },
    duration: 1.0
  });
}).then((res) => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-lightSetWaveform-method">lightSetWaveform() method</a>

The `lightSetWaveform()` method apples an waveform effect to the bulb [[SetWaveform - 103](https://lan.developer.lifx.com/docs/light-messages#section-setwaveform-103)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property     | Type    | Requred     | Description
:------------|:--------|:------------|:-----------
`transient`  | Integer | Required    | `0` or `1`. If the value is `0`, the color will stay as the new color after the effect is performed. If the value is `1`,  the color will return to the original color after the effect.
`color`      | [`LifxLanColorHSB`](#LifxLanColorHSB-object) | Required | HSB color information.
`period`     | Integer | Required    | Duration of a cycle in milliseconds.
`cycles`     | Float   | Required    | Number of cycles.
`skew_ratio` | Float   | Conditional | `0.0` - `1.0`. Required only when the `waveform` is `4` (PLUSE).
`waveform`   | Integer | Required    | `0`: SAW, `1`: SINE, `2`: HALF_SINE, `3`: TRIANGLE, `4`: PLUSE.

Note that `hue`, `saturation`, `brightness`, and `kelvin` properties in the [`LifxLanColorHSB`](#LifxLanColorHSB-object) are all required in this method.

See the [LIFX official page](https://lan.developer.lifx.com/docs/waveforms) for more information on waveforms.

```JavaScript
Lifx.discover({wait:3000}).then((device_list) => {
  dev = device_list[0];
  // Set the color to yellow
  return dev.lightSetColor({
    color   : {
      hue        : 0.16,
      saturation : 1.0,
      brightness : 1.0,
      kelvin     : 3500
    },
    duration: 0.0
  });
}).then(() => {
  // Set the waveform effect
  return dev.lightSetWaveform({
    transient  : 1,
    color      : { // Red
      hue        : 1.0,
      saturation : 1.0,
      brightness : 1.0,
      kelvin     : 3500
    },
    period     : 10000,
    cycles     : 10,
    waveform   : 1 // SINE
  });
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-lightGetPower-method">lightGetPower() method</a>

The `lightGetPower()` method fetches the power level exposed by the bulb [[GetPower - 116](https://lan.developer.lifx.com/docs/light-messages#section-getpower-116)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StatePower - 118](https://lan.developer.lifx.com/docs/light-messages#section-statepower-118)]:

Property | Type   | Description
:--------|:-------|:-----------
`level`  | Integer | `0` (off) or `1` (on)

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.lightGetPower();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "level": 1
}
```

### <a id="LifxLanDevice-lightSetPower-method">lightSetPower(*params*) method</a>

The `lightSetPower()` method changes the power level [[SetPower - 117](https://lan.developer.lifx.com/docs/light-messages#section-setpower-117)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property   | Type    | Requred  | Description
:----------|:--------|:---------|:-----------
`level`    | Integer | Required | `0` (off) or `1` (on)
`duration` | Integer | Optional | Power level transition time in milliseconds. The default value is `0`.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.lightSetPower({
    level: 1,
    duration: 3000
  });
}).then((res) => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-lightGetInfrared-method">lightGetInfrared() method</a>

The `lightGetInfrared()` method fetches the current maximum power level of the Infrared channel exposed by the bulb [[GetInfrared - 120](https://lan.developer.lifx.com/docs/light-messages#section-getinfrared-120)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateInfrared - 121](https://lan.developer.lifx.com/docs/light-messages#section-stateinfrared-121)]:

Property     | Type  | Description
:------------|:------|:-----------
`brightness` | Float | Brightness for the infrared channel (0.0 - 1.0).

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.lightGetInfrared();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "brightness": 1
}
```

### <a id="LifxLanDevice-lightSetInfrared-method">lightSetInfrared(*params*) method</a>

The `lightSetInfrared()` method alters the current maximum brightness for the infrared channel [[SetInfrared - 122](https://lan.developer.lifx.com/docs/light-messages#section-setinfrared-122)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property   | Type    | Requred  | Description
:----------|:--------|:---------|:-----------
`brightness` | Float | Brightness for the infrared channel (0.0 - 1.0).

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.lightSetInfrared({
    brightness: 1.0
  });
}).then((res) => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-multiZoneSetColorZones-method">multiZoneSetColorZones(*params*) method</a>

The `multiZoneSetColorZones()` method changes the color of either a single or multiple zones [[SetColorZones - 501](https://lan.developer.lifx.com/docs/multizone-messages#section-setcolorzones-501)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property   | Type    | Requred  | Description
:----------|:--------|:---------|:-----------
`start`    | Integer | Required | Start index of zone (0 - 127).
`end`      | Integer | Required | End index of zone (0 - 127).
`color`    | [`LifxLanColor`](#LifxLanColor-object) | Required | Color of the zone(s)
`duration` | Integer | Optional | Color transition time in milliseconds. The default value is `0`.
`apply`    | Integer | Optional | `0`: NO_APPLY, `1`: APPLY (default), `2`: APPLY_ONLY

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.multiZoneSetColorZones({
    start    : 0,
    end      : 7,
    color    : {
      hue        : 0.35,
      saturation : 1.0,
      brightness : 1.0,
      kelvin     : 3500
    },
    duration : 0,
    apply    : 1
  });
}).then((res) => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

### <a id="LifxLanDevice-multiZoneGetColorZones-method">multiZoneGetColorZones(*params*) method</a>

The `multiZoneGetColorZones()` method fetches the zone colors for a range of zones exposed by the bulb [[GetColorZones - 502](https://lan.developer.lifx.com/docs/multizone-messages#section-getcolorzones-502)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property | Type    | Requred  | Description
:--------|:--------|:---------|:-----------
`start`  | Integer | Required | Start index of zone (0 - 127).
`end`    | Integer | Required | End index of zone (0 - 127).

If the value of the `start` is less than the `end` and this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateMultiZone - 506](https://lan.developer.lifx.com/docs/multizone-messages#section-statemultizone-506)]:

Property | Type    | Description
:--------|:--------|:-----------
`count`  | Integer | The count of the total number of zones available on the device
`index`  | Integer | The index of `colors[0]`.
`colors` | Array   | A list of the [`LifxLanColorHSB`](#LifxLanColorHSB-object) object.

```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.multiZoneGetColorZones({
    start : 0,
    end   : 7
  });
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "count": 16,
  "index": 0,
  "colors": [
    {
      "hue": 0,
      "saturation": 1,
      "brightness": 1,
      "kelvin": 3500
    },
    {
      "hue": 0,
      "saturation": 1,
      "brightness": 1,
      "kelvin": 3500
    },
    ...
  ]
}
```

Note that the actual number of elements in the `colors` is 8.

If the value of the `start` is equivalent to the `end` and this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateZone - 503](https://lan.developer.lifx.com/docs/multizone-messages#section-statezone-503)]:

Property | Type    | Description
:--------|:--------|:-----------
`count`  | Integer | The count of the total number of zones available on the device
`index`  | Integer | The index of `colors[0]`.
`color`  | [`LifxLanColorHSB`](#LifxLanColorHSB-object) | HSB color information.


```JavaScript
Lifx.discover().then((device_list) => {
  let dev = device_list[0];
  return dev.multiZoneGetColorZones({
    start : 3,
    end   : 3
  });
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output the result as follows:

```JavaScript
{
  "count": 16,
  "index": 3,
  "color": {
    "hue": 0,
    "saturation": 1,
    "brightness": 1,
    "kelvin": 3500
  }
}
```

### <a id="LifxLanDevice-tileGetDeviceChain-method">tileGetDeviceChain() method</a>

The `tileGetDeviceChain()` method returns information about the tiles in the chain [[GetDeviceChain - 701](https://lan.developer.lifx.com/docs/tile-messages#section-getdevicechain-701)]. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows [[StateDeviceChain - 702](https://lan.developer.lifx.com/docs/tile-messages#section-statedevicechain-702)]:

Property       | Type    | Description
:--------------|:--------|:-----------
`start_index`  | Integer | Starting tile index
`tile_devices` | Array   | A list of [Tile](https://lan.developer.lifx.com/docs/tile-messages#section-tile) objects
`total_count`  | Integer | Total number of tiles from `start_index`

```JavaScript
Lifx.discover().then((device_list) => {
  let tileProductId = 55;
  let firstTile = (dev) =>
    dev.deviceInfo.productId === tileProductId
  let dev = device_list.find(firstTile);
  return dev.tileGetDeviceChain();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch(console.error);
```

The code above will output results as follows:

```JavaScript
{
  "start_index": 0,
  "tile_devices": [
    {
      "accel_meas_x": 138,
      "accel_meas_y": -86,
      "accel_meas_z": 2054,
      "user_x": 0,
      "user_y": 0,
      "width": 8,
      "height": 8,
      "device_version_vendor": 1,
      "device_version_product": 55,
      "device_version_version": 10,
      "firmware_build": "1548977726000000000n",
      "firmware_version_minor": 50,
      "firmware_version_major": 3
    },
    ...
  ],
  "total_count": 5
}
```

Note that the actual number of elements in the `tile_devices` array is 16.

As calling `discover()` automatically retrieves `chain` information for all relevant devices, the previous example could also be rewritten as follows to output the same information:

```JavaScript
Lifx.discover().then((device_list) => {
  let tileProductId = 55;
  let firstTile = (dev) =>
    dev.deviceInfo.productId === tileProductId
  let dev = device_list.find(firstTile);
  let chain = dev.deviceInfo.chain
  console.log(JSON.stringify(chain, null, '  '));
}).catch(console.error);
```

### <a id="LifxLanDevice-tileSetUserPosition-method">tileSetUserPosition(*params*) method</a>

The `tileSetUserPosition()` method updates tile position offsets [[SetUserPosition - 703](https://lan.developer.lifx.com/docs/tile-messages#section-setuserposition-703)]. This method returns a `Promise` object.

> ⚠️ **Warning!**<br>Make sure you have read and fully understand the [Tile Control](https://lan.developer.lifx.com/v2.0/docs/tile-control) documentation before setting these values, as doing so may greatly upset users if you get it wrong.

This method takes a hash object as an argument containing properties as follows:

Property      | Type    | Required | Description
:-------------|:--------|:---------|:-----------
`tile_index`  | Integer | Required | Tile chain index
`user_x`      | Float   | Required | Horizontal tile offset
`user_y`      | Float   | Required | Vertical tile offset

```JavaScript
Lifx.discover().then((device_list) => {
  let tileProductId = 55;
  let firstTile = (dev) =>
    dev.deviceInfo.productId === tileProductId
  let dev = device_list.find(firstTile);
  return dev.tileSetUserPosition({
    tile_index: 0,
    user_x: -0.5,
    user_y: 1
  });
}).then((res) => {
  console.log('Done!');
}).catch(console.error);
```

### <a id="LifxLanDevice-tileGetTileState64-method">tileGetTileState64(*params*) method</a>

The `tileGetTileState64()` method returns the state of `length` number of tiles starting from `tile_index` [[GetTileState64 - 707](https://lan.developer.lifx.com/docs/tile-messages#section-gettilestate64-707)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property      | Type    | Required | Description
:-------------|:--------|:---------|:-----------
`tile_index`  | Integer | Required | Starting tile index
`length`      | Integer | Optional | Tiles retrieved from/including `tile_index` (default: `1`)
`x`           | Integer | Optional | (default: `0`)
`y`           | Integer | Optional | (default: `0`)
`width`       | Integer | Optional | (default: `8`)

> **Note:** While `x`, `y` and `width` properties are provided, the [LIFX documentation](https://lan.developer.lifx.com/docs/tile-messages#section-gettilestate64-707) states it only makes sense to set `x` and `y` to `0`, and width to `8`.

If this method fetches the information successfully, an array of hash objects—separate responses from each tile—will be passed to the resolve() function. Each hash object contains the following properties [[StateTileState64 - 711](https://lan.developer.lifx.com/docs/tile-messages#section-statetilestate64-711)]:

Property      | Type    | Description
:-------------|:--------|:-----------
`tile_index`  | Integer | Tile chain index
`x`           | Integer |
`y`           | Integer |
`width`       | Integer |
`colors`      | Array   |
+`hue`        | Float   | Hue in the range of 0.0 to 1.0.
+`saturation` | Float   | Saturation in the range of 0.0 to 1.0.
+`brightness` | Float   | Brightness in the range of 0.0 to 1.0.
+`kelvin`     | Integer | Color temperature (°) in the range of 1500 to 9000.

```JavaScript
Lifx.discover().then((device_list) => {
  let tileProductId = 55;
  let firstTile = (dev) =>
    dev.deviceInfo.productId === tileProductId
  let dev = device_list.find(firstTile);
  return dev.tileGetTileState64({
    tile_index: 0,
    length: 5
  });
}).then((multi_res) => {
  console.log(JSON.stringify(multi_res, null, '  '));
}).catch(console.error);
```

The code above will output results as follows:

```JavaScript
[
  {
    "tile_index": 0,
    "x": 0,
    "y": 0,
    "width": 8,
    "colors": [
      {
        "hue": 0.38889,
        "saturation": 1,
        "brightness": 0.10001,
        "kelvin": 9000
      },
      ...
    ]
   ]
  },
  {
    "tile_index": 1,
    "x": 0,
    "y": 0,
    "width": 8,
    "colors": [
      {
        "hue": 0.29619,
        "saturation": 1,
        "brightness": 0,
        "kelvin": 9000
      },
      ...
    ]
  },
  ...
}
```

Note that the actual number of elements in each `colors` array is 64.

### <a id="LifxLanDevice-tileSetTileState64-method">tileSetTileState64(*params*) method</a>

The `tileSetTileState64()` method updates the state of `length` number of tiles starting from `tile_index` [[SetTileState64 - 715](https://lan.developer.lifx.com/docs/tile-messages#section-settilestate64-715)]. This method returns a `Promise` object.

This method takes a hash object as an argument containing properties as follows:

Property      | Type    | Required | Description
:-------------|:--------|:---------|:-----------
`tile_index`  | Integer | Required | Starting tile index
`length`      | Integer | Optional | Tiles updated from/including `tile_index` (default: `1`)
`x`           | Integer | Optional | (default: `0`)
`y`           | Integer | Optional | (default: `0`)
`width`       | Integer | Optional | (default: `8`)
`duration`    | Integer | Optional | Color transition time in milliseconds (default: `0`)
`colors`      | Array   | Required | Array of 64 [HSBK](https://lan.developer.lifx.com/v2.0/docs/light-messages#section-hsbk) color objects

> **Note:** While `x`, `y` and `width` properties are provided, the [LIFX documentation](https://lan.developer.lifx.com/docs/tile-messages#section-settilestate64-715) states it only makes sense to set `x` and `y` to `0`, and width to `8`.

```JavaScript
Lifx.discover().then((device_list) => {
  let tileProductId = 55;
  let firstTile = (dev) =>
    dev.deviceInfo.productId === tileProductId
  let dev = device_list.find(firstTile);
  return dev.tileSetTileState64({
    tile_index: 0,
    colors: [...Array(64)].map(() => ({
      hue: Math.floor(Math.random() * 360)/360,
      saturation: 1,
      brightness: Math.random(),
      kelvin: 3000
    }))
  });
}).then((res) => {
  console.log('Done!');
}).catch(console.error);
```

### <a id="LifxLanDevice-tileGetTiles-method">tileGetTiles() method</a>

The `tileGetTiles()` method wraps the [`tileGetDeviceChain()`](#LifxLanDevice-tileGetDeviceChain-method) method to return only the physically connected tiles in the device chain. This method returns a `Promise` object.

If this method fetches the information successfully, an array of hash objects will be passed to the resolve() function. Each hash object is a [Tile](https://lan.developer.lifx.com/docs/tile-messages#section-tile) object with the following additional properties injected:

Property       | Type    | Description
:--------------|:--------|:-----------
`tile_index`   | Integer | Tile chain index
`left`         | Float   | Tile left x value (calculated via `user_x`)
`right`        | Float   | Tile right x value (calculated via `user_x`)
`top`          | Float   | Tile top y value (calculated via `user_y`)
`bottom`       | Float   | Tile bottom y value (calculated via `user_y`)

```JavaScript
Lifx.discover().then((device_list) => {
  let tileProductId = 55;
  let firstTile = (dev) =>
    dev.deviceInfo.productId === tileProductId
  let dev = device_list.find(firstTile);
  return dev.tileGetTiles();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

The code above will output results as follows:

```JavaScript
[
  {
    "tile_index": 0,
    "left": 4,
    "right": 12,
    "top": -4,
    "bottom": 4,
    "accel_meas_x": 152,
    "accel_meas_y": -71,
    "accel_meas_z": 2053,
    "user_x": 0,
    "user_y": 0,
    "width": 8,
    "height": 8,
    "device_version_vendor": 1,
    "device_version_product": 55,
    "device_version_version": 10,
    "firmware_build": "1548977726000000000n",
    "firmware_version_minor": 50,
    "firmware_version_major": 3
  },
  ...
]
```

Note that the actual number of elements in the returned array equals however many are physically connected in the device chain.

### <a id="LifxLanDevice-tileGetTilesAndBounds-method">tileGetTilesAndBounds() method</a>

The `tileGetTilesAndBounds()` method wraps the [`tileGetTiles()`](#LifxLanDevice-tileGetTiles-method) method to also return a spatial bounds object for all the physically connected tiles in the device chain. This method returns a `Promise` object.

If this method fetches the information successfully, a hash object will be passed to the `resolve()` function. The hash object contains the properties as follows:

Property  | Type    | Description
:---------|:--------|:-----------
`tiles`   | Array   | Array returned by the [`tileGetTiles()`](#LifxLanDevice-tileGetTiles-method) method
`bounds`  | Object  |
+`left`   | Float   | Minimum `left` value for all tiles
+`right`  | Float   | Maximum `right` value for all tiles
+`top`    | Float   | Minimum `top` value for all tiles
+`bottom` | Float   | Maximum `bottom` values for all tiles
+`width`  | Float   | The `right` value minus the `left` value
+`width`  | Float   | The `bottom` value minus the `top` value

```JavaScript
Lifx.discover().then((device_list) => {
  let tileProductId = 55;
  let firstTile = (dev) =>
    dev.deviceInfo.productId === tileProductId
  let dev = device_list.find(firstTile);
  return dev.tileGetTilesAndBounds();
}).then((res) => {
  console.log(JSON.stringify(res, null, '  '));
}).catch((error) => {
  console.error(error);
});
```

```JavaScript
{
  "tiles": [
    {
      "tile_index": 0,
      "left": 4,
      "right": 12,
      "top": -4,
      "bottom": 4,
      "accel_meas_x": 158,
      "accel_meas_y": -96,
      "accel_meas_z": 2065,
      "user_x": 0,
      "user_y": 0,
      "width": 8,
      "height": 8,
      "device_version_vendor": 1,
      "device_version_product": 55,
      "device_version_version": 10,
      "firmware_build": "1548977726000000000n",
      "firmware_version_minor": 50,
      "firmware_version_major": 3
    },
    ...
  ],
  "bounds": {
    "left": -4,
    "right": 12,
    "top": -20,
    "bottom": 4,
    "width": 16,
    "height": 24
  }
}
```

Note that the actual number of elements in the `tiles` array equals however many are physically connected in the device chain. 

---------------------------------------
## <a id="Release-Note">Release Note</a>

* v0.4.0 (2019-10-08)
  * Supported the [tile messages](https://lan.developer.lifx.com/docs/tile-messages) (thanks to [@furey](https://github.com/futomi/node-lifx-lan/pull/19))
* v0.3.1 (2018-09-17)
  * The lower limit of the `kelvin` property in the `LifxLanColor` object was changed from 2500 to 1500. (thanks to [@nikteg](https://github.com/futomi/node-lifx-lan/pull/12))
* v0.3.0 (2018-08-08)
  * Added the `brightness` parameter to the [`LifxLanColorCSS`](#LifxLanColorCSS-object) and [`LifxLanColorRGB`](#LifxLanColorRGB-object) object. (thanks to [@paolotremadio](https://github.com/futomi/node-lifx-lan/issues/11))
* v0.2.2 (2018-08-07)
  * The [`multiZoneSetColorZones()`](#LifxLanDevice-multiZoneSetColorZones-method) method did not accept a [`LifxLanColor`](#LifxLanColor-object) object for the `color` parameter even though this document says the method does. The method accepted only a [`LifxLanColorHSB`](#LifxLanColorHSB-object) object. Now the method accepts a [`LifxLanColor`](#LifxLanColor-object) object for the parameter. That is, the method accepts not only a [`LifxLanColorHSB`](#LifxLanColorHSB-object) object but also a [`LifxLanColorRGB`](#LifxLanColorRGB-object), [`LifxLanColorXyb`](#LifxLanColorXyb-object), and [`LifxLanColorCSS`](#LifxLanColorCSS-object) object. (thanks to [@paolotremadio](https://github.com/futomi/node-lifx-lan/issues/11))
* v0.2.1 (2018-07-10)
  * Updated the `products.json`. (Thanks to [@danielHHHH](https://github.com/futomi/node-lifx-lan/issues/9))
* v0.2.0 (2018-07-01)
  * Supported multihomed host. Now, you can discover devices expectedly even if your host computer has multiple network interfaces because broadcast packets are sent to all available network interfaces.
* v0.1.0 (2018-06-10)
  * Newly added the [`createDevice()`](#LifxLan-createDevice-method) method. (Thanks to [@MarcGodard](https://github.com/futomi/node-lifx-lan/issues/4))
* v0.0.3 (2018-06-09)
  * Supported Node.js v10. (Thanks to [@VanCoding](https://github.com/futomi/node-lifx-lan/pull/3))
* v0.0.2 (2018-02-12)
  * Updated [`product.json`](https://github.com/futomi/node-lifx-lan/blob/master/lib/products.json) based on the latest [LIFX product ID list table](https://lan.developer.lifx.com/docs/lifx-products)
* v0.0.1 (2017-10-22)
  * First public release

---------------------------------------
## <a id="References">References</a>

* [LIFX](https://www.lifx.com/)
* [LIFX Lan Protocol](https://lan.developer.lifx.com/)
* [LIFX Product ID list table](https://lan.developer.lifx.com/v2.0/docs/lifx-products)

---------------------------------------
## <a id="License">License</a>

The MIT License (MIT)

Copyright (c) 2017 - 2018 Futomi Hatano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
