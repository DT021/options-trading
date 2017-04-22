const EventBus = require('../event/eventbus.js');
class FinanceModel {
  constructor(){
    this.state={
      balance:0,
      profit:''
    };
    this.init();
  }
  init(){
    EventBus.addEventListener('ON_BALANCE',this.onBalance.bind(this));
  }
  onBalance(data){
    this.state.balance = data.balance;
    console.log(this.state);
  }
  setBalance(value){
   this.state.balance = value;
  }
};

module.exports = FinanceModel;