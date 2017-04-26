let EventBus;
const Event = require('../event/event.js');
class FinanceModel {
  constructor(_EventBus) {
    EventBus = _EventBus;
    this.state = {
      startBalance: 0,
      balance: 0,
      profit: 0,
      lossCap: -20,
      profitCap: 50,
      lossCap: -20,
      profitCapMultiple: 5,
      stake: 1,
      currentStake: 1,
      martingale: false,
      payoutPercentage:0.942,
      martingaleCount:0,
      useMartingale:false,
    };
    this.init();
  }
  init() {
    EventBus.addEventListener('ON_BALANCE', this.onBalance.bind(this));
    EventBus.addEventListener('ON_TRANSACTION', this.onTransaction.bind(this));

  }
  onTransaction(data) {
    this.setBalance(data.balance);
    this.state.profit = this.state.balance - this.state.startBalance;
    if (data.action != 'sell') return;
    let isWin = false;
    if (data.amount == '0.00') {
      console.log('loss');
      this.state.martingale = true;
      this.setStake(true);
    } else {
      isWin = true;
      console.log('win', '£' + data.amount);
    }
    EventBus.dispatch(Event.TRANSCATION_COMPLETE, {
      isWin: isWin,
      profit: this.state.profit,
      balance: this.state.balance
    });
    console.log('profit', '£' + this.state.profit);
  }
  checkSessionDone(){

  }
  setStake(isLoss) {
    if (this.state.useMartingale && isLoss) {
      let doubleStake = (this.state.currentStake * 2);
      this.state.currentStake = doubleStake + (doubleStake - (doubleStake * this.state.payoutPercentage));
      if(this.martingaleCount > 3 || this.state.profit - this.state.currentStake < this.state.lossCap)this.resetStake();
      this.martingaleCount++;
    }else{
    this.martingaleCount=0;
      this.resetStake();
    }
  }
  resetStake(){
    this.state.currentStake=this.stake;
  }
  onBalance(data) {
    this.state.balance = data.balance;
    console.log('startBalance', this.state.startBalance);
    console.log('balance', this.state.balance);
  }
  setProfit() {
    this.state.profit = this.state.balance - this.state.startBalance;
  }
  setBalance(value) {
    if (!this.state.startBalance) this.state.startBalance = value;
    this.state.balance = value;
  }
  getData() {
    return {
      startBalance: this.state.startBalance,
      balance: this.state.balance,
      profit: this.state.profit,
      lossCap: this.state.lossCap,
      profitCap: this.state.profitCap,
      stake: this.state.stake
    };
  }
};

module.exports = FinanceModel;
