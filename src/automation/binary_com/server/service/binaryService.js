const Websocket = require('ws');
const EventBus = require('../event/eventbus.js');
const SessionModel = require('../model/sessionModel.js');

const BinaryService = {
  EVENT:{
    CONNECT:'CONNECT',
    DISCONNECT:'DISCONNECT',
    REQUEST:'REQUEST',
    READY:'READY'
  },
  EVENT_PREFIX:'ON_',
  RESPONSE_KEY:{
    AUTHORIZE:'authorize',
    BALANCE:'balance',
    ASSEX_INDEX:'assex_index',
    HISTORY:'history',
    PROPOSAL:'proposal',
    TRANSACTION:'transaction',
    FORGET_ALL:'forget_all',
    TICK:'tick'
  },
  API_KEY:'4F61diD8mzgGDD1',
  APP_ID:'3374',
  ws:null,
  init(){
    EventBus.addEventListener(this.EVENT.CONNECT,this.connect.bind(this));
    EventBus.addEventListener(this.EVENT.REQUEST,this.onRequest.bind(this));
    EventBus.addEventListener(this.EVENT.DISCONNECT,this.disconnect.bind(this));
  },
  connect(){
    this.ws = new Websocket('wss://ws.binaryws.com/websockets/v3?app_id=' + this.APP_ID);
    this.ws.onopen=this.onOpen.bind(this);
    this.ws.onmessage=this.onMessage.bind(this);
  },
  onOpen(event){
   console.log('open');
    this.authorize();
  },
  onRequest(data){
    this.send(data.key,data.value);
  },
  onMessage(message){
    console.log('message',message);
    let data = JSON.parse(message.data);
    for(let key in this.RESPONSE_KEY){
      let response = this.RESPONSE_KEY[key];
      
      if(data[response]){
        if(key == 'AUTHORIZE') {
          EventBus.dispatch(this.EVENT.READY, data[response]);
        } else {
          EventBus.dispatch(this.EVENT_PREFIX + this.RESPONSE_KEY, data[response ]);
        }
      }
    }
    
  },
  authorize(){
    this.send('authorize', this.API_KEY);
  },
  send(key,value){
    let obj = {};
    obj[key] = value;
    this.ws.send(JSON.stringify(obj));
  },
  disconnect(){

  }
};
BinaryService.init();
module.exports = BinaryService;