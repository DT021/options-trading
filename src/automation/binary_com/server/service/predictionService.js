var path = require('path');
var fs = require('fs');
const Event = require('../event/event.js');
const HeadAndShoulders = require('../prediction/headAndShoulders.js');
let EventBus;
const PredictionService = {
  DIRECTION: {
    RAISE: 'RAISE',
    FALL: 'FALL'
  },
  TICK_COLLECTION_LIMIT:200,
  history: null,
  trendDuration: 10,
  tickDuration: 10,
  totalWins: 0,
  totalLoses: 0,
  hasHistory: false,
  hasProposal: false,
  tickCollection: [],
  init(_EventBus) {
    EventBus = _EventBus;
    EventBus.addEventListener('ON_HISTORY', this.onHistory.bind(this));
    EventBus.addEventListener('ON_TICK', this.onTick.bind(this));
    EventBus.addEventListener(Event.TRANSCATION_COMPLETE, this.onTransactionComplete.bind(this));
  },
  onTransactionComplete(data) {
    console.log('onTransactionComplete');
    if (data.isWin) {
      this.totalWins++;
    } else {
      this.totalLoses++;
    }
    this.hasProposal = false;
    console.log('totalWins', this.totalWins, '/', 'totalLoses', this.totalLoses);
  },
  onTick(data) {
    if (!this.hasHistory) return;
    console.log(data.quote);
    this.tickCollection.push(data.quote);
    
    //keep the tick collection from killing the memory
    if(this.tickCollection.length > this.TICK_COLLECTION_LIMIT)this.tickCollection.shift();

    this.history.prices.push(data.quote);
    this.history.times.push(data.epoch);

    //wait until there is no proposals to start predicting
    if (!this.hasProposal && this.tickCollection.length > this.trendDuration) {
        this.doChannelPrediction();
        HeadAndShoulders.check(this.history);
    }
  },
  onHistory(data) {
    if (this.hasHistory) return;
    this.hasHistory = true;
    this.history = data;
    this.predictionTest();
  },
  predictionTest() {
    let proposalCount = 0;
    let isProposal = false;
    let proposal = null;
    let winCount = 0;
    let lossCount = 0;
    let lossStreak = 0;
    let lossStreakMax = 0;
    this.history.prices.forEach((price, index) => {
      if (proposal && proposalCount < 10) {
        proposalCount++;
      } else if (proposal && proposalCount == 10) {
        let isWin = this.isProposalAWin(price, proposal);
        proposalCount = 0;
        proposal = null;
        if (isWin) {
          winCount++;
          if (lossStreakMax < lossStreak) lossStreakMax = lossStreak;
          lossStreak = 0;
        } else {
          lossCount++;
          lossStreak++;
        }
      }
      if (!proposal && index > this.trendDuration) {
        let direction = this.doPredictionModels(index,this.history.prices);
        if (direction) {
          proposal = {
            direction: direction,
            price: price
          };
        }
      }
    });

    console.log('history.length', this.history);
    console.log('winCount', winCount, '/', 'lossCount', lossCount);


  },
  doChannelPrediction() {
    let index = this.tickCollection.length - 1;
    let direction = this.doPredictionModels(index);
    if (direction) this.setProposal(index, direction);
  },
  setProposal(index, direction) {
    this.hasProposal = true;
    let collection = this.getCollection(index);
    let highLow = this.getHighestLowest(collection);
    EventBus.dispatch(Event.UPDATE_ALL, {
      key: 'UPDATE_PREDICTION_CHART',
      data: {
        collection: collection,
        lowest: highLow.lowest,
        highest: highLow.highest,
        direction: direction
      }
    });
    let sessionModel = EventBus.getHook('getSessionModel');
    let data = sessionModel.getData();
    let proposal = {
      stake: data.stake,
      type: direction == this.DIRECTION.RAISE ? 'CALL' : 'PUT',
      isVirtual: data.isVirtual,
      tickDuration: data.tickDuration,
      assetName: data.assetName
    }
    console.log('proposal', direction);
    EventBus.dispatch(Event.PURCHASE_CONTRACT, proposal);
  },
  isProposalAWin(price, proposal) {
    if (proposal.direction == this.DIRECTION.RAISE && price > proposal.price || proposal.direction == this.DIRECTION.FALL && price < proposal.price) {
      return true;
    }
    return false;
  },
  getCollection(index) {
    return this.tickCollection.splice(index - this.trendDuration, index);
  },
  doPredictionModels(index,ticks) {
    let collection = (ticks? ticks :this.tickCollection).splice(index - this.trendDuration, index);
    let direction = this.checkChannelDirection(collection);
    //let direction = this.checkAscendingDirection(collection);

    return direction;
  },
  getHighestLowest(collection) {
    let lowest = collection[0];
    let highest = collection[0];
    collection.forEach(function(price, index) {
      if (price > highest) highest = price;
      if (price < lowest) lowest = price;
    }.bind(this));
    return {
      highest: highest,
      lowest: lowest
    }
  },
  checkChannelDirection(collection) {
    let obj = this.getTopAndBottomCollections(collection);
    return obj.bottomDirection == obj.topDirection ? obj.bottomDirection : '';
  },
  checkAscendingDirection(collection) {
    let obj = this.getTopAndBottomCollections(collection);
    if(obj.bottomDirection && obj.topDirection && obj.topDirection != obj.bottomDirection)return true;
    return false;
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

module.exports = PredictionService;
