const ChannelPrediction = {
    highest: 0,
    lowest: 0,
    predict(history) {
      if (!Main.chanelPrediction||this.isProposal || this.pauseTrading) return;
        let index = history.length - 1;
        let collection = history.splice(index - 10, index);
        this.findLowestHighest(collection);
        let direction = this.checkChannelDirection(collection);
        if (direction) {
            let type = direction == 'RAISE' ? 'CALL' : 'PUT';
            Main.setPrediction(type, 'CHANNEL');
            ChartComponent.updatePredictionChart(collection, this.lowest, this.highest);
            Main.currentTrendItem = {
                predictionType: 'CHANNEL',
                type: type
            };
            return true;
        }
    },
    findLowestHighest(collection) {
        this.lowest = collection[0];
        this.highest = collection[0];
        collection.forEach((price) => {
            if (price < this.lowest) this.lowest = price;
            if (price > this.highest) this.highest = price;
        });
    },
    checkChannelDirection(collection) {
        let obj = this.getTopAndBottomCollections(collection);
        return obj.bottomDirection == obj.topDirection  && obj.bottomDirection.length > 3 ? obj.bottomDirection : '';
    },
    getTopAndBottomCollections(collection) {
        let bottomCollection = [];
        let topCollection = [];
        let previousPrice = collection[0];
        let bottomDirection = '';
        let topDirection = '';
        // find top and bottom prices
        collection.forEach(function(price, index) {
            if (index > 1) {
                if (price > previousPrice && previousPrice < collection[index - 2]) bottomCollection.push(previousPrice);
                if (price < previousPrice && previousPrice > collection[index - 2]) topCollection.push(previousPrice);
            }
            previousPrice = price;
        }.bind(this));

        //check bottom direction
        previousPrice = bottomCollection[0];
        bottomCollection.forEach(function(price, index) {
            if (index > 1) {
                if (price < previousPrice && bottomDirection == 'RAISE') bottomDirection = '';
                if (price > previousPrice && bottomDirection == 'FALL') bottomDirection = '';
            } else if (index) {
                if (price > previousPrice) bottomDirection = 'RAISE';
                if (price < previousPrice) bottomDirection = 'FALL';
            }
        }.bind(this));

        previousPrice = topCollection[0];
        topCollection.forEach(function(price, index) {
            if (index > 1) {
                if (price < previousPrice && topDirection == 'RAISE') topDirection = '';
                if (price > previousPrice && topDirection == 'FALL') topDirection = '';
            } else if (index) {
                if (price > previousPrice) topDirection = 'RAISE';
                if (price < previousPrice) topDirection = 'FALL';
            }
        }.bind(this));

        return {
            bottomCollection: bottomCollection,
            bottomDirection: bottomDirection,
            topDirection: topDirection,
            topCollection: topCollection
        }
    }
};
