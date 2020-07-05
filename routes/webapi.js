var express = require('express');
var router = express.Router();
const redisclient = require('../lib/redisClient');
const mqttclient = require('../lib/mqttClient');
/* GET users listing. */

router.post('/DeviceMAC', function (req, res, next) {
    mqttclient.sadd('DeviceMAC', req.body.MAC, function (err, res) {
        if (err) throw err;
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'light', 'red');
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'online', 'false');
        res.send('DeviceMAC :' + req.body.MAC + 'is Added.');

    });
});

router.get('/DeviceMAC', function (req, res, next) {
    redisclient.smembers('DeviceMAC', function (err, members) {
        if (err) throw err;
        //取得DeviceMAC
        res.send(members);
        console.log(members);
    });
});

router.delete('/DeviceMAC', function (req, res, next) {
    //刪除
    mqttclient.srem('DeviceMAC', req.body.MAC, function (err, res) {
        if (err) throw err;
        redisclient.del('Advantech/' + req.body.MAC + '/data');
        redisclient.del('Advantech/' + req.body.MAC + '/data_EX');
        res.send('DeviceMAC :' + req.body.MAC + 'is deleted.');

    });
    res.send('DeviceMAC :delete.');
});

module.exports = router;