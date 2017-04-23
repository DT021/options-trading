const Websocket = require('ws');
let EventBus;
const Event = require('../event/event.js');
var path = require('path');
var fs = require('fs');


const SocketService = {
    app: null,
    clientsCollection: [],
    init(app, _EventBus) {
        EventBus = _EventBus;
        EventBus.addEventListener(Event.CONNECT, this.connect.bind(this));
        EventBus.addEventListener('ON_TICK', this.onTick.bind(this));
        EventBus.addEventListener(Event.DISCONNECT, this.disconnect.bind(this));
        EventBus.addEventListener(Event.UPDATE_DATA, this.updateData.bind(this));

        this.app = app;
        this.connect();
    },
    connect() {
        this.app.ws('/ws', function(ws, req) {
            this.clientsCollection.push(ws);
            ws.on('open', (event) => {
                console.log('here');
                this.onOpen(event, ws)
            });
            ws.on('message', (event) => { this.onMessage(event, ws) });
            ws.on('close', (event) => { this.onClose(event, ws) });
        }.bind(this));
    },
    onClose(event,ws) {
        let index;
        this.clientsCollection.forEach(function(cws, i) {
            if (cws == ws) index = i;
        }.bind(this));
        if (index != undefined) this.clientsCollection.splice(index, 1);
    },
    onOpen(event, ws) {

    },
    onTick(data) {
        this.clientsCollection.forEach(function(ws) {
            this.send(ws, 'TICK', data);
        }.bind(this));
    },
    onMessage(message, ws) {
        let data = JSON.parse(message);
        switch (data.key) {
            case 'UPDATE':
                this.update(ws);
                break;
        }
    },
    updateData() {
      this.clientsCollection.forEach(function(ws) {
            this.update(ws)
        }.bind(this));
    },
    update(ws) {
        let sessionModel = EventBus.getHook('getSessionModel');
        this.send(ws, 'UPDATE', sessionModel.getData());
    },
    send(ws, key, value) {
        console.log('send', key);
        let obj = {
            key: key,
            data: value
        };
        ws.send(JSON.stringify(obj));
    },
    disconnect(event, ws) {

    }
};
module.exports = SocketService;
