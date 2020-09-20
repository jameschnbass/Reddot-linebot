var express = require('express');
var router = express.Router();
const redisclient = require('../lib/redisClient');
const request = require('request');

function middleware1(req, res, next) {
  if (req.query.code) {
    request({
      uri: "https://notify-bot.line.me/oauth/token",
      method: "POST",
      form: {
        code: req.query.code,
        grant_type: "authorization_code",
        redirect_uri: "https://reddotlinebot.herokuapp.com/",
        client_id: "pxV3I9mewdySJkzEbzYgne",
        client_secret: "XMBBH8n4i6Cbxab5AlrQEwg4zIoCnOeHeDkG6bkD9Np",
      }
    }, function (error, response, body) {
      if (error) {
        console.log(error);
        return;
      }
      if (body) {
        var info = JSON.parse(body);
        redisclient.hset("SubscribeNotify", info.access_token, Date.now(), () => {
          console.log('SubscribeNotify : 訂閱成功' + info.access_token);
        });
        return;
      }

    });
  }
  next(); // 引發下一個 middleware
}

/* GET home page. */
router.get('/', middleware1, function (req, res, next) {
  res.sendFile(path.join(__dirname, "/dist/index.html"));
});

module.exports = router;