const mqtt = require('mqtt');
const mqtt_client = mqtt.connect('mqtt://broker.mqttdashboard.com');
const redis_client = require('../lib/redisClient');
const request = require('request');
const connectionString = 'postgres://gxjgidpsknvmde:d3be2db9c2721d0eca16e59aaf8ac05c479fefdeb370ad6f608f92497891a67a@ec2-54-81-37-115.compute-1.amazonaws.com:5432/df97eeccudoe28'
const {
    Client
} = require('pg');
const pg_client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

pg_client.connect();
//定期檢查redis裡面設備生存狀態  [1000ms]
setInterval(function () {
    redis_client.smembers('DeviceMAC', function (err, members) {
        if (err) {
            console.log(err);
            return;
        }
        members.forEach(element => {
            let topic = 'Advantech/' + element + '/data';
            redis_client.get(topic + '_EX', (err, msg) => {
                if (msg == 'exist') {
                    redis_client.hget(topic, 'online', (error, online) => {
                        if (online != 'true') {
                            redis_client.hset(topic, 'online', 'true', () => {
                                console.log('Device status : Online');
                            });
                        }
                    });
                } else {
                    redis_client.hget(topic, 'online', (error, online) => {
                        if (online != 'false') {
                            redis_client.hset(topic, 'online', 'false', () => {
                                console.log('Device status : Offline');
                            });
                        }
                    });
                }
            });
        });
    });

}, 1000);

mqtt_client.on('connect', function () {
    console.log('Connect to MQTT broker.');
    redis_client.smembers('DeviceMAC', function (err, members) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('DeviceMAC : ' + members);
        members.forEach(element => {
            redis_client.hset('Advantech/' + element + '/data', 'light', 'red');
            redis_client.hset('Advantech/' + element + '/data', 'online', 'false');
            mqtt_client.subscribe('Advantech/' + element + '/data', () => {
                console.log('SUB:Advantech/' + element + '/data');
            });
        });
    });
});

mqtt_client.on('error', err => {
    global.console.log(err.message);
});

mqtt_client.on('message', function (topic, msg) {

    var mqtt_msg = JSON.parse(msg.toString());
    //收到訊息表示此設備還生存，因此立Flag(誤)。
    redis_client.set(topic + '_EX', 'exist');
    redis_client.expire(topic + '_EX', 60 * 5);

    const IOkey = Object.keys(mqtt_msg);

    redis_client.hgetall(topic, function (error, res) {

        let light = '';

        //轉換DI成燈號訊號。
        if (mqtt_msg.di1.toString() === 'true' && mqtt_msg.di2.toString() === 'false' && (mqtt_msg.di3 || 'false').toString() === 'false') {
            light = 'red';
        } else if (mqtt_msg.di1.toString() === 'false' && mqtt_msg.di2.toString() === 'true' && (mqtt_msg.di3 || 'false').toString() === 'false') {
            light = 'yellow';
        } else if (mqtt_msg.di1.toString() === 'false' && mqtt_msg.di2.toString() === 'false' && (mqtt_msg.di3 || 'false').toString() === 'true') {
            light = 'green';
        } else {
            //沒有符合的燈號
            return;
        }

        //燈號沒有變化
        if ((res.light === light)) return;

        //燈號有變化，寫進redis。
        redis_client.hset(topic, 'light', light, () => {});
        redis_client.hset(topic, 't', mqtt_msg.t, () => {});

        console.log('Light status:' + res.light + '→' + light);
        console.log('recevie' + topic);
        console.log('msg' + msg.toString());

        let time = new Date(mqtt_msg.t);
        //狀態變化，發送訊息給有訂閱的人。
        redis_client.hgetall("SubscribeNotify", function (err, replies) {
            redis_client.hgetall(topic, function (err, devStatus) {
                if (!replies) return;
                const uid_list = Object.keys(replies);
                const query = {
                    text: 'INSERT INTO reddotlinebot.r1_device_status_log(origin_led, now_led, ctime , mac) VALUES($1, $2, $3, $4)',
                    values: [res.light, light, Date.parse(time.toLocaleString()) / 1000, topic],
                }
                pg_client.query(query, (err, res) => {
                    if (err) {
                        console.log(err.stack);
                    } else {
                        //console.log(res);
                    }
                })

                uid_list.forEach(element => {
                    NotifyMessage(element, devStatus, topic);
                });
            });
        });
    });
});

function NotifyMessage(uid, IOval, topic) {
    console.log(uid);
    let time = new Date(IOval.t);
    request({
        uri: "https://notify-api.line.me/api/notify",
        method: "POST",
        headers: {
            'Authorization': 'Bearer ' + uid,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            message: 'topic:' + topic.toString() + '機台燈號:' + IOval.light.toString() + '機台在線狀態:' + IOval.online.toString() + '擷取時間:' + time.toLocaleString(),
        }
    }, function (error, response, body) {
        if (error) {
            console.log(error);
            return;
        }
        if (body) {
            var info = JSON.parse(body);
            console.log(info);
            return;
        }
    });
}

module.exports = mqtt_client;

/*******************line bot Push Message*********************
const Client = require('@line/bot-sdk').Client;
const client = new Client({
    channelSecret: 'e33190c063ad5d816d576597157a01a6',
    channelAccessToken: 'qNDHUXYfySivVwFVR19iuY7qC63cAWMffrMUqzSafxa7HYDT6f027zA2qxV4wtcejYTcynkat27kUDhMvfdnaadwG05DDA2b4yK5LsvBPKA0S1NfE9LsocJclFM6naZnqmuALEeZy01CLoP11pcv1AdB04t89/1O/w1cDnyilFU='
});
function pushMessage(uid, IOval, topic) {

    let time = new Date(IOval.t);
    let MAC = redisclient.get('DeviceMAC', (error, MAC) => {
        client.pushMessage(uid, {
            type: 'flex',
            altText: 'ADAM',
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [{
                            type: 'text',
                            text: '鼎曜開發',
                            size: "lg",
                            weight: "bold",
                        },
                        {
                            type: 'text',
                            text: '機台編號:' + topic.toString()
                        },
                        {
                            type: 'text',
                            text: '機台燈號:' + IOval.light.toString()
                        },
                        {
                            type: 'text',
                            text: '機台在線狀態:' + IOval.online.toString()
                        },
                        {
                            type: 'text',
                            text: '擷取時間:'
                        },
                        {
                            type: 'text',
                            text: time.toLocaleString()
                        }
                    ]

                }
            }
        }).catch((err) => {
            console.log(err);
        })
    })
}
*************************************************************/