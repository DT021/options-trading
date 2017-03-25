const DataParser = require('./src/service/dataParser.js');
const AnalyseData = require('./src/service/analyseData.js');
const OptionsTrading = {
    init() {
        DataParser.init(this.onParseComplete.bind(this));

    },
    onParseComplete() {
        AnalyseData.init(DataParser.data);
    }
};

OptionsTrading.init();
