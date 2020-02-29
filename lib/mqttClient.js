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
    let MAC = redisclient.get('DeviceMAC');
    mqttclient.subscribe('Advantech/' + MAC + '/data', () => {
        console.log('SUB:Advantech/' + MAC + '/data');
    });
});
mqttclient.on('error', err => {
    global.console.log(err.message);
});
mqttclient.on('message', function (topic, msg) {
    var IOval = JSON.parse(msg.toString());
    if (IOval.di1 === false && IOval.di2 === false /*&& IOval.di3 === false*/ )
        return;
    console.log('收到' + topic + '主題、訊息:' + msg.toString());
    const IOkey = Object.keys(IOval);
    IOkey.forEach(element => {
        redisclient.hset(topic, element, IOval[element], () => {});
    });
    redisclient.hgetall("訂閱機況", function (err, replies) {
        if (replies != null) {
            const idList = Object.keys(replies);
            idList.forEach(element => {
                pushMessage(element, IOval, topic);
            });
        }
    });
});

function pushMessage(uid, IOval, topic) {
    let state = '';
    if (IOval.di1 === true && IOval.di2 === false /*&& IOval.di3 === false*/ ) {
        state = 'Run';
    } else if (IOval.di1 === false && IOval.di2 === true /*&& IOval.di3 === false*/ ) {
        state = 'Idle';
    } else if (IOval.di1 === false && IOval.di2 === false /*&& IOval.di3 === true*/ ) {
        state = 'Stop';
    } else {
        return;
    }
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
                        text: '鼎曜開發(大寮廠)',
                        size: "lg",
                        weight: "bold",
                    },
                    {
                        type: 'text',
                        text: '產線狀況:' + state.toString()
                    }
                ]
            }
        }
    }).catch((err) => {
        console.log(err);
    })

}
module.exports = mqttclient;