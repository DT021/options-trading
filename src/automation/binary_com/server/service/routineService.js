var path = require('path');
var fs = require('fs');
const RoutineService = {
    DAYS: [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
    ],
    currentDay: '',
    currentDate: null,
    model: null,
    modelPath:null,
    init() {
       // this.setCurrentDate();
        //this.setModel();
        //this.trade();
    },
    trade() {
        let hasTraded = this.hasTradedToday();
        console.log('has traded?', hasTraded);
    },
    setCurrentDate() {
        this.currentDate = new Date();
        let day = this.currentDate.getDay();
        this.currentDay = this.DAYS[day];
        console.log(this.currentDay);
    },
    setModel() {
        let year = this.currentDate.getYear();
        let month = this.currentDate.getMonth();
        let day = this.currentDate.getDate();
        this.modelPath = path.resolve(__dirname, '../model/' + day + '_' + month + '_' + year + '.json');
        if (fs.existsSync(this.modelPath)) {
            this.model = JSON.parse(fs.readFileSync(this.modelPath, 'utf8'));
        } else {
            this.model = {};
            this.saveModel();
        }
    },
    saveModel(){
      fs.writeFileSync(this.modelPath, JSON.stringify(this.model, null, 2), 'utf8');
    },
    hasTradedToday() {
        //check trade has happened
        return this.model.results[this.currentDay] !== undefined;
    }
};

module.exports = RoutineService;
