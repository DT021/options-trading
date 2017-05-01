let View = {
    previousPrediction: 'put',
    profitClass: 'call',
    _predictionPrice: 0,
    _zeros: 1,
    tableTemplate: '<div class="well"><h4>{{title}}</h4><table id="{{id}}" class="table table-striped table-hover "><thead><tr><th>Key</th> <th>Value</th> </tr> </thead><tbody> </tbody></table></div>',
    init() {
        this.winElement = document.querySelector('#wins');
        this.loseElement = document.querySelector('#loses');
        this.balanceElement = document.querySelector('#balance');
        this.profitElement = document.querySelector('#profit');
        this.predictionElement = document.querySelector('#prediction');
        this.endedElement = document.querySelector('#ended');
        this.predictionArrow = document.querySelector('#prediction-arrow');
        this.highestPrice = document.querySelector('#highestPrice');
        this.lowestPrice = document.querySelector('#lowestPrice');
        this.stake = document.querySelector('#stake');
        this.purchasePrice = document.querySelector('#purchasePrice');
        this.pricePosition = document.querySelector('#pricePosition');
        this.assetName = document.querySelector('#assetName');
        this.assetSelector = document.querySelector('#assetSelector');
        this.currentPrice = document.querySelector('#currentPrice');
        this.currentPriceArrow = document.querySelector('#currentPriceArrow');
        this.startTime = document.querySelector('#startTime');
        this.endTime = document.querySelector('#endTime');
        this.lossLimit = document.querySelector('#lossLimit');
        this.profitLimit = document.querySelector('#profitLimit');
        this.payout = document.querySelector('#payout');
        this.lowestProfit = document.querySelector('#lowestProfit');
        this.highestProfit = document.querySelector('#highestProfit');
        this.possiblePayout = document.querySelector('#possiblePayout');
        this.predictionType = document.querySelector('#predictionType');
        this.isMartingale = document.querySelector('#isMartingale');
        this.startButton = document.querySelector('#startButton');
        this.stopButton = document.querySelector('#stopButton');
        this.raiseButton = document.querySelector('#raiseButton');
        this.fallButton = document.querySelector('#fallButton');
        this.logBody = document.querySelector('#log-panel');
        this.maxLossStreak = document.querySelector('#maxLossStreak');
        this.takingABreak = document.querySelector('#takingABreak');
        this.isVolatile = document.querySelector('#isVolatile');
        this.addListeners();
        this.startTime.textContent = this.formatDate(new Date());
    },
    addListeners() {
        this.startButton.addEventListener('click', this.onStartClicked.bind(this));
        this.stopButton.addEventListener('click', this.onStopClicked.bind(this));
        this.raiseButton.addEventListener('click', this.onRaiseClicked.bind(this));
        this.fallButton.addEventListener('click', this.onFallClicked.bind(this));
    },
    onFallClicked() {
        App.EventBus.dispatch(App.EVENT.PROPOSE_FALL);
    },
    onRaiseClicked() {
        App.EventBus.dispatch(App.EVENT.PROPOSE_RAISE);
    },
    activeButton() {
        this.stopButton.removeAttribute('disabled');
        this.raiseButton.removeAttribute('disabled');
        this.fallButton.removeAttribute('disabled');
    },
    onStopClicked() {
        App.EventBus.dispatch(App.EVENT.STOP_TRADING);
        this.stopButton.setAttribute('disabled', '');
        this.startButton.removeAttribute('disabled');
    },
    onStartClicked() {
        App.EventBus.dispatch(App.EVENT.START_TRADING);
        this.stopButton.removeAttribute('disabled');
        this.startButton.setAttribute('disabled', '');
        
    },
    updateCounts(wins, loses, loseStreak) {
        this.winElement.textContent = wins;
        this.loseElement.textContent = loses;
        this.maxLossStreak.textContent = loseStreak;
    },
    setBreak(value) {
        this.takingABreak.textContent = value;
        if (value) {
            this.takingABreak.parentNode.parentNode.classList.add('danger');
        } else {
            this.takingABreak.parentNode.parentNode.classList.remove('danger');
        }
    },
    ended(bool) {
        this.endedElement.textContent = bool;
        if (bool) {
            this.endedElement.parentNode.classList.add('danger');
            this.endTime.textContent = this.formatDate(new Date());
        } else {
            this.endedElement.parentNode.classList.remove('danger');
            this.endTime.textContent = '';
        }
    },
    updateBalance(balance, profit) {
        this.balanceElement.textContent = balance;
        this.profitElement.textContent = (profit * this._zeros).toFixed(2);
        this.profitElement.parentNode.parentNode.classList.remove(this.profitClass);
        this.profitElement.parentNode.classList.add(profit >= 0 ? 'success' : 'danger');
        this.profitElement.parentNode.classList.remove(profit >= 0 ? 'danger' : 'success');
        //this.balanceElement.parentNode.classList.add(balance >= 0 ? 'success' : 'danger');
    },
    updateHighLow(lowest, highest, current) {
        this.highestPrice.textContent = highest;
        this.lowestPrice.textContent = lowest;
        this.currentPrice.textContent = current;
        if (this._predictionPrice) this.updateArrow(this.currentPriceArrow, this._predictionPrice > current ? 'down' : 'up');
    },
    updateStake(stake, lossLimit, profitLimit) {
        this.stake.textContent = stake * this._zeros;
        this.lossLimit.textContent = (lossLimit * this._zeros).toFixed(2);
        this.profitLimit.textContent = (profitLimit * this._zeros).toFixed(2);
    },
    updateProfit(lowestProfit, highestProfit) {
        this.highestProfit.textContent = (highestProfit * this._zeros).toFixed(2);
        this.lowestProfit.textContent = (lowestProfit * this._zeros).toFixed(2);
    },
    updateAsset(assetName, collection, payout) {
        this.assetName.textContent = assetName;
        this.payout.textContent = payout;
        collection.forEach(function(item, index) {
            let option = document.createElement('OPTION');
            option.value = item[0];
            option.textContent = item[1];
            this.assetSelector.appendChild(option);
            if (item[0] == assetName) this.assetSelector.selectedIndex = index;
        }.bind(this));
    },
    updatePredictionType(type) {
        this.predictionType.textContent = type;
    },
    updateMartingale(val) {
        this.isMartingale.textContent = val;
    },
    updatePrediction(prediction, startPosition, price) {
        if (prediction) {
            this._predictionPrice = price;
            this.purchasePrice.textContent = price;
            this.pricePosition.textContent = startPosition;
            this.predictionElement.textContent = prediction + (prediction ? '(' + (prediction == 'PUT' ? 'FALL' : 'RAISE') + ')' : '');
            this.predictionElement.parentNode.parentNode.classList.remove(this.previousPrediction);
            this.predictionElement.parentNode.classList.add('success');
            this.previousPrediction = prediction.toLowerCase();
            let arrowClass = '';
            this.updateArrow(this.predictionArrow, prediction == 'PUT' ? 'down' : 'up');
        } else {
            this._predictionPrice = null;
            this.purchasePrice.textContent = '';
            this.pricePosition.textContent = '';
            this.predictionType.textContent = '';
            this.predictionElement.parentNode.classList.remove('success');
            this.predictionElement.parentNode.classList.remove('danger');
            this.predictionElement.textContent = '';
            this.updateArrow(this.currentPriceArrow, '');
            this.updateArrow(this.predictionArrow, '');
        }
    },
    updateStartPosition(val) {
        this.pricePosition.textContent = val;
    },
    updateArrow(element, direction) {
        if (direction == 'down') {
            element.classList.add('glyphicon-arrow-down');
            element.classList.remove('glyphicon-arrow-up');
        } else if (direction == 'up') {
            element.classList.add('glyphicon-arrow-up');
            element.classList.remove('glyphicon-arrow-down');
        } else {
            element.classList.remove('glyphicon-arrow-up');
            element.classList.remove('glyphicon-arrow-down');
        }
    },
    updateLog(log) {
        this.logBody.innerHTML = '';
        let template = '';

        for (key in log) {
            let type = key.replace(':', '_');
            template = this.tableTemplate.replace('{{title}}', key);
            template = template.replace('{{id}}', 'log-' + type);
            this.logBody.innerHTML += template;
            this.setLogTableData(log[key], 'log-' + type);
        }

    },
    updateVolatile(value,change) {
        this.isVolatile.innerHTML = value + (change ? ' ('+change+')':'');
        if (value) {
            this.isVolatile.parentNode.classList.remove('success');
            this.isVolatile.parentNode.classList.add('danger');
        } else {
            this.isVolatile.parentNode.classList.add('success');
            this.isVolatile.parentNode.classList.remove('danger');
        }
    },
    setLogTableData(item, id) {
        setTimeout(function() {
            let tbody = document.querySelector('#' + id + ' tbody');
            if (!tbody) return
            for (key in item) {
                let tr = document.createElement('tr');
                let td = document.createElement('td');
                let tdValue = document.createElement('td');
                td.innerHTML = key;
                tdValue.innerHTML = item[key];

                tr.appendChild(td);
                tr.appendChild(tdValue);
                tbody.appendChild(tr);
            }
        }.bind(this), 50);

    },
    formatDate(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
    }
};
