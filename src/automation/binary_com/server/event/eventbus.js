const EventBus = {
    events:{},
    addEventListener(eventName, callback) {
        if (!this.events[eventName]) this.events[eventName] = [];
        this.events[eventName].push(callback);
    },
    removeEventListener(eventName, callback) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach(function(item, index) {
            if (item == callback) this.events[eventName].splice(index, 1);
        }.bind(this));
    },
    dispatch(eventName, data) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach(function(item) {
            item(data);
        }.bind(this));
    }
};

module.exports = EventBus;
