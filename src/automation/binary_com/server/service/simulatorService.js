var path = require('path');
var fs = require('fs');
const Event = require('../event/event.js');
let EventBus;
const SimulatorService = {
    init(_EventBus) {
        EventBus = _EventBus;
        EventBus.addEventListener('ON_HISTORY', this.onHistory.bind(this));
    }
};

module.exports = SimulatorService;
