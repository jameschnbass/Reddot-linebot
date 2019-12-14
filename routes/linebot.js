var express = require('express');
const line = require('@line/bot-sdk');
var router = express.Router();

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
    console.log(event);
    if (event.type !== 'message' || event.message.type !== 'text') {
        // ignore non-text-message event
        return Promise.resolve(null);
    }
    let echo = {};
    switch (event.message.text) {
        case '目前機況':
            echo = {
                "type": "flex",
                "altText": "this is a flex message",
                "contents": {
                    "type": "bubble",
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [{
                                "type": "text",
                                "text": "hello"
                            },
                            {
                                "type": "text",
                                "text": "world"
                            }
                        ]
                    }
                }
            }
            break;

        default:
            echo = {
                type: 'text',
                text: event.message.text + ",是在哈囉?"
            }
    }
    // use reply API
    return client.replyMessage(event.replyToken, echo);
}

module.exports = router;