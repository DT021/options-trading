var express = require('express');
var path = require('path');
var Analyse = require('./server/analyse.js');
var app = express();
var expressWs = require('express-ws')(app);
var fs = require('fs');

const Server = {
    data: null,
    fallData: null,
    raiseData: null,
    isQueued: false,
    interval: null,
    ws: null,
    init() {
        this.getData();
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
       // this.data = JSON.parse(fs.readFileSync(__dirname + '/server/data/data.json', 'utf8'));
        this.fallData = JSON.parse(fs.readFileSync(__dirname + '/server/data/fall.json', 'utf8'));
        this.raiseData = JSON.parse(fs.readFileSync(__dirname + '/server/data/raise.json', 'utf8'));
    },
    saveData(){
      this.isQueued = false;
      //fs.writeFileSync(__dirname + '/server/data/data.json', JSON.stringify(this.data,null,2), 'utf8');
      fs.writeFileSync(__dirname + '/server/data/raise.json', JSON.stringify(this.raiseData,null,2), 'utf8');
      fs.writeFileSync(__dirname + '/server/data/fall.json', JSON.stringify(this.fallData,null,2), 'utf8');
    },
    updateData(item){
      if(item.type == 'fall')
      {
        this.fallData.push(item);
      }else{
        this.raiseData.push(item);
      }
      this.isQueued = true;
    },
    start(){
      this.interval = setInterval(this.onInterval.bind(this),50);
    },
    onInterval(){
      if(this.isQueued)this.saveData();
      //Analyse.start(this.data);
    },  
    onMessage(msg) {
        let obj = JSON.parse(msg);
        switch (obj.key) {
            case 'tickData':
                this.updateData(obj.data);
                break;
        }
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
