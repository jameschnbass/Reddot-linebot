const mqtt = require('mqtt');
const mqtt_client = mqtt.connect('mqtt://broker.mqttdashboard.com');
const redis_client = require('../lib/redisClient');
const request = require('request');

//定期檢查redis裡面設備生存狀態  [1000ms]
setInterval(function () {
    redis_client.smembers('DeviceMAC', function (err, members) {
        if (err) throw err;
        members.forEach(element => {
            let topic = 'Advantech/' + element + '/data';
            redis_client.get(topic + '_EX', (err, msg) => {
                if (msg == 'exist') {
                    redis_client.hget(topic, 'online', (error, online) => {
                        if (online != 'true') {
                            redis_client.hset(topic, 'online', 'true', () => {
                                console.log('狀態變化(true)');
                            });
                        }
                    });
                } else {
                    redis_client.hget(topic, 'online', (error, online) => {
                        if (online != 'false') {
                            redis_client.hset(topic, 'online', 'false', () => {
                                console.log('狀態變化(false)');
                            });
                        }
                    });
                }
            });
        });
    });

}, 1000);

mqtt_client.on('connect', function () {
    console.log('已連接至MQTT伺服器');
    redis_client.smembers('DeviceMAC', function (err, members) {
        if (err) throw err;
        console.log(members);

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

        console.log('燈號變化:' + res.light + '→' + light);
        console.log('收到' + topic + '主題、訊息:' + msg.toString());

        //狀態變化，發送訊息給有訂閱的人。
        redis_client.hgetall("訂閱機況(Test)", function (err, replies) {
            if (replies) return;
            redis_client.hgetall(topic, function (err, devStatus) {
                const uid_list = Object.keys(replies);
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