var express = require('express');
var router = express.Router();
const redisclient = require('../lib/redisClient');
const mqttclient = require('../lib/mqttClient');
/* GET users listing. */

router.post('/DeviceMAC', function (req, response, next) {

    mqttclient.subscribe('Advantech/' + req.body.MAC + '/data', () => {
        console.log('Advantech/' + req.body.MAC + '/data');
    });
    redisclient.sadd('DeviceMAC', req.body.MAC, function (err, res) {
        if (err) {
            console.log(err);
            return;
        };
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'light', 'red');
        redisclient.hset('Advantech/' + req.body.MAC + '/data', 'online', 'false');
        response.send('DeviceMAC :' + req.body.MAC + ' is Added.');

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

router.delete('/DeviceMAC', function (req, response, next) {

    mqttclient.unsubscribe('Advantech/' + req.body.MAC + '/data', () => {
        console.log('Advantech/' + req.body.MAC + '/data');
    });
    //刪除
    redisclient.srem('DeviceMAC', req.body.MAC, function (err, res) {
        if (err) {
            console.log(err);
            return;
        };
        redisclient.del('Advantech/' + req.body.MAC + '/data');
        redisclient.del('Advantech/' + req.body.MAC + '/data_EX');
        response.send('DeviceMAC :' + req.body.MAC + ' is deleted.');
    });
});

module.exports = router;