var express = require('express');
const line = require('@line/bot-sdk');
var router = express.Router();
const redis = require('redis');
const redisPassword = "MEA3MjMV7iNi2zO2b3mIOYwgTdirRMlg";
const redis_client = redis.createClient({
    port: 19837,
    host: 'redis-19837.c10.us-east-1-4.ec2.cloud.redislabs.com',
    no_ready_check: true,
    auth_pass: redisPassword,
});

redis_client.on('connect', () => {
    global.console.log("connected");
});
redis_client.on('error', err => {
    global.console.log(err.message);
});
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
            redis_client.get('Advantech/00D0C9E38A96/data', function (error, res) {
                if (error) {
                    console.log(error);
                } else {
                    value = JSON.parse(res);
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
                                        text: '鼎曜開發(大寮廠)',
                                        size: "lg",
                                        weight: "bold",
                                    },
                                    {
                                        type: 'text',
                                        text: '產線1:' + value.do1.toString()
                                    },
                                    {
                                        type: 'text',
                                        text: '產線2:' + value.do2.toString()
                                    },
                                    {
                                        type: 'text',
                                        text: '產線3:' + value.do3.toString()
                                    },
                                    {
                                        type: 'text',
                                        text: '產線4:' + value.do4.toString()
                                    }                                    
                                ]
                            }
                        }
                    }
                }
                return client.replyMessage(event.replyToken, echo);
            })

            break;
        case '訂閱機況':
            switch (event.source.type) {
                case 'user':
                    redis_client.hset("訂閱機況", event.source.userId, Date.now(), () => {
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
                    redis_client.hset("訂閱機況", event.source.roomId, Date.now(), () => {
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
                    redis_client.hset("訂閱機況", event.source.groupId, Date.now(), () => {
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
                    redis_client.hdel("訂閱機況", event.source.userId, () => {
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
                    redis_client.hdel("訂閱機況", event.source.roomId, () => {
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
                    redis_client.hdel("訂閱機況", event.source.groupId, () => {
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