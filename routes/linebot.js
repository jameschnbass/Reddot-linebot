var express = require('express');
const line = require('@line/bot-sdk');
var router = express.Router();
const redisclient = require('../lib/redisClient');

// 用於辨識Line Channel的資訊
const config = {
    channelSecret: 'e33190c063ad5d816d576597157a01a6',
    channelAccessToken: 'qNDHUXYfySivVwFVR19iuY7qC63cAWMffrMUqzSafxa7HYDT6f027zA2qxV4wtcejYTcynkat27kUDhMvfdnaadwG05DDA2b4yK5LsvBPKA0S1NfE9LsocJclFM6naZnqmuALEeZy01CLoP11pcv1AdB04t89/1O/w1cDnyilFU='
};


const client = new line.Client(config);
router.post('/callback', line.middleware(config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});


// event handler
function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // ignore non-text-message event
        return Promise.resolve(null);
    }
    let echo = {};
    switch (event.message.text) {
        case '目前機況':
            let value = {};
            let MAC = redisclient.get('DeviceMAC', (error, MAC) => {
                redisclient.hgetall('Advantech/' + MAC + '/data', function (error, res) {

                    let time = new Date(res.t);
                    console.log(res.t.toString());
                    if (error) {
                        console.log(error);
                    } else {
                        echo = {
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
                                            text: '機台編號:' + MAC.toString()
                                        },
                                        {
                                            type: 'text',
                                            text: '機台狀況:' + res.light.toString()
                                        },
                                        {
                                            type: 'text',
                                            text: '機台在線狀態:' + res.online.toString()
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
                        }
                    }
                    return client.replyMessage(event.replyToken, echo);
                })

            });
            break;
        case '訂閱機況':
            switch (event.source.type) {
                case 'user':
                    redisclient.hset("訂閱機況", event.source.userId, Date.now(), () => {
                        console.log('訂閱成功');
                        client.linkRichMenuToUser(event.source.userId, 'richmenu-954f3c7e07736b81068f671d9b009c0e');
                        echo = {
                            type: 'text',
                            text: '訂閱成功'
                        }
                        return client.replyMessage(event.replyToken, echo);
                    });
                    break;
                case 'room':
                    redisclient.hset("訂閱機況", event.source.roomId, Date.now(), () => {
                        console.log('訂閱成功');
                        client.linkRichMenuToUser(event.source.roomId, 'richmenu-954f3c7e07736b81068f671d9b009c0e');
                        echo = {
                            type: 'text',
                            text: '訂閱成功'
                        }
                        return client.replyMessage(event.replyToken, echo);
                    });
                    break;
                case 'group':

                    redisclient.hset("訂閱機況", event.source.groupId, Date.now(), () => {
                        console.log('訂閱成功');
                        client.linkRichMenuToUser(event.source.groupId, 'richmenu-954f3c7e07736b81068f671d9b009c0e');
                        echo = {
                            type: 'text',
                            text: '訂閱成功'
                        }
                        return client.replyMessage(event.replyToken, echo);
                    });
                    break;
            }
            break;
        case '取消訂閱機況':
            switch (event.source.type) {
                case 'user':
                    redisclient.hdel("訂閱機況", event.source.userId, () => {
                        console.log('取消訂閱機況成功');
                        client.linkRichMenuToUser(event.source.userId, 'richmenu-827621309a1524e8937851c18b69429e');
                        echo = {
                            type: 'text',
                            text: '取消訂閱機況成功'
                        }
                        return client.replyMessage(event.replyToken, echo);
                    });
                    break;
                case 'room':
                    redisclient.hdel("訂閱機況", event.source.roomId, () => {
                        console.log('取消訂閱機況成功');
                        client.linkRichMenuToUser(event.source.roomId, 'richmenu-827621309a1524e8937851c18b69429e');
                        echo = {
                            type: 'text',
                            text: '取消訂閱機況成功'
                        }
                        return client.replyMessage(event.replyToken, echo);
                    });
                    break;
                case 'group':
                    redisclient.hdel("訂閱機況", event.source.groupId, () => {
                        console.log('取消訂閱機況成功');
                        client.linkRichMenuToUser(event.source.groupId, 'richmenu-827621309a1524e8937851c18b69429e');
                        echo = {
                            type: 'text',
                            text: '取消訂閱機況成功'
                        }
                        return client.replyMessage(event.replyToken, echo);
                    });
                    break;
            }

            break;

    }

}

module.exports = router;