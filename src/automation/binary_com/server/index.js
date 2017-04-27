const EventBus = require('./event/Eventbus.js');
const Event = require('./event/event.js');
const BinaryService = require('./service/binaryService.js');
const SocketService = require('./service/socketService.js');
const PredictionService = require('./service/predictionService.js');
const SaveService = require('./service/saveService.js');
const DayModel = require('./model/DayModel.js');
const express = require('express');
const path = require('path');
const app = express();
require('express-ws')(app);
const fs = require('fs');


const Controller = {
  sessionModel: null,
  dayModel: null,
  init() {
    EventBus.addEventListener('READY', this.onReady.bind(this));
    EventBus.addHook('getSessionModel', this);
    BinaryService.init(EventBus);
    SaveService.init(EventBus);
    PredictionService.init(EventBus);

    this.route();

  },
  route() {
    app.use('/', express.static(path.join(__dirname, '../public')));
    SocketService.init(app, EventBus);
    console.log('server running on http://localhost:8001/app');
    app.listen(8001);
  },
  onReady(data) {
    console.log('ready');
    this.dayModel = new DayModel(data, EventBus);
  },
  getSessionModel() {
    //console.log('sessionModel',this.sessionModel);
    return this.dayModel.currentSessionModel;
  }
}.init();
