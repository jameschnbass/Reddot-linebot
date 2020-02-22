const mqtt = require('mqtt');
const Client = require('@line/bot-sdk').Client;
const client = new Client({
    channelSecret: 'e33190c063ad5d816d576597157a01a6',
    channelAccessToken: 'qNDHUXYfySivVwFVR19iuY7qC63cAWMffrMUqzSafxa7HYDT6f027zA2qxV4wtcejYTcynkat27kUDhMvfdnaadwG05DDA2b4yK5LsvBPKA0S1NfE9LsocJclFM6naZnqmuALEeZy01CLoP11pcv1AdB04t89/1O/w1cDnyilFU='
});

const redis = require('redis');
const redisPassword = "MEA3MjMV7iNi2zO2b3mIOYwgTdirRMlg";
const redis_client = redis.createClient({
    port: 19837,
    host: 'redis-19837.c10.us-east-1-4.ec2.cloud.redislabs.com',
    no_ready_check: true,
    auth_pass: redisPassword,
});

var mqttclient = mqtt.connect('mqtt://broker.mqttdashboard.com');

mqttclient.on('message', function (topic, msg) {
    console.log('已連接至MQTT伺服器');
    console.log('收到' + topic + '主題、訊息:' + msg.toString());
    var IOval = JSON.parse(msg.toString());

    const IOkey = Object.keys(IOval);
    IOkey.forEach(element => {
        redis_client.hset(topic, IOkey, IOval[IOkey], () => {
        });
    });


    redis_client.hgetall("訂閱機況", function (err, replies) {
        if (replies != null) {
            const idList = Object.keys(replies);
            idList.forEach(element => {
                pushMessage(element, IOval, topic);
            });
        }
    });
});


function pushMessage(uid, IOval, topic) {
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
                        text: '產線1:' + IOval.do1.toString()
                    },
                    {
                        type: 'text',
                        text: '產線2:' + IOval.do2.toString()
                    },
                    {
                        type: 'text',
                        text: '產線3:' + IOval.do3.toString()
                    }
                ]
            }
        }
    })

}
module.exports = mqttclient;