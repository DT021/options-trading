const fs = require('fs');
const AnalyseData = {
    data: null,
    analyseJson: {},
    init(_data) {
        this.data = _data;
        this.analyse();
        this.writeFile();
    },
    sortPricesByTime(prices) {
        let collection = [];
        for (let timeKey in prices) {
            collection.push({ key: timeKey, value: prices[timeKey] });
        }
        collection.sort(function(a, b) {
            let aTime = Number(a.key.replace('_', ''));
            let bTime = Number(b.key.replace('_', ''));
            if (aTime < bTime)
                return -1;
            if (aTime > bTime)
                return 1;
            return 0;
        });
        return collection;
    },
    writeFile() {
        fs.writeFile('./analyse.json', JSON.stringify(this.analyseJson, null, 2), function(err) {
            if (err) return console.log(err);
            console.log('saved');
        });
    },
    analyse() {
        let key = Object.keys(this.data)[0];
        for (let dateKey in this.data) {
            let item = this.data[dateKey];

            console.log('\n', dateKey);
            console.log('------------');
            let timeCollection = this.sortPricesByTime(item.prices);
            timeCollection.forEach(function(timeObj) {
                let timeKey = timeObj.key;
                let obj = timeObj.value;
                let result = 0;
                let highest = 0;
                let lowest = 0;
                let length = obj.priceCollection.length;
                obj.priceCollection.forEach(function(item) {
                    let price = Number(item.price)
                    result += price;
                    if (price > highest) highest = price;
                    if (!lowest) lowest = price;
                    if (price < lowest) lowest = price;
                });
                //check number of highs and lows
                let previousValue = 0;
                let highCount = 0;
                let lowCount = 0;
                obj.priceCollection.reverse();
                obj.priceCollection.forEach(function(item) {
                    let price = Number(item.price);
                    if (!previousValue) {
                        previousValue = price;
                        return;
                    }
                    if (price > previousValue) highCount++;
                    if (price < previousValue) lowCount++;
                    previousValue = price;

                });
                let mean = (result / length);
                let varianceResults = 0;
                obj.priceCollection.forEach(function(item) {
                    let price = Number(item.price);
                    varianceResults += Math.pow(price - mean, 2);
                });
                let variance = Math.sqrt(varianceResults / (length - 1));
                let deviationLowest = mean - variance;
                let deviationHighest = variance + mean;
                /*
                console.log('\n\n');
                console.log('At ', timeKey.replace('_', ':'));
                console.log('MEAN was ', mean.toFixed(2));
                console.log('Highest was ', highest);
                console.log('Lowest was ', lowest);
                console.log('variance ', variance.toFixed(2));
                console.log('standard deviation lowest ', deviationLowest.toFixed(2));
                console.log('standard deviation highest ', deviationHighest.toFixed(2));
                console.log('number of highs ', highCount);
                console.log('number of lows ', lowCount);
                console.log('odds on high', ((highCount / (highCount + lowCount)) * 100).toFixed(2) + '%');
                console.log('odds on low', ((lowCount / (highCount + lowCount)) * 100).toFixed(2) + '%');
*/
                let analyseObject = {
                    time: timeKey.replace('_', ':'),
                    mean: mean.toFixed(2),
                    highestPrice: highest,
                    lowestPrice: lowest,
                    variance: variance.toFixed(2),
                    deviationLowest: deviationLowest.toFixed(2),
                    deviationHighest: deviationHighest.toFixed(2),
                    numberOfRaises: highCount,
                    numberOfFalls: lowCount,
                    raiseOdds: ((highCount / (highCount + lowCount)) * 100).toFixed(2) + '%',
                    fallOdds: ((lowCount / (highCount + lowCount)) * 100).toFixed(2) + '%',
                };

                this.addToJson(dateKey, analyseObject);
            }.bind(this));
        }
    },
    addToJson(key, item) {
        if (!this.analyseJson[key]) this.analyseJson[key] = [];
        this.analyseJson[key].push(item);
    }
};

module.exports = AnalyseData;
