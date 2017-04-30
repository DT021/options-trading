const Volatility = {
    tickCollection: [],
    duration: 1000,
    priceChangeDuration: 30,
    priceChangeBarrier: 30,
    timer: null,
    check(price,override) {
        if (!this.timer && !override) {
            this.start();
        } else {
            this.tickCollection.push(price);
        }
    },
    start() {
        this.tickCollection = [];
        this.timer = setTimeout(() => {
            this.end();
        }, this.duration);
    },
    end() {
        let count = this.tickCollection.length;
      //console.log('Volatility', count);
      let change= this.priceChangeSmall();
         if (change) {
        //if ( this.isVolatile() || count > 5) {
            Main.pauseTrading = true;
            View.updateVolatile(true,change);
        } else {
            Main.pauseTrading = false;
            View.updateVolatile(false,change);
        }
        this.timer = null;
    },
    isVolatile() {
        let bottomCollection = [];
        let previousPrice = this.tickCollection[0];
        let topCollection = [];
        // find top and bottom prices
        this.tickCollection.forEach(function(price, index) {
            if (index > 1) {
                if (price > previousPrice && previousPrice < this.tickCollection[index - 2]) bottomCollection.push(previousPrice);
                if (price < previousPrice && previousPrice > this.tickCollection[index - 2]) topCollection.push(previousPrice);
            }
            previousPrice = price;
        }.bind(this));

        //console.log('change', bottomCollection.length, topCollection.length);
        if (bottomCollection.length < 2 && topCollection.length < 2) return false;
        return true;
    },
    priceChangeSmall() {
        let collection = Main.history.slice(Main.history.length - (this.priceChangeDuration + 1), Main.history.length);
        let lastPrice = collection[0];
        let currentPrice = collection[collection.length - 1];
        //console.log('Volatile Dif', Math.abs(lastPrice - currentPrice),this.priceChangeBarrier)
        if (Math.abs(lastPrice - currentPrice) < this.priceChangeBarrier) return Math.abs(lastPrice - currentPrice);
        return false;
    }
};
