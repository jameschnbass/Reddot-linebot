var express = require('express');
var router = express.Router();

function middleware1(req, res, next) {
  // 錯誤發生(一)
  // throw new Error('fake error by throw'); 

  // 錯誤發生(二)
  // next(new Error('fake error by next()'));
  // return;

  console.log('middleware1');
  // res.send('搶先送出回應'); // 這會引起錯誤，但不中斷： Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client 
  next(); // 引發下一個 middleware
}

function middleware2(req, res, next) {
  console.log('middleware2');
  next(); // 引發下一個 middleware
}
/* GET users listing. */
router.get('/', middleware1, middleware2, function (req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;