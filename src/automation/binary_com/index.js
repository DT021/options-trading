var express = require('express');
var path = require('path');
var Analyse = require('./server/analyse.js');
var app = express();
var expressWs = require('express-ws')(app);
var fs = require('fs');

const Server = {
    data: null,
    fallData: [],
    raiseData: [],
    successData: null,
    isQueued: false,
    isSuccessQueued: false,
    interval: null,
    ws: null,
    asset: '',
    init() {
        this.route();
        this.start();
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

    },
    getData() {
        let fallPath = __dirname + '/server/data/' + this.asset + 'fall.json';
        let raisePath = __dirname + '/server/data/' + this.asset + 'raise.json';
        if (fs.existsSync(fallPath)) {
            this.fallData = JSON.parse(fs.readFileSync(fallPath, 'utf8'));
            this.raiseData = JSON.parse(fs.readFileSync(raisePath, 'utf8'));
        } else {
            this.fallData = [];
            this.raiseData = [];
        }

    },
    getTradeResultData() {
        let successPath = __dirname + '/server/data/' + this.asset + 'success.json';
        if (fs.existsSync(successPath)) {
            this.successData = JSON.parse(fs.readFileSync(successPath, 'utf8'));
        } else {
            this.successData = [];
        }

    },
    saveTradeData() {
        this.isSuccessQueued = false;
        let dir = __dirname + '/server/data/' + this.asset;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(dir + 'success.json', JSON.stringify(this.successData, null, 2), 'utf8');
    },
    saveData() {
        this.isQueued = false;
        let dir = __dirname + '/server/data/' + this.asset;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(dir + 'raise.json', JSON.stringify(this.raiseData, null, 2), 'utf8');
        fs.writeFileSync(dir + 'fall.json', JSON.stringify(this.fallData, null, 2), 'utf8');
    },
    storeTradeResult(data) {
        this.asset = data.asset + '/';
        if (!this.successData) this.getTradeResultData();
        this.successData.push(data);
        this.isSuccessQueued = true;
    },
    updateData(item, asset) {
        this.asset = asset + '/';
        if (!this.raiseData) this.getData();
        if (item.type == 'fall') {
            this.fallData.push(item);
        } else {
            this.raiseData.push(item);
        }
        this.isQueued = true;
    },
    start() {
        this.interval = setInterval(this.onInterval.bind(this), 50);
    },
    onInterval() {
        if (this.isQueued)
            this.saveData();
        if (this.isSuccessQueued) this.saveTradeData();

        //Analyse.start(this.data);
    },
    onMessage(msg) {
        let obj = JSON.parse(msg);
        switch (obj.key) {
            case 'tickData':
                //return;
                this.updateData(obj.data, obj.asset);
                break;
            case 'getPrediction':
                this.getPrediction(obj.data);
                break;
            case 'getHighestLowest':
                this.getHighestLowest(obj.data);
                break;
            case 'sucessfulTrade':
                this.storeTradeResult(obj.data);
                break;
        }
    },
    getHighestLowest(data) {
      let obj = Analyse.getHighestLoweset(data);
      this.sendMessage('highestLowest',obj);
    },  
    getPrediction(data) {
        let prediction = Analyse.getPrediction(data, this.successData);
        console.log('prediction is', prediction);
        if (prediction) this.sendMessage('prediction', prediction);
    },
    sendMessage(key, data) {
        let obj = {
            key: key,
            data: data
        }
        this.ws.send(JSON.stringify(obj));
    }
}

Server.init();
