const TrendUpPrediction = {
    trendUpDuration: 100,
    trendUpLongDuration: 30,
    trendingUpBarrier: 50,
    predict(ticks) {
         if ( Main.isProposal || Main.pauseTrading) return;
        let collection = ticks.slice(ticks.length - this.trendUpDuration, ticks.length);
        let highestPosition = collection[0];
        let lowestPosition = collection[0];
        let found = false;
        let proposal = '';
        let predictionType = '';
        let diff = Math.abs(ticks[ticks.length - 1] - collection[0]);
        collection.forEach(function(price, index) {
            price = Number(price)
            if (price > highestPosition) highestPosition = price;
            if (price < lowestPosition) lowestPosition = price;
        }.bind(this));
        if (diff >= this.trendingUpBarrier && ticks[ticks.length - 1] >= highestPosition && this.checkIsDirection(ticks, 'RAISE', 1, 5)) {
            proposal = 'CALL';
            predictionType = 'TRENDING_UP';
            found = true;
        } else if (diff >= this.trendingUpBarrier && ticks[ticks.length - 1] <= lowestPosition && this.checkIsDirection(ticks, 'FALL', 1, 5)) {
            proposal = 'PUT';
            predictionType = 'TRENDING_DOWN';
            found = true;
        }

        if (found) {
            // console.log('checkIsTrendingUp',collection[0],collection[collection.length-1]);
            Main.currentTrendItem = {
                predictionType: predictionType,
                type: proposal
            };
            ChartComponent.updatePredictionChart(collection, lowestPosition, highestPosition);
            Main.setPrediction(proposal, predictionType);
        }

        return found;
    },
    getHighLow(collection) {
        let highest = collection[0];
        let lowest = collection[0];
        collection.forEach(function(price) {
            price = Number(price)
            if (price < lowest) lowest = price;
            if (price > highest) highest = price;
        });
        return {
            highest: highest,
            lowest: lowest
        }
    },
    checkIsDirection(ticks, direction, index, fullIndex, barrier) {
        if (barrier == undefined) barrier = 1;
        let collection = ticks.slice((ticks.length - 1) - (index + 1), ticks.length);
        let previousPrice = collection[0];
        let isDirection = true;
        collection.forEach(function(price, index) {
            price = Number(price)
            if (index > 0) {
                if (direction == 'FALL' && price + barrier >= previousPrice) isDirection = false;
                if (direction == 'RAISE' && price - barrier <= previousPrice) isDirection = false;
            }
            previousPrice = price;
        });

        let highLow = this.getHighLow(ticks.slice(ticks.length - fullIndex, ticks.length));
        if (fullIndex) {
            if (direction == 'FALL' && highLow.lowest < this.currentPrice - 2 || direction == 'RAISE' && highLow.highest > this.currentPrice + 2) {
                isDirection = false;
            }
        }


        return isDirection;
    }
}
