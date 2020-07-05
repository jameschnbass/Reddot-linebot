var express = require('express');
var router = express.Router();
const redisclient = require('../lib/redisClient');
const mqttclient = require('../lib/mqttClient');
/* GET users listing. */

router.post('/DeviceMAC', function (req, response, next) {
    redisclient.sadd('DeviceMAC', req.body.MAC, function (err, res) {
        if (err) {
            console.log(err);
            return;
        };
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'light', 'red');
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'online', 'false');
        response.send('DeviceMAC :' + req.body.MAC + 'is Added.');

    });
});

router.get('/DeviceMAC', function (req, res, next) {
    redisclient.smembers('DeviceMAC', function (err, members) {
        if (err) {
            console.log(err);
            return;
        };
        //取得DeviceMAC
        res.send(members);
        console.log(members);
    });
});

router.delete('/DeviceMAC', function (req, res, next) {
    //刪除
    res.send('DeviceMAC :delete.');
});

module.exports = router;