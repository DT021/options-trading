var App = App || {
    EVENT: {
        START_TRADING: 'START_TRADING',
        STOP_TRADING: 'STOP_TRADING',
        PROPOSE_FALL: 'PROPOSE_FALL',
        PROPOSE_RAISE: 'PROPOSE_RAISE'
    }
};
App.EventBus = {
    events: {}
};

App.EventBus.addEventListener = function(eventName, callback) {
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push(callback);
};

App.EventBus.removeEventListener = function(eventName, callback) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(function(item, index) {
        if (item == callback) this.events[eventName].splice(index, 1);
    }.bind(this));
};

App.EventBus.dispatch = function(eventName, data) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(function(item) {
        item(data);
    }.bind(this));
};
