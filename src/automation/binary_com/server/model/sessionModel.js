const EventBus = require('../event/eventbus.js');
const FinanceModel = require('./financeModel.js');

class SessionModel {
  constructor(data){
    this.state={
      currency:'',
      isVirtual:false, 
      loginId:null,
    }
    this.financeModel = null;
    this.init(data);
  }
  init(data){
    this.state.currency = data.currency;
    this.state.isVirtual = data.is_virtual;
    this.state.loginId = data.loginid; 
    this.financeModel = new FinanceModel();
    this.financeModel.setBalance(data.balances);
    console.log(this.state);
  }
};

module.exports = SessionModel;