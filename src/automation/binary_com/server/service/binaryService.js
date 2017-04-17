const EventBus = require('../event/eventbus.js');
const BinaryService = {
  EVENT:{
    CONNECT:'CONNECT',
    DISCONNECT:'DISCONNECT',
  },
  init(){
    EventBus.addEventListener(this.EVENT.CONNECT,this.connect.bind(this));
    EventBus.addEventListener(this.EVENT.DISCONNECT,this.disconnect.bind(this));
  },
  connect(){

  },
  disconnect(){

  }
};

module.exports = BinaryService;