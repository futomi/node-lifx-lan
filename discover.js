const lifx=require('./lib/lifx-lan')

lifx.discover().then((devs)=>{
    for(const dev of devs) {
        console.log(dev.deviceInfo)
        //dev.setColor({color:{hue:0, saturation:1}})
    }
})
