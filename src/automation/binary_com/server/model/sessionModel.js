let EventBus;
const Event = require('../event/event.js');
const FinanceModel = require('./financeModel.js');

class SessionModel {
    constructor(data, _EventBus) {
        EventBus = _EventBus;
        this.state = {
            currency: '',
            isVirtual: false,
            loginId: null,
            assetName: 'R_100',
            highestPrice: 0,
            lowestPrice: 0
        }
        this.financeModel = null;
        this.init(data);
    }
    init(data) {
        EventBus.addEventListener(Event.HIGH_LOW, this.onHighLow.bind(this));
        this.state.currency = data.currency;
        this.state.isVirtual = data.is_virtual;
        this.state.loginId = data.loginid;
        this.financeModel = new FinanceModel();
        this.financeModel.setBalance(data.balance);
        //console.log(this.state);
    }
    onHighLow(data) {
        this.state.lowestPrice = data.lowestPrice;
        this.state.highestPrice = data.highestPrice;
        EventBus.dispatch(Event.UPDATE_DATA, {});
    }
    getData() {
        let financeData = this.financeModel.getData();
        let obj = {
            currency: this.state.currency,
            isVirtual: this.state.isVirtual,
            loginId: this.state.loginId,
            highestPrice: this.state.highestPrice,
            lowestPrice: this.state.lowestPrice,
            assetName: this.state.assetName
        }
        for(let key in financeData){
          obj[key] = financeData[key];
        }
        return obj;
    }
};

module.exports = SessionModel;
