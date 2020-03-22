const redis = require('redis');
const redisPassword = 'MEA3MjMV7iNi2zO2b3mIOYwgTdirRMlg';
const redishost = 'redis-19837.c10.us-east-1-4.ec2.cloud.redislabs.com';
const redisport = 19837;
const redisclient = redis.createClient({
    port: redisport,
    host: redishost,
    no_ready_check: true,
    auth_pass: redisPassword,
});
redisclient.on('connect', function () {
    console.log('已連接至redis伺服器');
});
redisclient.on('error', err => {
    global.console.log(err.message);
});

module.exports = redisclient;