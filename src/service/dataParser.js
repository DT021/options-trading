const fs = require('fs');
const DataParser = {
    DIR: './data/',
    collection: [],
    numberOfFiles: 0,
    fileCount: 0,
    weekdays: {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday'
    },
    data: {},
    init() {
        this.getFiles();
    },
    getFiles() {
        let collection = [];
        let c = fs.readdir(this.DIR, (err, files) => {
            DataParser.numberOfFiles = files.length;
            files.forEach(file => {
                var filePath = DataParser.DIR + file;
                if (fs.statSync(filePath).isFile()) {
                    fs.readFile(filePath, 'utf8', function(err, data) {
                        if (err) {
                            return console.log(err);
                        }
                        DataParser.concatFiles(data);
                    });
                }
            });

        });

    },
    concatFiles(data) {
        this.collection = this.collection.concat(JSON.parse(data));
        this.fileCount++;
        if (this.fileCount >= this.numberOfFiles - 1) this.createDataCollection();

    },
    createDataCollection() {
        this.collection.forEach(function(item, index) {
            let arr = item.date.split(' ');
            let dateArr = arr[0].split('/');
            let date = new Date(`${dateArr[2]}-${dateArr[1]}-${dateArr[0]}T${arr[1]}+00:00`);
            //let key = arr[0].replace(/\//g, '_');
            let key = this.weekdays[date.getDay()];
            if (!this.data[key])
                this.data[key] = {
                    date: arr[0],
                    prices: {}
                };
            this.createTimeObj(key, item, arr[1]);

            if (index == 0) {

                //2017-03-24T16:28:39+00:00
                console.log(this.data);
            }

        }.bind(this));
        this.writeFile();
        this.findMean();
    },
    createTimeObj(key, item, timeSting) {
        let arr = timeSting.split(':');
        let mins = Number(arr[1]) < 35 ? '00' : '35';
        let hour = arr[0];
        if (!this.data[key].prices[`${hour}_${mins}`]) {
            this.data[key].prices[`${hour}_${mins}`] = {
                priceCollection: [],
            };
        }

        this.data[key].prices[`${hour}_${mins}`].priceCollection.push({
            time: timeSting,
            price: item.price
        });
    },
    writeFile() {
        fs.writeFile('./data.json', JSON.stringify(this.data, null, 2), function(err) {
            if (err) return console.log(err);
            console.log('saved');
        });
    },
    findMean() {
        let key = Object.keys(this.data)[0];
        for (let dateKey in this.data) {
            let item = this.data[dateKey];

            for (let timeKey in item.prices) {
                let result = 0;
                let highest = 0;
                let lowest = 0;
                let obj = item.prices[timeKey];
                let length = obj.priceCollection.length;
                obj.priceCollection.forEach(function(item) {
                    let price = Number(item.price)
                    result += price;
                    if (price > highest) highest = price;
                    if (!lowest) lowest = price;
                    if (price < lowest) lowest = price;
                });
                let mean = (result / length);
                let varianceResults = 0;
                obj.priceCollection.forEach(function(item) {
                    let price = Number(item.price);
                    varianceResults += Math.pow(price - mean,2);
                });
                let variance = Math.sqrt(varianceResults / (length - 1));
                let deviationLowset = mean - variance;
                let deviationHighest = variance + mean;
                console.log('At ',timeKey);
                console.log('MEAN was ',mean);
                console.log('Highest was ',highest);
                console.log('Lowest was ',lowest);
                console.log('variance ',variance);
                console.log('standard deviation lowest ',deviationLowset);
                console.log('standard deviation highest ',deviationHighest);
            }
        }
    }


   // let timeKey = Object.keys(this.data[key].prices)[0];
   // let obj = this.data[key].prices[timeKey];



};

module.exports = DataParser;
