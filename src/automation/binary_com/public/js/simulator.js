const Simulator = {
    ASSET_NAME: 'R_100',
    tickDuration: 6,
    pauseTrading: false,
    isProposal: false,
    purchasePrice: 0,
    contractCount: 0,
    contractType: '',
    numberOfWins: 0,
    numberOfLoses: 0,
    loseStreak: 0,
    started: false,
    chanelPrediction: true,
    trendingUpPrediction: true,
    trendPrediction: true,
    predictionModels: {
        TrendPrediction: TrendPrediction,
        TrendUpPrediction: TrendUpPrediction,
        ChannelPrediction: ChannelPrediction,
        BullishPrediction: BullishPrediction,
        TrendCombined: null
    },
    loseStreaks: {},
    history: [],
    init() {
        document.addEventListener('DOMContentLoaded', this.onLoaded.bind(this));
        this.predictionModels.TrendCombined = this.trendPredictionCombined;
    },
    addListener() {


        // this.ws.onopen = this.onOpen.bind(this);
        // this.ws.onclose = this.onClose.bind(this);
        // this.ws.onmessage = this.onMessage.bind(this);

        ChartComponent.create();
        View.init();
        View.updateStake(this.currentStake, this.lossLimit, this.profitLimit);
         this.simulate();
    },
    onLoaded() {
        //   this.simulate();
        //this.ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=' + Config.appID);
        this.addListener();
    },
    onClose(event) {
        this.authorize();
    },
    onOpen(event) {
        //USGOOG
        //frxEURGBP
        this.authorize();

    },
    authorize() {
        this.ws.send(JSON.stringify({ "authorize": Config.apiKey }));
    },
    getHistory(end) {
        this.ws.send(JSON.stringify({
            "ticks_history": this.ASSET_NAME,
            "end": end ? end : "latest",
            "count": 5000
        }));
    },
    getTicks() {
        this.ws.send(JSON.stringify({ ticks: this.ASSET_NAME }));
    },
    onMessage(event) {
        var data = JSON.parse(event.data);
        // console.log(data);
        switch (data.msg_type) {
            case 'authorize':
                //this.getHistory();
               // this.getTicks();
                break;

            case 'history':
                if (data.history.prices.length < 5000) {
                    this.getHistory();
                } else {
                    if (!this.started) {
                        this.started = true;
                        this.history = data.history.prices.splice(0, data.history.prices.length);
                        console.log('history', this.history.length);
                       
                    }
                }

                break;
        }
    },
    simulate() {
        for (let key in this.predictionModels) {
            History.forEach((historyCollection) => {
                let volatileCount = 0;
                historyCollection.forEach((price, index) => {
                  let collection = historyCollection.slice(0, index + 1);
                    volatileCount++;
                    if (volatileCount >= 5) {
                        Volatility.end(collection);
                        volatileCount = 0;
                    } else {
                        Volatility.check(price, true);
                    }
                    if (!this.pauseTrading && !this.isProposal) {
                        
                        this.predictionModels[key].predict(collection);
                    } else if (this.isProposal) {
                        this.checkPurchase(price);
                    }
                });
            });
            console.log('DONE ', key);
            console.log('wins', this.numberOfWins);
            console.log('loses', this.numberOfLoses);
            console.log('lose streak', this.loseStreaks);
            this.numberOfWins = 0;
            this.numberOfLoses = 0;
            this.pauseTrading = false;
            this.isProposal = false;
            this.loseStreaks = {};
        }





    },
    trendPredictionCombined: {
        predict(collection) {
            TrendUpPrediction.predict(collection);
            TrendPrediction.predict(collection);
        }

    },
    checkPurchase(price) {
        if (!this.purchasePrice) {
            this.purchasePrice = price;
        }
        if (this.contractCount >= 6) {

            this.endContract(price);
        }
        this.contractCount++;
    },
    setPrediction(type) {
        this.isProposal = true;
        this.contractType = type;
    },
    endContract(price) {
        let isWin = false;
        if (this.contractType == 'CALL' && price > this.purchasePrice || this.contractType == 'PUT' && price < this.purchasePrice) {
            isWin = true;
            this.numberOfWins++;
            this.loseStreak = 0;
        } else {
            this.loseStreak++;
            isWin = false;
            this.numberOfLoses++;
            if (this.loseStreaks[this.loseStreak] == undefined) this.loseStreaks[this.loseStreak] = 0;
            this.loseStreaks[this.loseStreak]++;
        }
        this.contractCount = 0;
        this.purchasePrice = 0;
        this.isProposal = null;
    },
}
const Main = Simulator;
Simulator.init();
