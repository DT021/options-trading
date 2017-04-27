const Main = {
    isVirtual: true,
    ws: null,
    history: [],
    winCount: 0,
    lossCount: 0,
    balance: 100,
    startBalance: 0,
    accountBalance: 0,
    payout: 0.942,
    stake: 1,
    currentStake: 1,
    lossStreak: 0,
    started: false,
    currentTick: 0,
    stakeTicks: 6,
    currentContract: null,
    ended: false,
    startMartingale: false,
    currentPrice: 0,
    localWS: null,
    highestPrice: null,
    lowestPrice: null,
    lossLimit: -200,
    lossLimitDefault: 0,
    profitLimit: 5,
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
    lossStreak: 0,
    shortLossStreak: 0,
    isShort: false,
    pauseTimer: null,
    isTrading: false,
    trendSuccess: [],
    trendFail: [],
    trendSucessPercentage: 0.89,
    pauseTrading: false,
    currentTrendItem: {},
    ticksAverageCollection: [],
    volatileTimer: null,
    log: {

    },
    init() {
        document.addEventListener('DOMContentLoaded', this.onLoaded.bind(this));
        this.setDefaults();
    },
    setDefaults() {
        this.lossLimitDefault = this.lossLimit;
    },
    addListener() {
        App.EventBus.addEventListener(App.EVENT.START_TRADING, this.onStartTrading.bind(this));
        App.EventBus.addEventListener(App.EVENT.STOP_TRADING, this.onStopTrading.bind(this));

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
    reset() {
        this.lossLimit = this.lossLimitDefault;
        this.highestProfit = 0;
        this.lowestProfit = 0;
        this.lossCount = 0;
        this.lossStreak = 0;
        this.isShorter = false;
        this.shortLossStreak = 0;
        this.startMartingale = false;
        this.winCount = 0;
        this.currentStake = this.stake;
        this.prediction = '';
        this.startBalance = this.accountBalance;
        this.profit = 0;
        View.updateMartingale(this.startMartingale);
        View.updatePrediction('');
        View.updateCounts(this.winCount, this.lossCount);
        View.updateProfit(this.lowestProfit, this.highestProfit);
        View.updateBalance(this.accountBalance, this.profit);
        View.updatePredictionType('');
        View.ended(false);
    },
    end() {
        clearTimeout(this.volatileTimer);
        View.ended(true);
        this.ws.send(JSON.stringify({
            "forget_all": "ticks"
        }));
        this.ws.send(JSON.stringify({
            "forget_all": "balance"
        }));
        this.ws.send(JSON.stringify({
            "forget_all": "transaction"
        }));
        return;
        emailjs.send("mailgun", "template_D3XUMSOA", {
            from_name: 'Travis',
            to_name: "Fahim",
            message_html: "Profit today was £" + this.profit.toFixed(2) + "<br> and the end time was " + this.getDateTimeString(),
            asset: this.ASSET_NAME,
            profit: this.profit.toFixed(2),
            balance: this.accountBalance,
            predictionModel: this.predictionType,
            lowest_profit: this.lowestProfit.toFixed(2),
            highest_profit: this.highestProfit.toFixed(2),
            wins: this.winCount,
            loses: this.lossCount,
            startTime: this.startTime,
            endTime: this.getDateTimeString()
        });
        location.reload();
    },
    getTranscations() {
        this.ws.send(JSON.stringify({
            "transaction": 1,
            "subscribe": 1
        }));

    },
    getHistory(count) {
        this.ws.send(JSON.stringify({
            "ticks_history": this.ASSET_NAME,
            "end": "latest",
            "count": count ? count : 5000
        }));
    },
    onStopTrading() {
        this.isTrading = false;
        this.end();
    },
    onStartTrading() {
        this.startTime = this.getDateTimeString();
        this.reset();
        this.isTrading = true;

    },
    getPriceProposal(type, duration) {
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
            "currency": this.isVirtual ? "USD" : 'GBP',
            "duration": duration ? duration : String(this.stakeTicks),
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
        // console.log(data);
        switch (data.msg_type) {
            case 'authorize':
                console.log(data);
                //this.addFunds();
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
                this.getTicks();
                this.getTranscations();
                break;
            case 'history':
                if (!this.history.length) {
                    this.history = data.history.prices;
                    this.historyTimes = data.history.times;
                    this.started = true;
                    View.activeButton();
                    this.onStartTrading();
                }
                break;
            case 'proposal':
                // console.log('proposal', data);
                if (!data.proposal) return;
                this.proposalID = data.proposal.id;
                this.payout = data.proposal.payout;
                View.updateAsset(this.ASSET_NAME, this.assetArray, this.payout);
                this.buyContract();
                break;
            case 'buy':
                //console.log('buy', data);
                break;
            case 'transaction':
                //console.log('transaction', data.transaction);
                let isLoss = false;
                if (data.transaction && data.transaction.action && data.transaction.action == 'sell') {

                    let profit = this.accountBalance - this.startBalance;

                    if (data.transaction.amount === '0.00') {
                        isLoss = true;
                        this.lossStreak++;
                        this.startMartingale = true;
                        this.lossCount++;
                        if (this.isShort) this.shortLossStreak++;
                        this.setFail();
                    } else {
                        this.lossStreak = 0;
                        this.startMartingale = false;
                        this.winCount++;
                        this.sendSuccessfulPrediction();
                        this.setSuccess();
                    }
                    if (profit <= this.lossLimit || this.accountBalance <= 0 || profit >=  this.profitLimit) {
                        this.end();
                    }
                    View.updateMartingale(this.startMartingale);
                    this.prediction = '';
                    this.predictionItem = null;
                    View.updatePrediction('');
                    ChartComponent.updatePredictionChart([]);
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
                    this.historyTimes.push(data.tick.epoch);
                    //console.log('ticks update: %o', data.tick.quote);
                    this.currentPrice = data.tick.quote;
                    this.checkVolatility();
                    this.setPositions();
                    this.setDirectionCollection();
                    this.addTickToContract();
                    if (this.isTrading) this.setPredictionData();
                    let collection = this.history.slice(this.history.length - 200, this.history.length - 1);
                    let highLow = this.getHighLow(collection);
                    ChartComponent.update({
                        price: this.currentPrice,
                        time: Date.now(),
                        lowestPrice: highLow.lowest
                    });


                }
                break;
        }

    },
    checkVolatility() {
        let collection = this.history.slice(this.history.length - 30, this.history.length);
        let timeCollection = this.historyTimes.slice(this.historyTimes.length - 30, this.historyTimes.length);
        var startD = new Date(0);
        var currentD = new Date(0);
        startD.setUTCSeconds(timeCollection[timeCollection.length - 1]);
        currentD.setUTCSeconds(timeCollection[0]);
        let dif = timeCollection[0] - timeCollection[timeCollection.length - 1];
        var seconds = (currentD.getUTCSeconds() - startD.getUTCSeconds()) / 1000;
        window.ticksAverage = this.ticksAverageCollection.push(dif);

        let fallCount = 0;
        let raiseCount = 0;
        let volCount = 0;
        let changeCount = 0;
        let previousPrice = collection[0];
        let direction = '';
        collection.forEach(function(price) {
            if (price > previousPrice) {
                raiseCount++;
                if (direction == 'FALL' && price - 2 > previousPrice) changeCount++;
                direction = 'RAISE';
            }
            if (price < previousPrice) {
                fallCount++;
                if (direction == 'RAISE' && price + 2 < previousPrice) changeCount++;
                direction = 'FALL';
            }
            if (price + 2 < previousPrice || price - 2 > previousPrice) volCount++;
            previousPrice = price;
        }.bind(this));
        let timeDifference = startD.getMinutes() - currentD.getMinutes();
        let countDiff = Math.abs(fallCount - raiseCount);
       console.log('checkVolatility', changeCount);
        if (changeCount > 10) {
              console.log('currently volatile');
            this.pauseTrading = true;
            View.updateVolatile(true);
        } else {
            this.pauseTrading = false;
            View.updateVolatile(false);
        }

    },
    setLossLimit() {
        let profit = this.accountBalance - this.startBalance;
        this.profit = profit;
        if (profit > this.highestProfit) this.highestProfit = profit;
        if (this.lowestProfit == null || profit < this.lowestProfit) this.lowestProfit = profit;
        if (profit / 30 > 0.95) {
            this.lossLimit = 29;
        } else if (profit / 20 >= 0.95) {
            this.lossLimit = 19;
        } else if (profit > 0 && this.highestProfit >= 10) {
            // this.lossLimit = 1;
        } else if (profit < -10 && this.highestProfit < 5 && (this.lossCount + this.winCount) > 30) {
            this.profitLimit = 1;
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
        return;
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
            let doubleStake = (this.currentStake * 2);
            this.currentStake = doubleStake + (doubleStake - (doubleStake * 0.942));
            //this.currentStake = this.stake + (this.stake - (this.stake * 0.942));
            if (this.profit - this.currentStake <= this.lossLimit) {
               // this.currentStake = this.stake;
            }
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
        if (this.isProposal || this.pauseTrading) return;
        if (this.predictionModel != 'pattern') {
            let found = false;
            found = this.predictionOnTrendSharp();
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
        if (this.isShort || this.lossStreak > 2) {
            if (!this.isShort) {
                this.isShort = true;
                this.shortLossStreak = 0;
            }
            let per = 0.3;
            if (this.shortLossStreak >= 2) {
                per = 0.2;
                this.isShort = false;
            }
            shortIndex = this.shortTrendLength * per;
            isShorter = true;
        } else {
            this.isShort = false;
        }

        let currentTrend = this.history[this.history.length - shortIndex];
        let change = 0;
        let diff = 0;
        if (currentTrend > this.currentPrice) {
            diff = (currentTrend - this.currentPrice);
        } else {
            diff = (this.currentPrice - currentTrend);
        }
        change = (diff / currentTrend) * (this.ASSET_NAME == 'R_100' ? 1000 : 10000);
        let collection = this.history.slice(this.history.length - shortIndex, this.history.length - 1);
        let highLow = this.getHighLow(collection);
        return {
            collection: collection,
            highest: highLow.highest,
            lowest: highLow.lowest,
            shortTermTrend: currentTrend <= this.currentPrice ? 'raise' : (currentTrend > this.currentPrice ? 'fall' : ''),
            shortTermDifference: change,
            longTermTrend: trendFirst <= this.currentPrice ? 'raise' : (trendFirst > this.currentPrice ? 'fall' : ''),
            isShorter: isShorter,
            shortIndex: shortIndex,
            counts: this.trendCount(this.history.slice(this.history.length - this.shortTrendLength, this.history.length - 1))
        };
    },
    getHighLow(collection) {
        let highest = collection[0];
        let lowest = collection[0];
        collection.forEach(function(price) {
            if (price < lowest) lowest = price;
            if (price > highest) highest = price;
        });
        return {
            highest: highest,
            lowest: lowest
        }
    },
    checkIsDirection(direction, index, fullIndex) {
        let collection = this.history.slice((this.history.length - 1) - (index + 1), this.history.length - 1);
        let previousPrice = collection[0];
        let isDirection = true;
        collection.forEach(function(price, index) {
            if (index > 0) {
                if (direction == 'FALL' && price + 1 >= previousPrice) isDirection = false;
                if (direction == 'RAISE' && price - 1 <= previousPrice) isDirection = false;
            }
            previousPrice = price;
        });

        let highLow = this.getHighLow(this.history.slice(this.history.length - fullIndex, this.history.length - 1));
        /*
        if (direction == 'FALL' && highLow.lowest < this.currentPrice - 2 || direction == 'RAISE' && highLow.highest > this.currentPrice + 2) {
          isDirection = false;
        }
        */
        return isDirection;
    },
    predictionOnTrendSharp() {
        let collection = this.history.slice(this.history.length - 5, this.history.length - 1);
        let highest = collection[0];
        let lowest = collection[0];
        let fallCount = 0;
        let raiseCount = 0;
        let found = false;
        let percentageLimit = 0.6;
        let total = collection.length;
        let previousPrice = collection[0];
        let predictionType = 'TREND_STRAIGHT';
        let type = 'CALL';
        let priceDiff = Math.abs(collection[0] - collection[collection.length - 1]);
        collection.forEach(function(price) {
            if (price < lowest) lowest = price;
            if (price > highest) highest = price;
            if (price < previousPrice) fallCount++;
            if (price > previousPrice) raiseCount++;
            previousPrice = price;
        });
        let lowPercentage = fallCount / total;
        let highPercentage = raiseCount / total;

        let direction = collection[0] > collection[collection.length - 1] ? 'FALL' : 'RAISE';
        if (direction == 'FALL' && collection[collection.length - 1] <= lowest && lowPercentage > percentageLimit && this.checkIsDirection('FALL', 2)) {
            type = 'PUT';
            this.setPrediction(type, predictionType);
            found = true
        }
        if (direction == 'RAISE' && collection[collection.length - 1] >= highest && highPercentage > percentageLimit && this.checkIsDirection('RAISE', 2)) {
            this.setPrediction(type, predictionType);
            found = true
        }
        if (found) {
            ChartComponent.updatePredictionChart(collection, lowest, highest);
            this.currentTrendItem = {
                predictionType: predictionType,
                type: type,
                lowPercentage: lowPercentage,
                highPercentage: highPercentage
            };
        }
        return found;
    },
    checkTrendIsReversing(collection) {

        let currentPrice = collection[collection.length - 1];


        collection.forEach(function(price) {

            if (price < lowest) lowest = price;
            if (price > highest) highest = price;

        });

        if (collection[0] > collection[collection.length] && collection[collection.length] <= lowest) return true;
        if (collection[0] < collection[collection.length] && collection[collection.length] >= highest) return true;
        return false;
    },
    trendCount(collection) {
        let falls = 0;
        let raises = 0;
        let previousPrice = 0;
        collection.forEach(function(price) {
            if (!previousPrice) {
                previousPrice = price;
            } else if (previousPrice > price) {
                falls++;
            } else if (previousPrice < price) {
                raises++;
            }
        });
        return {
            falls: falls,
            raises: raises,
            total: collection.length
        }
    },
    setFail() {
        let obj = Object.assign({}, this.currentTrendItem);
        this.trendFail.push(obj);
        this.trendAverage();

        let logItem = this.getLogItem(this.currentTrendItem.predictionType);
        logItem.loses++;
        View.updateLog(this.log);
    },
    setSuccess() {
        let obj = Object.assign({}, this.currentTrendItem);
        this.trendSuccess.push(obj);
        this.trendAverage();
        let logItem = this.getLogItem(this.currentTrendItem.predictionType);
        logItem.wins++;
        View.updateLog(this.log);
    },
    getLogItem(type) {
        type = type.replace(':', '_');
        if (!this.log[type]) {
            this.log[type] = {
                wins: 0,
                loses: 0,
            }
        }
        return this.log[type];
    },
    trendAverage() {
        let total = 0;
        this.trendSuccess.forEach(function(item) {
            total += item.type == 'raise' ? item.raiseDif : item.fallDif;
        });
        let average = total / this.trendSuccess.length;
        //console.log('average success',average);

        total = 0;
        this.trendFail.forEach(function(item) {
            total += item.type == 'raise' ? item.raiseDif : item.fallDif;
        });
        average = total / this.trendFail.length;
        //console.log('average fail',average);
    },
    setPrediction(proposal, predictionType, duration) {
        this.getPriceProposal(proposal, duration);
        View.updatePredictionType(predictionType);
        this.predictionType = predictionType;
    },
    predictOnTrend() {

        let trend = this.checkTrend();
        //console.log(trend);
        let found = false;
        let predictionType = '';
        let proposal = '';
        let raiseDif = trend.counts.raises / trend.counts.total;
        let fallDif = trend.counts.falls / trend.counts.total;
        let priceDifference = Math.abs(this.history[this.history.length - 3] - this.history[this.history.length - 1]);
        let priceDifLimit = 0;
        //let ratio = 0.89;
        if (trend.shortTermTrend == 'raise' && raiseDif >= this.trendSucessPercentage && this.checkIsDirection('RAISE', 1)) {
            proposal = 'CALL';
            predictionType = 'TREND';
            found = true;
            this.currentTrendItem = {
                predictionType: trend.isShorter ? predictionType + '_SHORT' : predictionType,
                type: proposal,
                raiseDif: raiseDif,
                fallDif: fallDif,
                total: trend.counts.total,
                priceDiff: priceDifference
            };
            ChartComponent.updatePredictionChart(trend.collection);
        } else if (trend.shortTermTrend == 'fall' && fallDif >= this.trendSucessPercentage && this.checkIsDirection('FALL', 1)) {
            proposal = 'PUT';
            predictionType = 'TREND';
            found = true;
            this.currentTrendItem = {
                predictionType: trend.isShorter ? predictionType + '_SHORT' : predictionType,
                type: proposal,
                raiseDif: raiseDif,
                fallDif: fallDif,
                total: trend.counts.total,
                lastFive: this.trendCount(this.history.slice(this.history.length - 5, this.history.length - 1)),
                priceDiff: priceDifference
            };
            ChartComponent.updatePredictionChart(trend.collection, trend.lowest, trend.highest);
        }
        /*
        let ratio = 0.8;
        if (this.isShort) ratio = 0;
        console.log('shortTermDifference',trend.shortTermDifference);
        if (trend.counts.raises - 5 >  trend.counts.falls) {
            proposal = 'CALL';
            predictionType = 'TREND';
            found = true;
        } else if (trend.counts.falls - 5 >  trend.counts.raises) {
            proposal = 'PUT';
            predictionType = 'TREND';
            found = true;
        }
        */
        this.setPrediction(proposal, trend.isShorter ? predictionType + '_SHORT' : predictionType);
        return found;
    },
    HighLowPrediction() {
        let trend = this.checkTrend();
        let found = false;
        //console.log(trend);
        if (this.isProposal || !this.highestPrice) return;
        let lastPrice = this.history[this.history.length - 2];
        if (trend.longTermTrend == 'raise' && this.currentPrice / this.highestPrice >= 0.998) {
            this.getPriceProposal('PUT');
            this.predictionType = 'BARRIER';
            View.updatePredictionType('BARRIER');
            found = true;
        } else if (trend.longTermTrend == 'fall' && this.lowestPrice / this.currentPrice >= 0.998) {
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

}
Main.init();
