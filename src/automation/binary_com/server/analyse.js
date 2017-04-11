let fallCollection = require('./data/fall.json');
let raiseCollection = require('./data/raise.json');
var fs = require('fs');
var path = require('path');

const Analyse = {
    hasStarted: false,
    data: null,
    averageFallPosition: 0,
    averageRaisePosition: 0,
    init() {
        console.log('Fall');
        this.averageFallPosition = this.getAveragePosition(fallCollection);

        this.averageFallDownCounts = this.getAverageInCollection(fallCollection, 'numberOfHistoricDowns', 10);
        this.averageFallUpCounts = this.getAverageInCollection(fallCollection, 'numberOfHistoricUps', 10);
        console.log('\n\nRaise');
        this.averageRaisePosition = this.getAveragePosition(raiseCollection);
        this.averageFallDownCounts = this.getAverageInCollection(raiseCollection, 'numberOfHistoricDowns', 10);
        this.averageFallUpCounts = this.getAverageInCollection(raiseCollection, 'numberOfHistoricUps', 10);

        let data = {
            asset: 'R_100',
            startPricePosition: "0.60",
            historicDirections: [
                "up",
                "up",
                "up",
                "up",
                "up",
                "up",
                "up",
                "up",
                "up"
            ]
        };

        let prediction = this.getPrediction(data);
        console.log('prediction', prediction);

    },
    start(_data) {
        if (this.hasStarted) return;
        this.hasStarted = true;
        this.data = _data;
        this.compare('down,up,down,up');
        this.hasStarted = false;
    },
    getAveragePosition(collection) {
        this.getAverageInCollection(collection, 'startPricePosition');
    },
    getAverageInCollection(collection, key, lengthIncrement) {
        let total = 0;
        collection.forEach(function(item) {
            total += Number(item[key]);
        });
        let len = (lengthIncrement ? collection.length * lengthIncrement : collection.length);
        console.log(len, collection.length, total);
        let average = total / len;
        console.log(key, average);
        return average;
    },
    getPrediction(data, successCollection) {
        if (!fs.existsSync(path.join(__dirname, './data/' + data.asset))) return;
        fallCollection = require('./data/' + data.asset + '/fall.json');
        raiseCollection = require('./data/' + data.asset + '/raise.json');

        let collection = this.getSimilarTicks(data.historicDirections);
        let prediction;
        if(successCollection)prediction = this.getExistingPrediction(data, successCollection);
        if (!prediction) prediction = this.patternPerdiction(data, collection);
        return prediction;
    },
    getExistingPrediction(data, successCollection) {
        let prediction;
        let historyString = data.historicDirections.toString();
        successCollection.forEach(function(obj) {
            let itemHistoryString = obj.item.historicDirections.toString();
            if (Number(data.startPricePosition.substring(0, 2)) == Number(obj.item.startPricePosition.substring(0, 2)) && historyString == itemHistoryString) {
                prediction = obj.prediction;
            }
        });
        console.log('getExistingPrediction',prediction);

        return prediction;
    },
    patternPerdiction(data, collection) {
        let fallCount = 0;
        let raiseCount = 0;
        collection = collection.filter(function(item) {
            if (Number(data.startPricePosition.substring(0, 2)) == Number(item.startPricePosition.substring(0, 2))) {
                if (item.type === 'fall') {
                    fallCount++;
                } else if (item.type == 'raise') {
                    raiseCount++;
                }
                return item;
            }
        }.bind(this));


        console.log('getPrediction');
        console.log('position', data.startPricePosition);
        console.log('collection length', collection.length);
        console.log('raiseCount', raiseCount);
        console.log('fallCount', fallCount);
        if (!collection.length) return null;
        if (collection.length == 1) return collection[0].type;
        let prediction = raiseCount > fallCount ? 'raise' : 'fall';
        return prediction;
    },
    getSimilarTicks(tickDirections) {
        let foundCollection = this.onEachSimilar(tickDirections, fallCollection);
        foundCollection = foundCollection.concat(this.onEachSimilar(tickDirections, raiseCollection));

        return foundCollection;
    },
    onEachSimilar(tickDirections, collection) {
        let foundCollection = [];
        collection.forEach(function(item) {
            let count = 0;
            if (!item.historicDirections) return;
            item.historicDirections.forEach(function(tick, index) {
                if (tickDirections[index] && tickDirections[index] === tick) count++;
            }.bind(this));
            if (count / tickDirections.length >= 1) {
                let obj = item;
                obj.closest = count / tickDirections.length
                foundCollection.push(obj);
            }
        }.bind(this));

        return foundCollection;
    },
    compare(str) {
        this.data.fall.forEach(function(item) {
            console.log(str);
            let historicDirections = item.historicDirections.toString();
            console.log(this.levenshtein(str, historicDirections));
        }.bind(this));
    },
    levenshtein(a, b) {
        if (a.length == 0) return b.length;
        if (b.length == 0) return a.length;

        // swap to save some memory O(min(a,b)) instead of O(a)
        if (a.length > b.length) {
            var tmp = a;
            a = b;
            b = tmp;
        }

        var row = [];
        // init the row
        for (var i = 0; i <= a.length; i++) {
            row[i] = i;
        }

        // fill in the rest
        for (var i = 1; i <= b.length; i++) {
            var prev = i;
            for (var j = 1; j <= a.length; j++) {
                var val;
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    val = row[j - 1]; // match
                } else {
                    val = Math.min(row[j - 1] + 1, // substitution
                        prev + 1, // insertion
                        row[j] + 1); // deletion
                }
                row[j - 1] = prev;
                prev = val;
            }
            row[a.length] = prev;
        }

        return row[a.length];
    }
}
Analyse.init();
module.exports = Analyse;
