const Websocket = require('ws');
let EventBus;
const Event = require('../event/event.js');
const Config = require('../config.json');
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
  historyTimer: null,
  proposal: null,
  ws: null,
  isPaused: false,
  init(_EventBus) {
    EventBus = _EventBus;
    EventBus.addEventListener(Event.CONNECT, this.connect.bind(this));
    EventBus.addEventListener(Event.REQUEST, this.onRequest.bind(this));
    EventBus.addEventListener(Event.DISCONNECT, this.disconnect.bind(this));
    EventBus.addEventListener(Event.PURCHASE_CONTRACT, this.getProposal.bind(this));
    EventBus.addEventListener(Event.TOGGLE_DATA, this.onPauseData.bind(this));
    this.connect();
  },
  connect() {
    this.ws = new Websocket('wss://ws.binaryws.com/websockets/v3?app_id=' + Config.APP_ID);
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
  },
  onClose(event) {
    console.log('binary.com websocket closed');
  },
  onOpen(event) {
    //console.log('open');
    this.authorize();
  },
  onRequest(data) {
    this.send(data.key, data.value);
  },
  onMessage(message) {
    if (this.isPaused) return;
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
          switch(key){
            case 'HISTORY':
            this.useHistory(data[response]);
            break;
             case 'PROPOSAL':
              this.hasProposal(data);
            break;
            case 'TRANSACTION':
              console.log('BinaryService transaction');
            break;

          }
          EventBus.dispatch(this.EVENT_PREFIX + key, data[response]);
        }
      }
    }

  },
  onPauseData(data) {
    this.isPaused = data.isPaused;
  },
  authorize() {
    this.send('authorize', Config.API_KEY);
  },
  useHistory(data) {
    let lowestPrice = data.prices[0];
    let highestPrice = data.prices[0];
    data.prices.forEach(function(price) {
      if (price < lowestPrice || !lowestPrice) lowestPrice = price;
      if (price > highestPrice) highestPrice = price;
    }.bind(this));
    EventBus.dispatch(Event.HIGH_LOW, {
      highestPrice: highestPrice,
      lowestPrice: lowestPrice
    });
  },
  hasProposal(data) {
    if (!data.proposal) return;
    this.proposalId = data.proposal.id;
    this.ws.send(JSON.stringify({
      "buy": this.proposalId,
      "price": this.proposal.stake
    }));
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
      //this.getHistory(200);
    }.bind(this), 10000);
  },
  getTranscations() {
    this.ws.send(JSON.stringify({
      "transaction": 1,
      "subscribe": 1
    }));

  },
  getProposal(proposal) {
    if (!proposal) return;
    this.proposal = proposal;

    this.ws.send(JSON.stringify({
      "proposal": 1,
      "amount": proposal.stake,
      "basis": "stake",
      "contract_type": proposal.type,
      "currency": proposal.isVirtual ? "USD" : 'GBP',
      "duration": proposal.duration ? proposal.duration : "10",
      "duration_unit": "t",
      "symbol": proposal.assetName
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
