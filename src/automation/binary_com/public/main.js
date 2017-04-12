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
    stake: 1,
    currentStake: 1,
    lossStreak: 0,
    lastStrategy: '',
    started: false,
    currentTick: 0,
    stakeTicks: 10,
    currentContract: null,
    callProposalID: null,
    putProposalID: null,
    ended: false,
    numberOfTrades: 0,
    waitingForProposal: false,
    startMartingale: false,
    strategyFlipCount: 0,
    currentPrice: 0,
    localWS: null,
    prediction: null,
    testLossCount: 0,
    testWinCount: 0,
    highestPrice: 0,
    lowestPrice: 0,
    prediction: '',
    ASSET_NAME: 'frxEURGBP',
    predictionItem: null,
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
        this.localWS.onmessage = this.onLocalMessage.bind(this);

        ChartComponent.create();
        View.init();
    },
    onLoaded() {
        if (emailjs) emailjs.init("user_e0Qe9rVHi8akjBRcxOX5b");
        this.ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=' + Config.appID);
        this.localWS = new WebSocket('ws://localhost:3000/ws');
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
        View.ended();
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
            "ticks_history": this.ASSET_NAME,
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
        "symbol": this.ASSET_NAME
      }
        */
        //  console.log('proposal');
        View.updatePrediction(type);
        this.ws.send(JSON.stringify({
            "proposal": 1,
            "amount": this.currentStake,
            "basis": "stake",
            "contract_type": type ? type : "CALL",
            "currency": "USD",
            "duration": "10",
            "duration_unit": "t",
            "symbol": this.ASSET_NAME
        }));
    },
    getTicks() {
        this.ws.send(JSON.stringify({ ticks: this.ASSET_NAME }));
    },
    onLocalMessage(event) {
        var data = JSON.parse(event.data);
        switch (data.key) {
            case 'prediction':
                if (this.prediction) return;
                this.prediction = data.data;

                console.log('prediction', this.prediction);
                if (this.prediction) this.getPriceProposal(this.prediction === 'fall' ? 'PUT' : 'CALL');
                break;
        }
    },
    onMessage(event) {
        var data = JSON.parse(event.data);
        switch (data.msg_type) {
            case 'authorize':
                // console.log(data);
                //this.addFunds();
                this.getBalance();
                break;
            case 'topup_virtual':
                this.getBalance();
                break;
            case 'balance':
                if (!this.startBalance) this.startBalance = data.balance.balance;
                this.accountBalance = data.balance.balance;
                let profit = this.accountBalance - this.startBalance;
                this.startMartingale = true;
                if (profit <= -20) {
                    this.startMartingale = false;
                }
                if (profit <= -50 || profit >= 50) {
                    this.end();

                    // console.log('ended with profit', profit);
                }
                View.updateBalance(this.accountBalance, profit);
                //console.log('current profit', '£' + profit.toFixed(2));
                if (!this.started) this.getHistory();
                break;
            case 'history':
                this.history = data.history.prices;
                this.started = true;
                this.getTicks();
                this.getTranscations();
                break;
            case 'proposal':
                // console.log('proposal', data);
                if (!data.proposal) return;
                this.proposalID = data.proposal.id;
                this.waitingForProposal = false;
                this.buyContract();
                break;
            case 'buy':
                //console.log('buy', data);
                break;
            case 'transaction':
                //console.log('transaction', data.transaction);
                let isLoss = false;
                if (data.transaction.action && data.transaction.action == 'sell') {
                    let profit = this.accountBalance - this.startBalance;

                    if (data.transaction.amount === '0.00') {
                        isLoss = true;
                        this.lossCount++;
                        if (profit < -40) this.end();
                    } else {
                        this.winCount++;
                        if (profit >= 50) this.end();
                        this.sendSuccessfulPrediction();
                    }
                    this.prediction = '';
                    this.predictionItem = null;
                    View.updatePrediction('');

                    this.setStake(isLoss);
                    View.updateCounts(this.winCount, this.lossCount);
                    // console.log('numberOfWins', this.winCount, '/ numberOfLosses', this.lossCount)
                }
                break;
            case 'forget_all':
                console.log('forget_all', data);
                break;
            case 'tick':
                if (data.tick) {
                    this.currentTick++;
                    this.history.push(data.tick.quote);
                    //console.log('ticks update: %o', data.tick.quote);
                    this.currentPrice = data.tick.quote;
                    this.setPositions();
                    this.setDirectionCollection();
                    this.setPredictionData();
                    this.addTickToContract();
                    ChartComponent.update({
                        price: this.currentPrice,
                        time: Date.now(),
                        lowestPrice: this.lowestPrice
                    });
                    if (!this.currentContract && this.currentTick < 10) {
                        this.createContract();
                    } else if (this.currentTick >= 10) {
                        this.contractEnded();
                    }
                }
                break;
        }

    },
    sendSuccessfulPrediction() {
        this.localWS.send(JSON.stringify({
            key: 'sucessfulTrade',
            data: {
                prediction: this.prediction,
                item: this.predictionItem,
                asset: this.ASSET_NAME
            }
        }));
    },
    setStake(isLoss) {
        if (isLoss) {
             this.currentStake = (this.currentStake * 2) + (this.currentStake * (1 - this.payout));
            if (this.currentStake >= 20) this.currentStake = this.stake;
        } else {
            this.currentStake = this.stake;
        }
    },
    createContract() {
        this.currentTick = 0;

        this.currentContract = {
            asset: this.ASSET_NAME,
            type: '',
            startLowestPrice: this.lowestPrice,
            startHighestPrice: this.highestPrice,
            datetime: new Date().toString(),
            startPrice: this.currentPrice,
            startPricePosition: this.startPricePosition,
            endPrice: null,
            lastTicks: this.lastTicks,
            ticks: [
                this.currentPrice
            ],
            numberOfDowns: 0,
            numberOfUps: 0,
            numberOfHistoricDowns: 0,
            numberOfHistoricUps: 0,
            numberOfEquals: 0,
            numberOfHistoricEquals: 0,
            directions: [],
            historicDirections: this.directionCollection
        };
    },
    setPositions() {
        let highestPrice = 0;
        let lowestPrice = 0;

        this.history.forEach(function(price) {
            if (price < lowestPrice || !lowestPrice) lowestPrice = price;
            if (price > highestPrice) highestPrice = price;
        }.bind(this));

        this.lowestPrice = lowestPrice;
        this.highestPrice = highestPrice;
        this.startPricePosition = ((this.currentPrice - lowestPrice) / (highestPrice - lowestPrice)).toFixed(2);
        this.lastTicks = this.history.slice(this.history.length - 11, this.history.length - 1);
    },
    setDirectionCollection() {
        this.directionCollection = [];
        this.numberOfHistoricUps = 0;
        this.numberOfHistoricEquals = 0;
        this.numberOfHistoricDowns = 0;

        let previous = 0;

        this.lastTicks.forEach(function(price) {
            if (!previous) {
                previous = price;
            } else if (previous < price) {
                this.directionCollection.push('up');
                this.numberOfHistoricUps++;
            } else if (price > previous) {
                this.directionCollection.push('down');
                this.numberOfHistoricDowns++;
            } else {
                this.directionCollection.push('equal');
                this.numberOfHistoricEquals++;
            }
        }.bind(this));
    },
    setPredictionData() {
        this.predictionItem = {
            startPricePosition: this.startPricePosition,
            historicDirections: this.directionCollection
        }
        this.localWS.send(JSON.stringify({
            key: 'getPrediction',
            data: {
                asset: this.ASSET_NAME,
                currentPrice: this.currentTick,
                lastTicks: this.lastTicks,
                highestPrice: this.highestPrice,
                lowestPrice: this.lowestPrice,
                startPricePosition: this.startPricePosition,
                historicDirections: this.directionCollection
            },
        }));
    },
    addTickToContract() {
        if (!this.currentContract) return;
        let lastPrice = this.currentContract.ticks[this.currentContract.ticks.length - 2];
        if (lastPrice != undefined) {
            if (lastPrice > this.currentPrice) {
                this.currentContract.numberOfDowns++;
                this.currentContract.directions.push('down');
            } else if (lastPrice < this.currentPrice) {
                this.currentContract.numberOfUps++;
                this.currentContract.directions.push('up');
            } else {
                this.currentContract.numberOfEquals++;
                this.currentContract.directions.push('equal');
            }
        }
        this.currentContract.ticks.push(this.currentPrice);
    },
    contractEnded() {
        let lowestPrice = 0;
        let highestPrice = 0;

        this.history.forEach(function(price) {
            if (price < lowestPrice || !lowestPrice) lowestPrice = price;
            if (price > highestPrice) highestPrice = price;
        }.bind(this));

        this.currentTick = 0;
        this.currentContract.endPrice = this.currentPrice;
        this.currentContract.endPricePosition = ((this.currentPrice - lowestPrice) / (highestPrice - lowestPrice)).toFixed(2);
        this.currentContract.type = this.currentContract.startPrice > this.currentPrice ? 'fall' : 'raise';

        this.localWS.send(JSON.stringify({
            key: 'tickData',
            data: this.currentContract,
            asset: this.ASSET_NAME
        }));
        this.currentContract = null;


    }

}.init();
