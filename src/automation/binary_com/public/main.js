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
    highestPrice: null,
    lowestPrice: null,
    lossLimit: -20,
    profitLimit: 50,
    prediction: '',
    ASSET_NAME: 'R_100',
    predictionItem: null,
    highestProfit: 0,
    lowestProfit: null,
    isProposal: false,
    historicHighest: 0,
    historicLowest: 0,
    trendLength: 4000,
    shortTrendLength: 20,
    historyTimes: [],
    startTime: null,
    predictionType: null,
    predictionModel: null,
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
        View.updateStake(this.currentStake, this.lossLimit, this.profitLimit);
    },
    onLoaded() {
        let type = this.getParameterByName('type');
        if (type) this.predictionModel = type;
        if (window.emailjs) emailjs.init("user_e0Qe9rVHi8akjBRcxOX5b");
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
    getAvailableAssets() {
        this.ws.send(JSON.stringify({ asset_index: 1 }));
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

        emailjs.send("mailgun", "template_D3XUMSOA", {
            from_name: 'Travis',
            to_name: "Fahim",
            message_html: "Profit today was £" + this.profit.toFixed(2) + "<br> and the end time was " + this.getDateTimeString(),
            asset: this.ASSET_NAME,
            profit: this.profit.toFixed(2),
            balance: this.balance,
            predictionModel: this.predictionType,
            lowest_profit: this.lowestProfit.toFixed(2),
            highest_profit: this.highestProfit.toFixed(2),
            wins: this.winCount,
            loses: this.lossCount,
            startTime: this.startTime,
            endTime: this.getDateTimeString()
        });
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
            "count": 5000
        }));
    },
    getPriceProposal(type) {
        if (!type || this.isProposal) return;
        this.isProposal = true;
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
        View.updatePrediction(type, this.startPricePosition, this.currentPrice);
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
    getParameterByName(name, url) {
        if (!url) {
            url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },
    getTicks() {
        this.ws.send(JSON.stringify({ ticks: this.ASSET_NAME }));
    },
    sendAsset() {
        this.localWS.send(JSON.stringify({ key: 'asset', data: this.ASSET_NAME }));
    },
    onLocalMessage(event) {
        var data = JSON.parse(event.data);
        switch (data.key) {
            case 'highestLowest':
                this.highestPrice = data.data.highest;
                this.lowestPrice = data.data.lowest;
                if (!this.started) this.getHistory();
                break;
            case 'start':
                this.getHighestLowestPrice();
                break;
            case 'prediction':
                if (this.prediction) return;
                this.prediction = data.data;

                //console.log('prediction', this.prediction);
                if (this.prediction) {
                    // this.isProposal = true;
                    this.getPriceProposal(this.prediction === 'fall' ? 'PUT' : 'CALL');
                    View.updatePredictionType('PATTERN');
                }
                break;
        }
    },
    onMessage(event) {
        var data = JSON.parse(event.data);
        switch (data.msg_type) {
            case 'authorize':
                // console.log(data);
                //this.addFunds();
                this.startTime = this.getDateTimeString();
                this.getBalance();
                break;
            case 'topup_virtual':
                this.getBalance();
                break;
            case 'balance':
                if (!this.startBalance) this.startBalance = data.balance.balance;
                this.accountBalance = data.balance.balance;
                this.setLossLimit();
                //console.log('current profit', '£' + profit.toFixed(2));
                if (!this.started) this.getAvailableAssets();
                break;
            case 'asset_index':
                this.assetArray = data.asset_index;
                View.updateAsset(this.ASSET_NAME, this.assetArray, this.payout);
                this.sendAsset();

                break;
            case 'history':
                this.history = data.history.prices;
                this.historyTimes = data.history.times;
                this.started = true;
                this.getTicks();
                this.getTranscations();

                break;
            case 'proposal':
                console.log('proposal', data);
                if (!data.proposal) return;
                this.proposalID = data.proposal.id;
                this.waitingForProposal = false;
                this.payout = data.proposal.payout;
                View.updateAsset(this.ASSET_NAME, this.assetArray, this.payout);
                this.buyContract();
                break;
            case 'buy':
                //console.log('buy', data);
                break;
            case 'transaction':
                // console.log('transaction', data.transaction);
                let isLoss = false;
                if (data.transaction && data.transaction.action && data.transaction.action == 'sell') {

                    let profit = this.accountBalance - this.startBalance;

                    if (data.transaction.amount === '0.00') {
                        isLoss = true;
                        this.startMartingale = true;
                        this.lossCount++;
                        if (profit < this.lossLimit) this.end();
                    } else {
                        this.startMartingale = false;
                        this.winCount++;
                        if (profit >= this.profitLimit) this.end();
                        this.sendSuccessfulPrediction();
                    }
                    if (profit > 20) this.lossLimit = 15;
                    if (this.accountBalance <= 0 || profit <= this.lossLimit - 5 || profit / this.profitLimit > 0.8) {
                        this.end();
                    }
                    View.updateMartingale(this.startMartingale);
                    this.prediction = '';
                    this.predictionItem = null;
                    View.updatePrediction('');

                    this.setStake(isLoss);
                    View.updateCounts(this.winCount, this.lossCount);
                    this.isProposal = false;
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
                    this.addTickToContract();
                    this.setPredictionData();
                    ChartComponent.update({
                        price: this.currentPrice,
                        time: Date.now(),
                        lowestPrice: this.historicLowest
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
    setLossLimit() {
        let profit = this.accountBalance - this.startBalance;
        this.profit = profit;
        if (profit > this.highestProfit) this.highestProfit = profit;
        if (this.lowestProfit == null || profit < this.lowestProfit) this.lowestProfit = profit;
        if (profit > 20) {
           // this.lossLimit = 15;
        } else if (profit >= 10) {
           // this.lossLimit = 5;
        } else if (profit > 0 && this.highestProfit >= 10) {
           // this.lossLimit = 1;
        } else if (profit < -10 && this.highestProfit < 5) {
           // this.profitLimit = 0;
        }
        View.updateProfit(this.lowestProfit, this.highestProfit);
        View.updateBalance(this.accountBalance, profit);
    },
    getHighestLowestPrice() {
        this.localWS.send(JSON.stringify({
            key: 'getHighestLowest',
            data: {
                asset: this.ASSET_NAME
            }

        }));
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
        if (isLoss && this.startMartingale) {
            let doubleStake = this.currentStake * 2;
            this.currentStake = doubleStake;
           // if (this.currentStake >= 10) this.currentStake = this.stake;
        } else {
            this.currentStake = this.stake;
        }
        View.updateStake(this.currentStake, this.lossLimit, this.profitLimit);
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

        this.historicHighest = highestPrice;
        this.historicLowest = lowestPrice;

        this.lowestPrice = lowestPrice < this.lowestPrice ? lowestPrice : this.lowestPrice;
        this.highestPrice = highestPrice > this.highestPrice ? highestPrice : this.highestPrice;

        View.updateHighLow(this.lowestPrice, this.highestPrice, this.currentPrice);
        this.startPricePosition = (this.currentPrice / this.highestPrice).toFixed(4);
        this.lastTicks = this.history.slice(this.history.length - 11, this.history.length - 1);
        View.updateStartPosition(this.startPricePosition);
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
        if (this.isProposal) return;
        if (this.predictionModel != 'pattern') {
            let found = false;
            found = this.HighLowPrediction();
            if (!found) found = this.predictOnTrend();
        } else {
            this.predictionItem = {
                startPricePosition: this.startPricePosition,
                historicDirections: this.directionCollection
            };

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
        }

    },
    checkTrend() {
        let trendFirst = this.history[this.history - this.trendLength];
        let shortIndex = this.shortTrendLength;
        let losses = this.lossCount - this.winCount;
        let isShorter = false;
        if (this.lossCount > 2) {
            //shortIndex = this.shortTrendLength * 0.5;
            //isShorter = true;
        }
        let currentTrend = this.history[this.history.length - shortIndex];
        let change=0;
        let diff=0;
        if(currentTrend > this.currentPrice)
        {
            diff = (currentTrend - this.currentPrice);
        }else{
            diff = (this.currentPrice - currentTrend);
        }
        change =  (diff / currentTrend) * 1000;
        //console.log(currentTrend);
        return {
            shortTermTrend: currentTrend <= this.currentPrice ? 'raise' : (currentTrend > this.currentPrice ? 'fall' : ''),
            shortTermDifference:change,
            longTermTrend: trendFirst <= this.currentPrice ? 'raise' : (trendFirst > this.currentPrice ? 'fall' : ''),
            isShorter: isShorter,
            counts:this.trendCount(this.history.slice(this.history.length - 6,this.history.length - 1))
        };
    },
    trendCount(collection){
        let falls=0;
        let raises=0;
        let previousPrice=0;
        collection.forEach(function(price){
            if(!previousPrice) {
                previousPrice = price;
            }else if(previousPrice > price){
                falls++;
            }else{
                raises++;
            }
        });
        return {
            falls:falls,
            raises:raises,
            total:collection.length
        }
    },
    predictOnTrend() {
        let trend = this.checkTrend();
        //console.log(trend);
        let found = false;
        let predictionType = '';
        let proposal = '';
        let raiseDif = trend.counts.raises/trend.counts.total;
        let fallDif = trend.counts.falls/trend.counts.total;
        console.log('raiseDif',raiseDif);
        console.log('fallDif',fallDif);
        console.log('trend.shortTermDifference',trend.shortTermDifference);
        if (trend.shortTermTrend == 'raise' && trend.shortTermDifference >= 0.8) {
            proposal = 'CALL';
            predictionType = 'TREND';
            found = true;
        } else if (trend.shortTermTrend == 'fall' && trend.shortTermDifference >= 0.8) {
            proposal = 'PUT';
            predictionType = 'TREND';
            found = true;
        }
        this.getPriceProposal(proposal);
        View.updatePredictionType(trend.isShorter ? predictionType + ':SHORT' : predictionType);
        this.predictionType = predictionType;
        return found;
    },
    HighLowPrediction() {
        let trend = this.checkTrend();
        let found = false;
        //console.log(trend);
        if (this.isProposal || !this.highestPrice) return;
        let lastPrice = this.history[this.history.length - 2];
        if (trend.longTermTrend == 'raise' && this.currentPrice / this.highestPrice >= 0.999) {
            this.getPriceProposal('PUT');
            this.predictionType = 'BARRIER';
            View.updatePredictionType('BARRIER');
            found = true;
        } else if (trend.longTermTrend == 'fall' && this.lowestPrice / this.currentPrice >= 0.999) {
            this.getPriceProposal('CALL');
            this.predictionType = 'TREND';
            View.updatePredictionType('BARRIER');
            found = true;
        }
        return found;
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

        this.getHighestLowestPrice();
    }

}.init();
