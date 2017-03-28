var express = require('express');
var path = require('path');
var app = express();
var expressWs = require('express-ws')(app);
var Data = require('../../../data.json');

const Server = {
    collection: null,
    timeIndex: 0,
    tickIndex: 0,
    tickDuration: 50,
    timer: null,
    ws: null,
    init() {
        this.route();

        console.log('server running on http://localhost:3000');
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
        let obj = JSON.parse(msg);
        switch (obj.key) {
            case 'ready':
                this.sendDays();
                break;
            case 'run':
                this.start(obj.data);
                break;
        }
    },
    sendDays() {
        this.sendMessage('days', Object.keys(Data));
    },
    start(dateIndex) {
         clearTimeout(this.timer);
        this.collection = this.sortPricesByTime(Data[dateIndex].prices);
        this.tickIndex = 0;
        this.timeIndex = 0;
        this.next();
    },
    sortPricesByTime(prices) {
        let collection = [];
        for (let timeKey in prices) {
            prices[timeKey].priceCollection.sort(function(a, b) {
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
    sendMessage(key, data) {
        let obj = {
            key: key,
            data: data
        }
        this.ws.send(JSON.stringify(obj));
    },
    getTick() {
        let time = this.collection[this.timeIndex];
        if (!time) {
            this.sendMessage('end',{});
          return;  
        } 
        let item = this.collection[this.timeIndex].value.priceCollection[this.tickIndex];
        if (!item) {
            this.tickIndex = 0;
            this.timeIndex++;
            this.getTick();
            return;
        }
        this.tickIndex++;
        this.sendMessage('tick', item);
        this.next();
    }
}

Server.init();
