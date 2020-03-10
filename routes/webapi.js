var express = require('express');
var router = express.Router();
const redisclient = require('../lib/redisClient');
const mqttclient = require('../lib/mqttClient');
/* GET users listing. */
router.post('/DeviceMAC', function (req, res, next) {

    redisclient.hset('DeviceMAC', req.body.MAC, () => {
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'di1', false);
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'di2', false);
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'di3', false);
        res.send('DeviceMAC :' + req.body.MAC + 'is Added.');
        mqttclient.subscribe('Advantech/' + req.body.MAC + '/data', () => {});
    });

});

router.get('/DeviceMAC', function (req, res, next) {
    //取得DeviceMAC
    redisclient.hgetall(DeviceMAC, function (err, allDeviceMAC) {
        const idList = Object.keys(allDeviceMAC);
        idList.forEach(element => {
            pushMessage(element, devStatus, topic);
        });
    });

});

router.delete('/DeviceMAC', function (req, res, next) {
    //刪除
});

module.exports = router;