const ChannelPrediction = {
    highest: 0,
    lowest: 0,
    collectionCount: 6,
    predict(history) {
        if (!Main.chanelPrediction || Main.isProposal || Main.pauseTrading) return;
        let index = history.length;
        let collection = history.slice(index - this.collectionCount, index);
        this.findLowestHighest(collection);
        let direction = this.checkChannelDirection(collection);
        if (direction) {
            let type = direction == 'RAISE' ? 'CALL' : 'PUT';
            Main.setPrediction(type, 'CHANNEL_' + direction);
            ChartComponent.updatePredictionChart(collection, this.lowest, this.highest);
            Main.currentTrendItem = {
                predictionType: 'CHANNEL_' + direction,
                type: type
            };
            return true;
        }
    },
    standardDeviation(values) {
        var avg = this.average(values);

        var squareDiffs = values.map(function(value) {
            var diff = value - avg;
            var sqrDiff = diff * diff;
            return sqrDiff;
        }.bind(this));

        var avgSquareDiff = this.average(squareDiffs);

        var stdDev = Math.sqrt(avgSquareDiff);
        return stdDev;
    },

    average(data) {
        let sum = 0;
        data.forEach(function(value) {
            //console.log(value)
            sum += Number(value);
        });

        var avg = sum / data.length;
        //console.log(avg);
        return avg;
    },
    volatilityCheck(collection) {
        if (!collection.length) return;
        console.log('volatilityCheck', this.standardDeviation(collection));
    },
    findLowestHighest(collection) {
        this.lowest = collection[0];
        this.highest = collection[0];
        collection.forEach((price) => {
            price = Number(price);
            if (price < this.lowest) this.lowest = price;
            if (price > this.highest) this.highest = price;
        });
    },
    checkChannelDirection(collection) {
        let bottoms = [];
        let previous = collection[0];
        let direction = collection[0] > collection[1] ? 'FALL' : 'RAISE';
        collection.forEach((price, index) => {
            if (index > 1 && previous < price && previous > collection[index - 2]) {
                bottoms.push(previous);
            }
            previous = price;
        });
        if(bottoms.length < 2)return;
        let foundRaise = true;
        let foundFall = true;
        previous = bottoms[0];
        direction = bottoms[0] > bottoms[1] ? 'FALL' : 'RAISE';
        bottoms.forEach((price, index) => {
            if (index > 1) {
                if (index && price < previous && direction == 'RAISE') foundRaise = false;
                if (index && price > previous && direction == 'FALL') foundFall = false;
            }

            previous = price;
        });
        return foundRaise ? 'RAISE' : (foundFall ? 'FALL' : '');
    },
    getTopAndBottomCollections(collection) {
        let bottomCollection = [];
        let topCollection = [];
        let previousPrice = collection[0];
        let bottomDirection = '';
        let topDirection = '';
        // find top and bottom prices
        collection.forEach(function(price, index) {
            collection[index] = Number(price);
            price = Number(price);
            if (index > 1) {
                if (price > previousPrice && previousPrice < collection[index - 2]) bottomCollection.push(previousPrice);
                if (price < previousPrice && previousPrice > collection[index - 2]) topCollection.push(previousPrice);
            }
            previousPrice = price;
        }.bind(this));
        //check bottom direction
        previousPrice = bottomCollection[0];
        bottomCollection.forEach(function(price, index) {
            price = Number(price);
            if (index > 1) {
                if (price + 1 < previousPrice && bottomDirection == 'RAISE') bottomDirection = '';
                if (price - 1 > previousPrice && bottomDirection == 'FALL') bottomDirection = '';
            } else if (index) {
                if (price - 1 > previousPrice) bottomDirection = 'RAISE';
                if (price + 1 < previousPrice) bottomDirection = 'FALL';
            }
            previousPrice = price;
        }.bind(this));

        if (bottomDirection == 'RAISE' && bottomCollection[bottomCollection.length - 1] > collection[collection.length - 1]) bottomDirection = '';
        if (bottomDirection == 'FALL' && bottomCollection[bottomCollection.length - 1] < collection[collection.length - 1]) bottomDirection = '';

        previousPrice = topCollection[0];
        let topGettingSmaller = false;
        let lastDif = 0;
        topCollection.forEach(function(price, index) {
            if (index > 1) {
                let dif = Math.abs(price - previousPrice);
                if (!lastDif) {
                    lastDif = dif;
                }
                if (price < previousPrice && topDirection == 'RAISE') topDirection = '';
                if (price > previousPrice && topDirection == 'FALL') topDirection = '';
            } else if (index) {
                if (price > previousPrice) topDirection = 'RAISE';
                if (price < previousPrice) topDirection = 'FALL';
            }
            previousPrice = price;
        }.bind(this));
        return {
            bottomCollection: bottomCollection,
            bottomDirection: bottomDirection,
            topDirection: topDirection,
            topCollection: topCollection
        }
    }
};
