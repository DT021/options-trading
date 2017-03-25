fs = require('fs');
require('./polyfill/polyfill.js');
var page = require('webpage').create();
var Promise = require('es6-promise').Promise;

var HistoricalDataService = {
    runQueue: [],
    queueIndex: 0,
    tablePageIndex: 1,
    numberOfPages: 1,
    data: [],
    init: function() {
        this.setSetting();
        this.open();
    },
    setSetting: function() {
        page.viewportSize = {
            width: 800,
            height: 600
        };
        page.settings.resourceTimeout = 10000;
        page.onLoadFinished = this.onLoadFinished.bind(this);
    },
    open: function() {
        page.open('https://www.euronext.com/en/products/indices/QS0011052162-XAMS', this.onPageOpen.bind(this));
    },
    onPageOpen: function(status) {
        console.log('status', status)
        if (status === "success") {
            console.log('loaded');
        }
    },
    onLoadFinished: function() {

        console.log('page loaded');
        if (page.injectJs('src/automation/include/include.js')) {
            console.log('file included');
            setTimeout(function() {
                this.addToRun('changeToDataView', [], 1000);
                this.addToRun('showMaximumResults', [], 300);
                this.addToRun('getNumberOfTablePages', [], 300);
                this.addToRun('getTableByPage', [], 300);

                this.run();

            }.bind(this), 3000);

        }
    },
    run: function() {
        var obj = this.runQueue[this.queueIndex];
        if (obj) this.runNext(obj);
    },
    runNext: function(taskObj) {
        console.log('running task:' + taskObj.taskName);
        this.tasks[taskObj.taskName].apply(this, taskObj.args);
        setTimeout(function() {
            this.queueIndex++;
            this.run();
        }.bind(this), taskObj.waitDuration);
    },
    addToRun: function(taskName, args, waitDuration) {
        this.runQueue.push({
            taskName: taskName,
            args: args,
            waitDuration: waitDuration
        });
    },
    tasks: {
        changeToDataView: function() {
            evaluate(page, function() {
                var obj = document.querySelector('#pcContainer_da');
                if (obj) click(obj);
            });
        },
        showMaximumResults: function() {
            evaluate(page, function() {
                var sel = document.querySelector('#priceChartIntradayTable_length select');
                var opts = sel.options;
                sel.selectedIndex = 5;
                var evt = document.createEvent("HTMLEvents");
                evt.initEvent("change", false, true);
                sel.dispatchEvent(evt);
            });
        },
        loadNextTablePage: function(index) {
            console.log('load table page: ', index);
            
            evaluate(page, function(index) {
                var buttonCollection = document.querySelectorAll('.nyx_eu_paginate_button');
                for (var a = 0; a < buttonCollection.length; a++) {
                    if (buttonCollection[a].textContent == String(index)) {
                        window.click(buttonCollection[a]);
                    }
                }
            }, index);
            HistoricalDataService.saveData();
            HistoricalDataService.addToRun('getTableByPage', [], 300);
        },
        getNumberOfTablePages: function() {
            HistoricalDataService.numberOfPages = evaluate(page, function(index) {
                var buttonCollection = document.querySelectorAll('.nyx_eu_paginate_button');
                return buttonCollection.length;
            });

            console.log('numberOfPages:', HistoricalDataService.numberOfPages);
        },
        getTableByPage: function() {
            var data = evaluate(page, function() {
                var data = [];
                var trCollection = document.querySelectorAll('#priceChartIntradayTable tbody tr');
                for (var a = 0; a < trCollection.length; a++) {
                    var obj = {
                        date: '',
                        price: ''
                    };
                    var tr = trCollection[a];
                    var td = tr.querySelectorAll('td');
                    if (td[1]) obj.date = td[1].innerHTML;
                    if (td[1]) obj.price = td[2].innerHTML;
                    if (td[4]) obj.type = td[4].innerHTML;

                    data.push(obj);
                }
                return JSON.stringify(data, null, 2);
            });

            HistoricalDataService.data = HistoricalDataService.data.concat(JSON.parse(data));
            HistoricalDataService.tablePageIndex++;
            HistoricalDataService.addToRun('loadNextTablePage', [HistoricalDataService.tablePageIndex], 300);
        }
    },
    saveData: function() {
        var title = HistoricalDataService.data[0].date.replace(/[\s,\/,\:]/g, '_');
        console.log(title);
        fs.write('data/' + title +'.json', JSON.stringify(HistoricalDataService.data, null, 2), 'w');
        console.log('saved data');
        this.screenshot();
    },
    screenshot: function() {
        setTimeout(function() {
            page.render('example.png');
            console.log("screenshot taken");
            phantom.exit();
        }.bind(this), 3000);
    }
}

function evaluate(page, func) {
    var args = [].slice.call(arguments, 2);
    var fn = "function() { return (" + func.toString() + ").apply(this, " + JSON.stringify(args) + ");}";
    return page.evaluate(fn);
}
/*
page.onLoadFinished = function() {
    setTimeout(function() {
        setTimeout(function() {
            var tableData = evaluate(page, function() {
                var data = [];
                var trCollection = document.querySelectorAll('#priceChartIntradayTable tbody tr');
                for (var a = 0; a < trCollection.length; a++) {
                    var obj = {
                        date: '',
                        price: ''
                    };
                    var tr = trCollection[a];
                    var td = tr.querySelectorAll('td');
                    if (td[1]) obj.date = td[1].innerHTML;
                    if (td[1]) obj.price = td[2].innerHTML;
                    if (td[4]) obj.type = td[4].innerHTML;

                    data.push(obj);
                }
                return JSON.stringify(data, null, 2);

            });
            screenshot(tableData);
        }.bind(this), 300);


        //click on dropdown to increase number of rows

    }.bind(this), 3000);

}

function writeData(data) {
    fs.write('data-1.json', data, 'w');

}
*/


HistoricalDataService.init();
