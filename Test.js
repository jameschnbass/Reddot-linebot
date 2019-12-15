const redis = require('redis');
const redisPassword = "MEA3MjMV7iNi2zO2b3mIOYwgTdirRMlg";
const client = redis.createClient({
    port: 19837,
    host: 'redis-19837.c10.us-east-1-4.ec2.cloud.redislabs.com',
    no_ready_check: true,
    auth_pass: redisPassword,
});

client.on('connect', () => {
    global.console.log("connected");
});

client.on('error', err => {
    global.console.log(err.message)
});

client.set("foo", 'bar');

client.LRANGE("訂閱機況", 0, 100, function (err, reply) {
    console.log(reply);
})