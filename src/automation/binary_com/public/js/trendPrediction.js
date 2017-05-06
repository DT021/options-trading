const TrendPrediction = {
  trendLength:4000,
  shortTrendLength:10,
  currentPrice:0,
  isShort:false,
  trendSucessPercentage:0.6,
    
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
            previousPrice=price;
        });
        let obj = {
            falls: falls,
            raises: raises,
            total: collection.length
        }
        return obj;
    },
    checkTrend(collection) {
      let index  = collection.length - this.trendLength >=0 ? collection.length - this.trendLength : 0;
        let trendFirst = collection[index];
        let shortIndex = this.shortTrendLength;
        let isShorter = false;
        if (Main.lossStreak < 5 &&  Main.lossStreak > 2 || this.isShort) {
            shortIndex = this.shortTrendLength - 5;
            isShorter = true;
        } else {
            this.isShort = false;
        }

        let currentTrend = collection[collection.length - shortIndex];
        let change = 0;
        let diff = 0;
        if (currentTrend > this.currentPrice) {
            diff = (currentTrend - this.currentPrice);
        } else {
            diff = (this.currentPrice - currentTrend);
        }
        change = (diff / currentTrend) * (Main.ASSET_NAME == 'R_100' ? 1000 : 10000);
        let _collection = collection.slice(collection.length - shortIndex, collection.length);
        let highLow = Util.getHighLow(_collection);
        return {
            collection: _collection,
            highest: highLow.highest,
            lowest: highLow.lowest,
            shortTermTrend: currentTrend <= this.currentPrice ? 'raise' : (currentTrend > this.currentPrice ? 'fall' : ''),
            isShorter: isShorter,
            counts: this.trendCount(collection.slice(collection.length - this.shortTrendLength, collection.length))
        };
    },
    checkIsDirection(ticks,direction, index, fullIndex, barrier) {
        if (barrier == undefined) barrier = 1;
        let collection = ticks.slice((ticks.length - 1) - (index + 1), ticks.length);
        let previousPrice = collection[0];
        let isDirection = true;
        collection.forEach(function(price, index) {
            if (index > 0) {
                if (direction == 'FALL' && price + barrier >= previousPrice) isDirection = false;
                if (direction == 'RAISE' && price - barrier <= previousPrice) isDirection = false;
            }
            previousPrice = price;
        });

        let highLow = Util.getHighLow(ticks.slice(ticks.length - fullIndex, ticks.length));
        if (fullIndex) {
            if (direction == 'FALL' && highLow.lowest < this.currentPrice - 2 || direction == 'RAISE' && highLow.highest > this.currentPrice + 2) {
                isDirection = false;
            }
        }


        return isDirection;
    },
    predict(collection) {
       if ( Main.isProposal || Main.pauseTrading) return;
        this.currentPrice = collection[collection.length-1];
        let trend = this.checkTrend(collection);
        //console.log(trend);
        let found = false;
        let predictionType = '';
        let proposal = '';
        let raiseDif = trend.counts.raises / trend.counts.total;
        let fallDif = trend.counts.falls / trend.counts.total;
        let priceDifference = Math.abs(collection[collection.length - 3] - collection[collection.length - 1]);
        let priceDifLimit = 0;
        //let ratio = 0.89;
        //console.log(raiseDif,fallDif);
        if (trend.shortTermTrend == 'raise' && raiseDif >= this.trendSucessPercentage && this.checkIsDirection(collection,'RAISE', 1, 5)) {
            proposal = 'CALL';
            predictionType = 'TREND_UP';
            found = true;
            Main.currentTrendItem = {
                predictionType: trend.isShorter ? predictionType + '_SHORT' : predictionType,
                type: proposal,
            };
            ChartComponent.updatePredictionChart(trend.collection, trend.lowest, trend.highest);
        } else if (trend.shortTermTrend == 'fall' && fallDif >= this.trendSucessPercentage && this.checkIsDirection(collection,'FALL', 1, 5)) {
            proposal = 'PUT';
            predictionType = 'TREND_DOWN';
            found = true;
            Main.currentTrendItem = {
                predictionType: trend.isShorter ? predictionType + '_SHORT' : predictionType,
                type: proposal
            };
            ChartComponent.updatePredictionChart(trend.collection, trend.lowest, trend.highest);
        }
        if(found)Main.setPrediction(proposal, trend.isShorter ? predictionType + '_SHORT' : predictionType);
        return found;
    },
};
