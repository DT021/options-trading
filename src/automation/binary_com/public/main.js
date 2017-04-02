const Main = {
    ws: null,
    history: [],
    previousPrice: 0,
    previousDirection: '',
    winCount: 0,
    lossCount: 0,
    balance: 100,
    startBalance: 0,
    accountBalance: 0,
    payout: 0.942,
    stake: 10,
    currentStake: 10,
    lossStreak: 0,
    lastStrategy: '',
    started: false,
    currentTick: 0,
    stakeTicks: 5,
    currentContract: null,
    callProposalID: null,
    putProposalID: null,
    ended: false,
    numberOfTrades: 0,
    waitingForProposal:false,
    init() {
        this.ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=' + Config.appID);
        this.addListener();
    },
    addListener() {
        this.ws.onopen = this.onOpen.bind(this);

        this.ws.onmessage = this.onMessage.bind(this);
    },
    onOpen(event) {
        //USGOOG
        //frxEURGBP

        this.authorize();

    },
    authorize() {
        this.ws.send(JSON.stringify({ "authorize": Config.apiKey }));
    },
    buyContract() {
        this.ws.send(JSON.stringify({
            "buy": this.proposalID,
            "price": 100
        }));
    },
    getBalance() {
        this.ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
    },
    addFunds() {
        this.ws.send(JSON.stringify({ topup_virtual: '100' }));
    },
    end() {
        this.ws.send(JSON.stringify({
            "forget_all": "ticks"
        }));
        this.ws.send(JSON.stringify({
            "forget_all": "balance"
        }));
         this.ws.send(JSON.stringify({
            "forget_all": "transaction"
        }));
    },
    getTranscations() {
        this.ws.send(JSON.stringify({
            "transaction": 1,
            "subscribe": 1
        }));

    },
    getHistory() {
        this.ws.send(JSON.stringify({
            "ticks_history": "R_100",
            "end": "latest",
            "count": 50
        }));
    },
    getPriceProposal(type) {
        /*
        {
        "proposal": 1,
        "amount": "10",
        "basis": "stake",
        "contract_type": "CALL",
        "currency": "GBP",
        "duration": "5",
        "duration_unit": "t",
        "symbol": "R_100"
      }
        */
console.log('proposal');
        this.ws.send(JSON.stringify({
            "proposal": 1,
            "amount": "10",
            "basis": "stake",
            "contract_type": type ? type : "CALL",
            "currency": "USD",
            "duration": "5",
            "duration_unit": "t",
            "symbol": "R_100"
        }));
    },
    getTicks() {
        this.ws.send(JSON.stringify({ ticks: 'R_100' }));
    },
    onMessage(event) {
        var data = JSON.parse(event.data);
        switch (data.msg_type) {
            case 'authorize':
                console.log(data);
                this.addFunds();
                break;
            case 'topup_virtual':
                this.getBalance();
                break;
            case 'balance':
                if (!this.startBalance) this.startBalance = data.balance.balance;
                this.accountBalance = data.balance.balance;
                let profit = this.accountBalance - this.startBalance;
                if (profit < -50 || profit > 100) {
                    this.ended = true;
                }
                console.log('profit', profit, this.ended );
                if (!this.started) this.getHistory();
                break;
            case 'history':
                var result = movingAverage(data.history.prices);
                this.history = data.history.prices;
                this.started = true;
                this.getTicks();
                this.getTranscations();
                break;
            case 'proposal':
                  console.log(data);
                this.proposalID = data.proposal.id;
                this.waitingForProposal = false;
                this.buyContract();
                break;
            case 'buy':
                 console.log('buy',data);
                this.currentContract = data.buy;
                break;
            case 'transaction':
                // console.log('transaction', data.transaction);
                if (data.transaction.action == 'sell') {
                    this.numberOfTrades++;
                    let isWin = Number(data.transaction.amount) > 0;
                    console.log('isWin', isWin);
                    if (!this.ended) {
                        this.checkWin(isWin);
                        this.currentContract = null;
                    }
                }
                break;
            case 'forget_all':
            console.log('forget_all',data);
            break;
            case 'tick':
                if (data.tick) {
                    this.currentTick++;
                    //this.isWin(data.tick.quote);
                    this.history.push(data.tick.quote);
                    console.log('ticks update: %o', data.tick.quote);
                    if (!this.currentContract && !this.waitingForProposal) {
                      this.waitingForProposal=true;
                        this.previousPrice = data.tick.quote;
                        this.createContract();

                    }

                }
                break;
        }

    },
    createContract() {
        this.checkTrend();
        this.getPriceProposal();
    },
    checkWin(win) {
        if (win) {
            this.winCount++;
            this.lossStreak = 0;
        } else {
            this.lossCount++;
            this.lossStreak++
        }
        if (win) {
            this.balance += this.currentStake * this.payout;
            this.currentStake = this.stake;
        } else if (this.previousDirection) {
            this.balance -= this.currentStake;
            this.currentStake = (this.currentStake * 2) + this.currentStake * 0.058;
        }
    },
    checkWin2(price) {
        let win = false;
        if (this.previousDirection == 'up') {
            if (this.previousPrice < price) {
                win = true;
                this.winCount++;
                this.lossStreak = 0;
            } else {
                this.lossCount++;
                this.lossStreak++
            }
        } else if (this.previousDirection == 'down') {
            if (this.previousPrice > price) {
                win = true;
                this.winCount++;
                this.lossStreak = 0;
            } else {
                this.lossCount++;
                this.lossStreak++
            }
        }
        console.log('wins ', this.winCount, '/ loses ', this.lossCount);
        if (win) {
            this.balance += this.currentStake * this.payout;
            this.currentStake = this.stake;
        } else if (this.previousDirection) {
            this.balance -= this.currentStake;
            this.currentStake *= 2;
        }
        console.log('strategy', this.lastStrategy);
        console.log('balance', this.balance);
    },
    checkTrend() {

        let lowestPrice = 0;
        let highestPrice = 0;
        let latestPrice = this.history[this.history.length - 1];
        let previousPrice = this.history[this.history.length - 5];
        let lastPrice = this.history[0];
        let futureDirection = '';
        let closestToTopPercentage = ((latestPrice - lowestPrice) / (highestPrice - lowestPrice)).toFixed(2);

        this.history.forEach(function(price) {
            if (price < lowestPrice || !lowestPrice) lowestPrice = price;
            if (price > highestPrice) highestPrice = price;
        }.bind(this));

        //console.log('lowestPrice', lowestPrice);
        //console.log('highestPrice', highestPrice);
        // console.log('latestPrice', latestPrice);
        //console.log('previousPrice', previousPrice);

        //console.log('closestToTopPercentage', closestToTopPercentage);
        if (latestPrice > previousPrice) {
            if (closestToTopPercentage > 0.95) {
                //console.log('up 0.9');
                this.lastStrategy = 'greater_0.95';
                futureDirection = 'down';
            } else if (closestToTopPercentage > 0.4) {
                //console.log('up 0.6');
                this.lastStrategy = 'greater_0.4';
                futureDirection = 'up';
            }
        } else {
            if (closestToTopPercentage > 0.95) {
                // console.log('falling 0.9');
                this.lastStrategy = 'less_0.95';
                futureDirection = 'up';
            } else if (closestToTopPercentage < 0.4) {
                // console.log('falling 0.4');
                futureDirection = 'down';
                this.lastStrategy = 'less_0.4';

            }
        }
        this.previousDirection = futureDirection;

    }

}.init();
