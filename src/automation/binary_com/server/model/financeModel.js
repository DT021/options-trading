const EventBus = require('../event/eventbus.js');
class FinanceModel {
  constructor(){
    this.state={
      balance:0,
      profit:0,
      lossCap:-20,
      profitCap:50
    };
    this.init();
  }
  init(){
    EventBus.addEventListener('ON_BALANCE',this.onBalance.bind(this));
   
  }
  onBalance(data){
    this.state.balance = data.balance;
  }
  setBalance(value){
   this.state.balance = value;
  }
  getData(){
    return {
      balance:this.state.balance,
      profit:this.state.profit,
      lossCap:this.state.lossCap,
      profitCap:this.state.profitCap
    };
  }
};

module.exports = FinanceModel;