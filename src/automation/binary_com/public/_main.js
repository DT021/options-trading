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
    waitingForProposal: false,
    startMartingale: false,
    strategyFlipCount: 0,
    STRATEGY: {
        ABOVE: {
            TOP: 'down',
            BOTTOM: 'up'
        },
        BELOW: {
            TOP: 'up',
            BOTTOM: 'down'
        }
    },
    currentStrategy: 'ABOVE_TOP',
    init() {
        document.addEventListener('DOMContentLoaded', this.onLoaded.bind(this));

    },
    addListener() {
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
    },
    onLoaded() {
        emailjs.init("user_e0Qe9rVHi8akjBRcxOX5b");
        this.ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=' + Config.appID);
        this.addListener();
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
    getDateTimeString() {
        var currentdate = new Date();
        return currentdate.getDate() + "/" + (currentdate.getMonth() + 1) + "/" + currentdate.getFullYear() + " @ " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
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

        emailjs.send("mailgun", "template_D3XUMSOA", { to_name: "Fahim", message_html: "Balance today is £" + this.accountBalance + "\n and the end time is " + this.getDateTimeString() });
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
            "count": 1000
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
            "amount": this.currentStake,
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
                // console.log(data);
                this.addFunds();
                break;
            case 'topup_virtual':
                this.getBalance();
                break;
            case 'balance':
                if (!this.startBalance) this.startBalance = data.balance.balance;
                this.accountBalance = data.balance.balance;
                let profit = this.accountBalance - this.startBalance;
                if (profit > 10) {
                    this.startMartingale = true;
                } else if (profit < -20) {
                    this.startMartingale = false;
                }
                if (profit < -50 || profit > 100) {
                    this.ended = true;
                    this.end();
                    console.log('ended with profit', profit);
                }
                console.log('current profit', profit);
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
                 console.log('proposal',data);
                this.proposalID = data.proposal.id;
                this.waitingForProposal = false;
                this.buyContract();
                break;
            case 'buy':
                console.log('buy', data);
                this.currentContract = data.buy;
                break;
            case 'transaction':
               console.log('transaction', data.transaction);
                if (data.transaction.action == 'sell') {
                    this.numberOfTrades++;
                    let isWin = Number(data.transaction.amount) > 0;
                    console.log('isWin', isWin);
                    this.checkWin(isWin);
                    if (!this.ended) {
                        this.currentContract = null;
                    }
                }
                break;
            case 'forget_all':
                console.log('forget_all', data);
                break;
            case 'tick':
                if (data.tick) {
                    this.currentTick++;
                    //this.isWin(data.tick.quote);
                    this.history.push(data.tick.quote);
                    console.log('ticks update: %o', data.tick.quote);
                    if (!this.currentContract && !this.waitingForProposal) {
                        this.waitingForProposal = true;
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
            this.balance += this.currentStake * this.payout;
            this.currentStake = this.stake;

        } else {
            this.lossCount++;
            this.strategyFlipCount++;
            if (this.startMartingale) {
                this.lossStreak++;
                this.currentStake = (this.currentStake * 2) + this.currentStake * 0.058;
            }

            this.balance -= this.currentStake;
        }
        if (this.strategyFlipCount > 2) {
            //this.currentStake = this.stake;
            this.strategyFlipCount = 0;
            //this.lossStreak=0;
            //flip strategy
            console.log('FLIP STRATEGY');
            this.STRATEGY.ABOVE.TOP = this.STRATEGY.ABOVE.TOP == 'down' ? 'up' : 'down';
            this.STRATEGY.ABOVE.BOTTOM = this.STRATEGY.ABOVE.BOTTOM == 'down' ? 'up' : 'down';
            this.STRATEGY.BELOW.TOP = this.STRATEGY.BELOW.TOP == 'down' ? 'up' : 'down';
            this.STRATEGY.BELOW.BOTTOM = this.STRATEGY.BELOW.BOTTOM == 'down' ? 'up' : 'down';
        }
    },
    /*
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
    */
    checkTrend() {

        let lowestPrice = 0;
        let highestPrice = 0;
        let latestPrice = this.history[this.history.length - 1];
        let previousPrice = this.history[this.history.length - 999];
        let lastRangePrice = this.history[this.history.length - 100];
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
        if (latestPrice > lastRangePrice) {
            if (closestToTopPercentage > 0.95) {
                //console.log('up 0.9');
                this.lastStrategy = 'ABOVE_BOTTOM';
                futureDirection = this.STRATEGY.ABOVE.BOTTOM;
            } else if (closestToTopPercentage > 0.4) {
                //console.log('up 0.6');
                this.lastStrategy = 'ABOVE_TOP';
                futureDirection = this.STRATEGY.ABOVE.TOP;
            }
        } else {
            if (closestToTopPercentage > 0.95) {
                // console.log('falling 0.9');
                this.lastStrategy = 'BELOW_BOTTOM';
                futureDirection = this.STRATEGY.BELOW.BOTTOM;
            } else if (closestToTopPercentage < 0.4) {
                // console.log('falling 0.4');
                futureDirection = this.STRATEGY.BELOW.TOP;
                this.lastStrategy = 'BELOW_TOP';

            }
        }
        this.previousDirection = futureDirection;

    }

}.init();
