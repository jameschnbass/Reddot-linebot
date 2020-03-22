var express = require('express');
var router = express.Router();
const redisclient = require('../lib/redisClient');
const mqttclient = require('../lib/mqttClient');
/* GET users listing. */
router.post('/DeviceMAC', function (req, res, next) {
    redisclient.hgetall(DeviceMAC, function (err, allDeviceMAC) {
        mqttclient.unsubscribe('Advantech/' + allDeviceMAC + '/data', () => {});
        redisclient.hset('DeviceMAC', req.body.MAC, () => {
            redisclient.hset('Advantech/' + req.body.MAC + '/data', 'light', 'red');
            res.send('DeviceMAC :' + req.body.MAC + 'is Added.');
            mqttclient.subscribe('Advantech/' + req.body.MAC + '/data', () => {});
        });
    });
});

router.get('/DeviceMAC', function (req, res, next) {
    //取得DeviceMAC
    res.send('DeviceMAC :get.');

});

router.delete('/DeviceMAC', function (req, res, next) {
    //刪除

    res.send('DeviceMAC :delete.');
});

module.exports = router;