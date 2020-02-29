var express = require('express');
var router = express.Router();
const redisclient = require('../lib/redisClient');

/* GET users listing. */
router.post('/', function (req, res, next) {

    redisclient.set('DeviceMAC', req.body.MAC, () => {
        res.send('DeviceMAC :' + req.body.MAC);
    });

});

module.exports = router;