let EventBus;
const Event = require('../event/event.js');
const FinanceModel = require('./financeModel.js');

class SessionModel {
  constructor(data, _EventBus) {
    EventBus = _EventBus;
    this.state = {
      currency: '',
      isVirtual: false,
      loginId: null,
      assetName: 'R_100', //frxEURGBP
      highestPrice: 0,
      lowestPrice: 0,
      tickDuration: 10,
      startTime: this.formatDate(new Date()),
      endTime: null
    }
    this.financeModel = null;
    this.onHighLowScoped = this.onHighLow.bind(this);
    this.init(data);
  }
  init(data) {
    EventBus.addEventListener(Event.HIGH_LOW, this.onHighLowScoped);
    this.state.currency = data.currency;
    this.state.isVirtual = data.isVirtual;
    this.state.loginId = data.loginId;
    this.financeModel = new FinanceModel(EventBus);
    console.log('New SessionModel',this.financeModel.state.profit);
    this.financeModel.setBalance(data.balance);
  }
  onHighLow(data) {
    this.state.lowestPrice = data.lowestPrice;
    this.state.highestPrice = data.highestPrice;
    EventBus.dispatch(Event.UPDATE_DATA, {});
  }
  getData() {
    let financeData = this.financeModel.getData();
    let obj = {};
    for (let key in this.state) {
      obj[key] = this.state[key];
    }
    for (let key in financeData) {
      obj[key] = financeData[key];
    }
    return obj;
  }
  formatDate(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
  }
  purge() {
    this.state.endTime = this.formatDate(new Date());
    EventBus.removeEventListener(Event.HIGH_LOW, this.onHighLowScoped);
    this.financeModel.purge();
  }
  destroy(){
    this.financeModel = null;
  }
};

module.exports = SessionModel;
