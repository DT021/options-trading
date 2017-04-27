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
      profitCap: 5,
      lossCap: -5,
      profitCapMultiple: 5,
      lossCapMultiple: 5,
      stake: 1,
      currentStake: 1,
      martingale: false,
      payoutPercentage: 0.942,
      martingaleCount: 0,
      useMartingale: false,
      winCount:0,
      lossCount:0
    };
    this.onBalanceScoped =  this.onBalance.bind(this);
    this.onTransactionScoped =  this.onTransaction.bind(this);

    this.init();
  }
  init() {
    EventBus.addEventListener('ON_BALANCE', this.onBalanceScoped);
    EventBus.addEventListener('ON_TRANSACTION', this.onTransactionScoped);
  }
  onTransaction(data) {
    this.updateBalance(data);
    if (data.action != 'sell') return;
    let isWin = false;
    if (data.amount == '0.00') {
      this.setLoss();
    } else {
      isWin = true;
      this.setWin(data);
    }
    let isDone = this.checkSessionDone();
    EventBus.dispatch(Event.TRANSCATION_COMPLETE, {
      isWin: isWin,
      profit: this.state.profit,
      balance: this.state.balance,
      ended:isDone
    });
    console.log('profit', '£' + this.state.profit);
  }
  setLoss() {
    console.log('loss');
    this.state.lossCap++;
    this.state.martingale = true;
    this.setStake(true);
  }
  setWin(data) {
    this.state.winCount++;
    console.log('win', '£' + data.amount);
  }
  checkSessionDone() {
    if (this.state.profit >= (this.state.stake * this.state.profitCapMultiple) || this.state.profit <= -(this.state.stake * this.state.lossCapMultiple)) {
      EventBus.dispatch(Event.SESSION_COMPLETE, {
        profit: this.state.profit,
        balance: this.state.balance
      });

      return true;
    }
  }
  updateBalance(data) {
    this.setBalance(data.balance);
    this.state.profit = this.state.balance - this.state.startBalance;
  }
  setStake(isLoss) {
    if (this.state.useMartingale && isLoss) {
      let doubleStake = (this.state.currentStake * 2);
      this.state.currentStake = doubleStake + (doubleStake - (doubleStake * this.state.payoutPercentage));
      if (this.martingaleCount > 3 || this.state.profit - this.state.currentStake < this.state.lossCap) this.resetStake();
      this.martingaleCount++;
    } else {
      this.martingaleCount = 0;
      this.resetStake();
    }
  }
  resetStake() {
    this.state.currentStake = this.stake;
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
      lossCap: -(this.state.stake * this.state.lossCapMultiple),
      profitCap: this.state.stake * this.state.profitCapMultiple,
      stake: this.state.stake,
      winCount: this.state.winCount,
      lossCount: this.state.lossCount
    };
  }
  purge(){
    EventBus.removeEventListener('ON_BALANCE', this.onBalanceScoped);
    EventBus.removeEventListener('ON_TRANSACTION', this.onTransactionScoped);
  }
};

module.exports = FinanceModel;
