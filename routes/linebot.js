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
                    let state = '';
                    if (res.di1 === 'true' && res.di2 === 'false' && res.di3 === 'false') {
                        state = '綠';
                    } else if (res.di1 === 'false' && res.di2 === 'true' && res.di3 === 'false') {
                        state = '黃';
                    } else if (res.di1 === 'false' && res.di2 === 'false' && res.di3 === 'true') {
                        state = 'Stop';
                    } else {
                        return;
                    }
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
                                            text: '機台狀況:' + state.toString()
                                        },
                                        {
                                            type: 'text',
                                            text: 'Time:' + res.t.toString()
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
                        client.linkRichMenuToUser(event.source.userId, 'richmenu-d3578fabe42406aef23ebf8fdd02ad7e');
                        echo = {
                            type: 'text',
                            text: /*'[' + event.source.userId + ']'*/ +'訂閱成功'
                        }
                        return client.replyMessage(event.replyToken, echo);
                    });
                    break;
                case 'room':
                    redisclient.hset("訂閱機況", event.source.roomId, Date.now(), () => {
                        console.log('訂閱成功');
                        client.linkRichMenuToUser(event.source.roomId, 'richmenu-d3578fabe42406aef23ebf8fdd02ad7e');
                        echo = {
                            type: 'text',
                            text: /*'[' + event.source.roomId + ']'*/ +'訂閱成功'
                        }
                        return client.replyMessage(event.replyToken, echo);
                    });
                    break;
                case 'group':
                    redisclient.hset("訂閱機況", event.source.groupId, Date.now(), () => {
                        console.log('訂閱成功');
                        client.linkRichMenuToUser(event.source.groupId, 'richmenu-d3578fabe42406aef23ebf8fdd02ad7e');
                        echo = {
                            type: 'text',
                            text: /*'[' + event.source.groupId + ']'*/ +'訂閱成功'
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
                        client.linkRichMenuToUser(event.source.userId, 'richmenu-efd93335d640fcbf67988360217b4f79');
                        echo = {
                            type: 'text',
                            text: /*'[' + event.source.userId + ']'*/ +'取消訂閱機況成功'
                        }
                        return client.replyMessage(event.replyToken, echo);
                    });
                    break;
                case 'room':
                    redisclient.hdel("訂閱機況", event.source.roomId, () => {
                        console.log('取消訂閱機況成功');
                        client.linkRichMenuToUser(event.source.roomId, 'richmenu-efd93335d640fcbf67988360217b4f79');
                        echo = {
                            type: 'text',
                            text: /*'[' + event.source.roomId + ']'*/ +'取消訂閱機況成功'
                        }
                        return client.replyMessage(event.replyToken, echo);
                    });
                    break;
                case 'group':
                    redisclient.hdel("訂閱機況", event.source.groupId, () => {
                        console.log('取消訂閱機況成功');
                        client.linkRichMenuToUser(event.source.groupId, 'richmenu-efd93335d640fcbf67988360217b4f79');
                        echo = {
                            type: 'text',
                            text: /*'[' + event.source.groupId + ']'*/ +'取消訂閱機況成功'
                        }
                        return client.replyMessage(event.replyToken, echo);
                    });
                    break;
            }

            break;

    }

}

module.exports = router;