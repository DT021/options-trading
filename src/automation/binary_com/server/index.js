const EventBus = require('./event/Eventbus.js');
const BinaryService = require('./service/binaryService.js');
const SessionModel = require('./model/sessionModel.js');

const Controller = {
  sessionModel:null,
  init(){
    console.log('init');
    EventBus.addEventListener('READY',this.onReady.bind(this));
    BinaryService.connect();
  },
  onReady(data){
    console.log('ready');
    this.sessionModel = new SessionModel(data);
  }  
}.init();