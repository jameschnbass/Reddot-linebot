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
        res.send('DeviceMAC :' + req.body.MAC);
        mqttclient.unsubscribe('Advantech/' + req.body.MAC + '/data', () => {
        });
    });

});

module.exports = router;