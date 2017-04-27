const HeadAndShoulders = {
  TICK_LENGTH: 10,
  check(history) {
    let collection = history.prices.splice(history.prices.length - (this.TICK_LENGTH + 1), history.prices.length - 1);
    let obj = this.getTopAndBottomCollections(collection);

  },
  getTopAndBottomCollections(collection) {
    let bottomCollection = [];
    let topCollection = [];
    let previousPrice = collection[0];
    let bottomDirection = '';
    let topDirection = '';
    let increments = [];
    // find top and bottom prices
    collection.forEach(function(price, index) {
      if (index > 1) {
        if (price > previousPrice && previousPrice < collection[index - 2]) bottomCollection.push(previousPrice);
        if (price < previousPrice && previousPrice > collection[index - 2]) topCollection.push(previousPrice);
        increments.push(Math.abs(previousPrice-price));
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

    //work out increment mean
    let incrementTotal = 0;
    increments.forEach((increment)=>{
    		incrementTotal+=increment;
    });
    let incrementMean = incrementTotal/increments.length;
    //console.log('incrementMean',incrementMean);	
    return {
      bottomCollection: bottomCollection,
      bottomDirection: bottomDirection,
      topDirection: topDirection,
      topCollection: topCollection,
      incrementMean: incrementMean
    }
  }

};
module.exports = HeadAndShoulders;
