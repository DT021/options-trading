var path = require('path');
var fs = require('fs');
const Event = require('../event/event.js');
let EventBus;
const PredictionService = {
    history: null,
    trendDuration: 10,
    done: false,
    init(_EventBus) {
        EventBus = _EventBus;
        EventBus.addEventListener('ON_HISTORY', this.onHistory.bind(this));
    },
    onHistory(data) {
        this.history = data;
        let collection = this.history.prices.splice(this.history.prices.length - (this.trendDuration + 1), this.history.prices.length - 1);
        let highLow = this.getHighestLowest(collection);
        let direction = this.checkDirection(collection);

        EventBus.dispatch(Event.UPDATE_ALL,{
          key: 'UPDATE_PREDICTION_CHART',
          data: {
            collection:collection,
            lowest:highLow.lowest,
            highest:highLow.highest,
            direction:direction
          }
        });
    },
    getHighestLowest(collection){
      let lowest = collection[0];
      let highest = collection[0];
       collection.forEach(function(price, index) {
        if(price > highest)highest = price;
        if(price < lowest)lowest = price;
       }.bind(this));
       return {
        highest:highest,
        lowest:lowest
       }
    },
    checkDirection(collection) {
        this.done = true;
        
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

        return bottomDirection == topDirection ? bottomDirection : '';
    }

};

module.exports = PredictionService;
