const mqtt = require('mqtt');
const redisclient = require('../lib/redisClient');
const Client = require('@line/bot-sdk').Client;
const client = new Client({
    channelSecret: 'e33190c063ad5d816d576597157a01a6',
    channelAccessToken: 'qNDHUXYfySivVwFVR19iuY7qC63cAWMffrMUqzSafxa7HYDT6f027zA2qxV4wtcejYTcynkat27kUDhMvfdnaadwG05DDA2b4yK5LsvBPKA0S1NfE9LsocJclFM6naZnqmuALEeZy01CLoP11pcv1AdB04t89/1O/w1cDnyilFU='
});

var mqttclient = mqtt.connect('mqtt://broker.mqttdashboard.com');

mqttclient.on('connect', function () {
    console.log('已連接至MQTT伺服器');
    redisclient.get('DeviceMAC', (error, MAC) => {
        redisclient.hset('Advantech/' + MAC + '/data', 'light', 'red');
        redisclient.hset('Advantech/' + MAC + '/data', 'online', 'false');
        mqttclient.subscribe('Advantech/' + MAC + '/data', () => {
            console.log('SUB:Advantech/' + MAC + '/data');
        });
    });
});

mqttclient.on('error', err => {
    global.console.log(err.message);
});
var interval = setInterval(function () {
    redisclient.get('EX', (err, msg) => {
        console.log(msg);
        if (msg == 'exist') {
            redisclient.get('DeviceMAC', (error, MAC) => {
                redisclient.hget('Advantech/' + MAC + '/data', 'online', (error, online) => {
                    if (online != 'true') {
                        redisclient.hset('Advantech/' + MAC + '/data', 'online', 'true', () => {
                            console.log('狀態變化(true)');
                        });
                    }
                });
            });
        } else {
            redisclient.get('DeviceMAC', (error, MAC) => {
                redisclient.hget('Advantech/' + MAC + '/data', 'online', (error, online) => {
                    if (online != 'false') {
                        redisclient.hset('Advantech/' + MAC + '/data', 'online', 'false', () => {
                            console.log('狀態變化(false)');
                        });
                    }
                });
            });
        }
    });
}, 1000);
mqttclient.on('message', function (topic, msg) {
    var IOval = JSON.parse(msg.toString());
    redisclient.set('EX', 'exist');
    redisclient.expire('EX', 60);
    console.log('收到' + topic + '主題、訊息:' + msg.toString());
    const IOkey = Object.keys(IOval);

    redisclient.hgetall(topic, function (error, res) {
        let light = '';
        if (IOval.di1.toString() === 'true' && IOval.di2.toString() === 'false' && (IOval.di3 || 'false').toString() === 'false') {
            light = 'red';
        } else if (IOval.di1.toString() === 'false' && IOval.di2.toString() === 'true' && (IOval.di3 || 'false').toString() === 'false') {
            light = 'yellow';
        } else if (IOval.di1.toString() === 'false' && IOval.di2.toString() === 'false' && (IOval.di3 || 'false').toString() === 'true') {
            light = 'green';
        } else {
            return;
        }

        if ((res.light === light)) {
            return;
        } else {
            if (light != '') {
                redisclient.hset(topic, 'light', light, () => {});
            }
            console.log('res.light:' + res.light + ', light:' + light);
            redisclient.hgetall("訂閱機況", function (err, replies) {
                redisclient.hgetall(topic, function (err, devStatus) {
                    if (replies != null) {
                        const idList = Object.keys(replies);
                        idList.forEach(element => {
                            pushMessage(element, devStatus, topic);
                        });
                    }
                });

            });
        }

    });


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
module.exports = mqttclient;