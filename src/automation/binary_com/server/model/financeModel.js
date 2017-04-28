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
            winCount: 0,
            lossCount: 0
        };
        this.isFirstTime =true;
        this.onBalanceScoped = this.onBalance.bind(this);
        this.onTransactionScoped = this.onTransaction.bind(this);

        this.init();
    }
    init() {
        console.log('new FinanceModel', this.state.profit);
    }
    onTransaction(data) {
        if (data.action != 'sell') return;
        console.log('onTransaction', this.state.profit);
        this.updateBalance(data);
        let isWin = false;
        if (data.amount == '0.00') {
            this.setLoss();
        } else {
            isWin = true;
            this.setWin(data);
        }
        console.log('profit', '£' + this.state.profit);

        let isDone = this.checkSessionDone();
        EventBus.dispatch(Event.TRANSCATION_COMPLETE, {
            isWin: isWin,
            profit: this.state.profit,
            balance: this.state.balance,
            ended: isDone
        });
        if (isDone) {
            EventBus.dispatch(Event.SESSION_COMPLETE, {
                profit: this.state.profit,
                balance: this.state.balance
            });
        }
        console.log('isDone', isDone);
    }
    setLoss() {
        console.log('loss');
        this.state.lossCount++;
        this.state.martingale = true;
        this.setStake(true);
    }
    setWin(data) {
        this.state.winCount++;
        console.log('win', '£' + data.amount);
    }
    checkSessionDone() {
        //if (this.state.profit >= (this.state.stake * this.state.profitCapMultiple) || this.state.profit <= -(this.state.stake * this.state.lossCapMultiple)) {
        return true;
        //}
    }
    updateBalance(data) {
      if(!data.balance)return;
        this.state.balance = Number(data.balance);
        console.log('updateBalance profit',this.state.profit ,!this.state.startBalance)
        if(this.state.startBalance) {
          console.log('startBalance',this.state.startBalance);
          this.state.profit = this.state.balance - this.state.startBalance;
        }
        console.log('updateBalance', this.state.balance, this.state.startBalance,this.state.profit );
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
      console.log('onBalance');
        this.state.balance = data.balance;
        console.log('startBalance', this.state.startBalance);
        console.log('balance', this.state.balance);
    }
    setProfit() {
        console.log('setProfit');
        //this.state.profit = this.state.balance - this.state.startBalance;
    }
    setBalance(value) {
      console.log('setBalance',this.state.startBalance);
        if (!this.state.startBalance) {
          console.log('setBalance doesnt have startBalance');
            this.state.startBalance = value;
            EventBus.addEventListener('ON_BALANCE', this.onBalanceScoped);
            EventBus.addEventListener('ON_TRANSACTION', this.onTransactionScoped);
        }
        this.state.balance = value;
        console.log('setBalance balance',this.state.balance,this.state.startBalance);
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
    purge() {
        EventBus.removeEventListener('ON_BALANCE', this.onBalanceScoped);
        EventBus.removeEventListener('ON_TRANSACTION', this.onTransactionScoped);
        this.state = {};
    }
};

module.exports = FinanceModel;
