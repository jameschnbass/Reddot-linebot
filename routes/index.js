var express = require('express');
var router = express.Router();
const request = require('request');
const redisclient = require('../lib/redisClient');

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
        redisclient.hset("訂閱機況(Test)", info.access_token, Date.now(), () => {
          console.log('訂閱成功');
        });
        return;
      }

    });
  }
  // res.send('搶先送出回應'); // 這會引起錯誤，但不中斷： Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client 
  next(); // 引發下一個 middleware
}
/* GET home page. */
router.get('/', middleware1, function (req, res, next) {

  res.render('index', {
    title: '紅點科技'
  });
});

module.exports = router;