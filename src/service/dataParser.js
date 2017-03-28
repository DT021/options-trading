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
            let date = this.getDaylightSavingDate(item.date);
            //let key = arr[0].replace(/\//g, '_');
            let key = this.weekdays[date.getDay()];
            if (!this.data[key])
                this.data[key] = {
                    date: arr[0],
                    prices: {}
                };
            this.createTimeObj(key, item, arr[1], item.date);

        }.bind(this));
        this.writeFile();
        this.callback();
    },
    getDaylightSavingDate(dateString) {
        let timeStampArr = dateString.substring(0, dateString.length - 5).split(' ');
        let dateArr = timeStampArr[0].split('/');
        let timeArr = timeStampArr[1].split(':');
        let isoDate = `${dateArr[2]}-${dateArr[1]}-${dateArr[0]}T${timeArr[0]}:${timeArr[1]}:${('0' + timeArr[2]).slice(-2)}+01:00`; 
        var theDate = new Date(isoDate);
        let hour = 0;
        if (theDate.getTimezoneOffset() < 0) {
            hour = -1;
        } else if (theDate.getTimezoneOffset() > 0) {
            hour = 1;
        }
        theDate.setHours(theDate.getHours() + hour);
        return theDate;
    },
    createTimeObj(key, item, timeString, date) {

        let arr = timeString.split(':');
        let mins = Number(arr[1]) < 35 ? '00' : '35';
        let hour = this.getDaylightSavingDate(date).getHours();
        if (!this.data[key].prices[`${hour}_${mins}`]) {
            this.data[key].prices[`${hour}_${mins}`] = {
                priceCollection: [],
            };
        }

        let dateObj = new Date();
        dateObj.setHours(hour);
        dateObj.setMinutes(arr[1]);
        dateObj.setSeconds(arr[2]);


        let hasItem = this.hasItem(this.data[key].prices[`${hour}_${mins}`], date);
        if (hasItem) return;
        this.data[key].prices[`${hour}_${mins}`].priceCollection.push({
            time: ('0' + dateObj.getHours()).slice(-2) + ':' + ('0' + dateObj.getMinutes()).slice(-2) + ':' + ('0' + dateObj.getSeconds()).slice(-2),
            date: date,
            timeNumber: dateObj.getTime(),
            price: item.price
        });

        this.data[key].prices[`${hour}_${mins}`].priceCollection.sort(function(a, b) {
            return a.timeNumber - b.timeNumber;
        });

    },
    hasItem: function(item, date) {
        let found = false;
        item.priceCollection.forEach(function(time) {
            if (time.date == date) found = true;
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

Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.dst = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

module.exports = DataParser;
