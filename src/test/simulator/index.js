var express = require('express');
var path = require('path');
var app = express();
var expressWs = require('express-ws')(app);
var Data = require('../../../data.json');

const Server = {
    collection: null,
    timeIndex: 0,
    tickIndex: 0,
    tickDuration: 500,
    timer: null,
    ws: null,
    init() {
        this.route();
        this.collection = this.sortPricesByTime(Data['friday'].prices);
        app.listen(3000);
    },
    route() {
        app.use('/', express.static(path.join(__dirname, 'public')));
        app.get('/', function(req, res, next) {
            console.log('get route', req.testing);
            res.end();
        });
        app.ws('/ws', function(ws, req) {
            this.ws = ws;
            ws.on('message', this.onMessage.bind(this));
            ws.on('close', this.onClose.bind(this));
        }.bind(this));
    },
    onClose() {
        clearTimeout(this.timer);
    },
    onMessage(msg) {
        if (msg == 'ready') {
            this.start();
        }
    },
    start() {
        this.tickIndex = 0;
        this.timeIndex = 0;
        this.next();
    },
    sortPricesByTime(prices) {
        let collection = [];
        for (let timeKey in prices) {
            prices[timeKey].priceCollection.sort(function(a, b) {
              console.log(a.timeNumber, b.timeNumber);
                return (a.timeNumber - b.timeNumber);
            });
            collection.push({ key: timeKey, value: prices[timeKey] });
        }
        collection.sort(function(a, b) {
            let aTime = Number(a.key.replace('_', ''));
            let bTime = Number(b.key.replace('_', ''));
            return aTime - bTime;
        });


        return collection;
    },
    next() {
        this.timer = setTimeout(this.getTick.bind(this), this.tickDuration);
    },
    getTick() {
        let time = this.collection[this.timeIndex];
        if (!time) return;
        let item = this.collection[this.timeIndex].value.priceCollection[this.tickIndex];
        if (!item) {
            this.tickIndex = 0;
            this.timeIndex++;
            this.getTick();
            return;
        }
        this.tickIndex++;
        this.ws.send(JSON.stringify(item));
        this.next();
    }
}

Server.init();