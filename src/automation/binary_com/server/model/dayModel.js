const Event = require('../event/event.js');
const SessionModel = require('../model/sessionModel.js');
let EventBus;

class DayModel {
  
  constructor(data, _EventBus) {
    EventBus = _EventBus;

    this.currentSessionModel = null;
    this.sessionCollection =[];
    this.dayKey =  '';
    this.state = {
      currency: '',
      balance: 0,
      isVirtual: 0,
      loginId: 0,
    };

    EventBus.addEventListener(Event.SESSION_COMPLETE, this.onSessionComplete.bind(this));
    this.createToday();
    this.updateState(data);
    this.createSessionModel();
    this.saveSession();
  }
  updateState(data) {
    this.state.currency = data.currency;
    this.state.balance = data.balance;
    this.state.isVirtual = data.is_virtual;
    this.state.loginId = data.loginid;
  }
  onSessionComplete(data) {
    this.createSessionModel();
  }
  storeSession() {
    this.currentSessionModel.purge();
    let data = this.currentSessionModel.getData();
    this.sessionCollection.push(data);
    this.saveSession(data);
    this.currentSessionModel.destroy();
    this.currentSessionModel = null;
  }
  saveSession(data) {
    let json = EventBus.getHook('getData', {
      directory: '../data/session',
      filename: this.dayKey + '.json'
    });
    if (!json['sessions']) json.sessions = [];
    if(data)json.sessions.push(data);

    EventBus.dispatch(Event.SAVE_DATA_TO_FILE, {
      data: json,
      directory: '../data/session',
      filename: this.dayKey + '.json'
    });
  }
  createSessionModel() {
    if (this.currentSessionModel) this.storeSession();
    this.currentSessionModel = new SessionModel(this.state, EventBus);
  }
  createToday() {
    let date = new Date();
    this.dayKey = date.getDay() + '_' + date.getMonth() + '_' + date.getYear();
  }
};

module.exports = DayModel;
