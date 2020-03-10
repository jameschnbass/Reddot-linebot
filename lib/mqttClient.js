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
        redisclient.hset('Advantech/' + MAC + '/data', 'di1', false);
        redisclient.hset('Advantech/' + MAC + '/data', 'di2', false);
        redisclient.hset('Advantech/' + MAC + '/data', 'di3', false);
        mqttclient.subscribe('Advantech/' + MAC + '/data', () => {
            console.log('SUB:Advantech/' + MAC + '/data');
        });
    });
});
mqttclient.on('error', err => {
    global.console.log(err.message);
});
mqttclient.on('message', function (topic, msg) {
    var IOval = JSON.parse(msg.toString());
    console.log('收到' + topic + '主題、訊息:' + msg.toString());
    const IOkey = Object.keys(IOval);
    IOkey.forEach(element => {
        redisclient.hset(topic, element, IOval[element], () => {});
    });
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
});

function pushMessage(uid, IOval, topic) {

    let state = '';
    if (IOval.di1 === 'false' && IOval.di2 === 'false' && IOval.di3 === 'false')
        return;
    if (IOval.di1 === 'true' && IOval.di2 === 'false' && IOval.di3 === 'false') {
        state = '綠';
    } else if (IOval.di1 === 'false' && IOval.di2 === 'true' && IOval.di3 === 'false') {
        state = '黃';
    } else if (IOval.di1 === 'false' && IOval.di2 === 'false' && IOval.di3 === 'true') {
        state = '紅';
    } else {
        return;
    }

    let time = new Date(IOval.t);
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
                        text: '機台燈號:' + state.toString()
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

}
module.exports = mqttclient;