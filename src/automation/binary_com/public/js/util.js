const Util = {
    getHighLow(collection) {
        let highest = collection[0];
        let lowest = collection[0];
        collection.forEach(function(price) {
            if (price < lowest) lowest = price;
            if (price > highest) highest = price;
        });
        return {
            highest: highest,
            lowest: lowest
        }
    },
};
