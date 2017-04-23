const Websocket = require('ws');
let EventBus;
const Event = require('../event/event.js');
const SessionModel = require('../model/sessionModel.js');

const BinaryService = {
    EVENT_PREFIX: 'ON_',
    RESPONSE_KEY: {
        AUTHORIZE: 'authorize',
        BALANCE: 'balance',
        ASSEX_INDEX: 'assex_index',
        HISTORY: 'history',
        PROPOSAL: 'proposal',
        TRANSACTION: 'transaction',
        FORGET_ALL: 'forget_all',
        TICK: 'tick'
    },
    API_KEY: '4F61diD8mzgGDD1',
    APP_ID: '3374',
    historyTimer: null,
    ws: null,
    init(_EventBus) {
        EventBus = _EventBus;
        EventBus.addEventListener(Event.CONNECT, this.connect.bind(this));
        EventBus.addEventListener(Event.REQUEST, this.onRequest.bind(this));
        EventBus.addEventListener(Event.DISCONNECT, this.disconnect.bind(this));
        this.connect();
    },
    connect() {
        this.ws = new Websocket('wss://ws.binaryws.com/websockets/v3?app_id=' + this.APP_ID);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
    },
    onOpen(event) {
        //console.log('open');
        this.authorize();
    },
    onRequest(data) {
        this.send(data.key, data.value);
    },
    onMessage(message) {
        let data = JSON.parse(message.data);
        for (let key in this.RESPONSE_KEY) {
            let response = this.RESPONSE_KEY[key];

            if (data[response]) {
                if (key == 'AUTHORIZE') {
                    EventBus.dispatch(Event.READY, data[response]);
                    this.getTranscations();
                    this.getTicks();
                    this.getHistory();
                } else {
                    if (key == 'HISTORY') this.useHistory(data[response]);
                    EventBus.dispatch(this.EVENT_PREFIX + key, data[response]);
                }
            }
        }

    },
    authorize() {
        this.send('authorize', this.API_KEY);
    },
    useHistory(data) {
      let lowestPrice = data.prices[0];
      let highestPrice = data.prices[0];
      data.prices.forEach(function(price) {
            if (price < lowestPrice || !lowestPrice) lowestPrice = price;
            if (price > highestPrice) highestPrice = price;
        }.bind(this));
      EventBus.dispatch(Event.HIGH_LOW, {
        highestPrice:highestPrice,
        lowestPrice:lowestPrice
      });
    },
    getHistory(count) {
        clearTimeout(this.historyTimer);
        this.historyTimer = setTimeout(function() {
            let sessionModel = EventBus.getHook('getSessionModel');
            this.ws.send(JSON.stringify({
                "ticks_history": sessionModel.state.assetName,
                "end": "latest",
                "count": count ? count : 5000
            }));
            this.getHistory(200);
        }.bind(this), 1000);
    },
    getTranscations() {
        this.ws.send(JSON.stringify({
            "transaction": 1,
            "subscribe": 1
        }));

    },
    getTicks() {
        let sessionModel = EventBus.getHook('getSessionModel');
        this.ws.send(JSON.stringify({ ticks: sessionModel.state.assetName }));
    },
    send(key, value) {
        let obj = {};
        obj[key] = value;
        this.ws.send(JSON.stringify(obj));
    },
    disconnect() {

    }
};
module.exports = BinaryService;
