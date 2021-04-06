const lifx=require('./lib/lifx-lan')

lifx.discover().then((devs)=>{
    for(const dev of devs) {
        console.log(dev.deviceInfo)
    }
})
