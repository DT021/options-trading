let View = {
    previousPrediction: 'put',
    profitClass: 'call',
    _predictionPrice: 0,
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
    },
    updateCounts(wins, loses) {
        this.winElement.textContent = wins;
        this.loseElement.textContent = loses;
    },
    ended() {
        this.endedElement.textContent = 'true';
        this.endedElement.parentNode.classList.add('danger');
        this.endTime.textContent = this.formatDate(new Date());
    },
    updateBalance(balance, profit) {
        this.balanceElement.textContent = balance;
        this.profitElement.textContent = profit.toFixed(2);
        this.profitElement.parentNode.parentNode.classList.remove(this.profitClass);
        this.profitElement.parentNode.classList.add(profit >= 0 ? 'success' : 'danger');
        this.profitElement.parentNode.classList.remove(profit >= 0 ? 'danger' : 'success');
        //this.balanceElement.parentNode.classList.add(balance >= 0 ? 'success' : 'danger');
        if (!this.startTime.textContent) this.startTime.textContent = this.formatDate(new Date());
    },
    updateHighLow(lowest, highest, current) {
        this.highestPrice.textContent = highest;
        this.lowestPrice.textContent = lowest;
        this.currentPrice.textContent = current;
        if (this._predictionPrice) this.updateArrow(this.currentPriceArrow, this._predictionPrice > current ? 'down' : 'up');
    },
    updateStake(stake, lossLimit, profitLimit) {
        this.stake.textContent = stake;
        this.lossLimit.textContent = lossLimit;
        this.profitLimit.textContent = profitLimit;
    },
    updateProfit(lowestProfit, highestProfit) {
        this.highestProfit.textContent = highestProfit.toFixed(2);
        this.lowestProfit.textContent = lowestProfit.toFixed(2);
    },
    updateAsset(assetName, collection, payout) {
        this.assetName.textContent = assetName;
        this.payout.textContent = payout;
        this.possiblePayout.textContent = Number(this.stake.textContent) * Number(payout);
        //console.log(collection);
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
