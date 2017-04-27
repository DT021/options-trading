const EventBus = {
  events: {},
  hooks: {},
  addEventListener(eventName, callback) {
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push(callback);
  },
  removeEventListener(eventName, callback) {
    if (!this.events[eventName]) return;
    for (let a = 0; a < this.events[eventName].length; a++) {
      let item = this.events[eventName][a];
      if (item == callback) {
        this.events[eventName].splice(a, 1);
        break;
      }
    }
  },
  dispatch(eventName, data) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(function(item) {
      item(data);
    }.bind(this));
  },
  addHook(methodName, scope) {
    this.hooks[methodName] = {
      methodName: methodName,
      scope: scope
    };
  },
  getHook(methodName, data) {
    if (!this.hooks[methodName]) return null;
    return this.hooks[methodName].scope[methodName](data);
  }
};

module.exports = EventBus;
