var express = require('express');
var router = express.Router();
const redisclient = require('../lib/redisClient');
const mqttclient = require('../lib/mqttClient');
/* GET users listing. */
router.post('/', function (req, res, next) {

    redisclient.get('DeviceMAC',(error, MAC)=>{
        mqttclient.unsubscribe('Advantech/' + MAC + '/data', () => {
        });
    });

    redisclient.set('DeviceMAC', req.body.MAC, () => {
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'di1',false);
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'di2',false);
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'di3',false);
        res.send('DeviceMAC :' + req.body.MAC);
        mqttclient.subscribe('Advantech/' + req.body.MAC + '/data', () => {
        });
    });

});

module.exports = router;