let EventBus;
const Event = require('../event/event.js');
const fs = require('fs');
const path = require('path');

const SaveService = {
  init(_EventBus) {
    EventBus = _EventBus;
    EventBus.addEventListener(Event.SAVE_DATA_TO_FILE, this.saveData.bind(this));
    EventBus.addHook('getData',this);
  },
  getData(data) {
    let filePath = path.resolve(__dirname, data.directory + '/' + data.filename);
    if (fs.existsSync(filePath)) {
      let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return content;
    }else{
      return {};
    }
  },
  saveData(data) {
    let dir = path.resolve(__dirname, data.directory);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    fs.writeFileSync(dir + '/' + data.filename, JSON.stringify(data.data, null, 2), 'utf8');
    console.log('file saved!');
  }
};
module.exports = SaveService;
