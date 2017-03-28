const fs = require('fs');
const DataParser = {
    callback: null,
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
    init(_callback) {
        this.callback = _callback;
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
                            return cFonsole.log(err);
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
            this.createTimeObj(key, item, arr[1],item.date);

        }.bind(this));
        this.writeFile();
        this.callback();
    },
    createTimeObj(key, item, timeString,date) {
        let arr = timeString.split(':');
        let mins = Number(arr[1]) < 35 ? '00' : '35';
        let hour = arr[0];
        if (!this.data[key].prices[`${hour}_${mins}`]) {
            this.data[key].prices[`${hour}_${mins}`] = {
                priceCollection: [],
            };
        }

        let dateObj = new Date();
        dateObj.setHours(hour);
        dateObj.setMinutes(arr[1]);
        dateObj.setSeconds(arr[2]);

        console.log('----');


        let hasItem = this.hasItem(this.data[key].prices[`${hour}_${mins}`],date);
        if(hasItem) return;
        this.data[key].prices[`${hour}_${mins}`].priceCollection.push({
            time: timeString,
            date: date,
            timeNumber: dateObj.getTime(),
            price: item.price
        });

        this.data[key].prices[`${hour}_${mins}`].priceCollection.sort(function(a, b) {
             return a.timeNumber - b.timeNumber;
        });

    },
    hasItem: function(item,date){
        let found = false;
        item.priceCollection.forEach(function(time){
            if(time.date == date) found = true;
        });
        return found;
    },
    writeFile() {
        fs.writeFile('./data.json', JSON.stringify(this.data, null, 2), function(err) {
            if (err) return console.log(err);
            console.log('saved');
        });
    }
};

module.exports = DataParser;
