const DataBind = {
    model: {

    },
    elements: {

    },
    init() {
        document.addEventListener('DOMContentLoaded', this.onLoaded.bind(this));
    },
    onLoaded() {
        this.getElements();
    },
    set(key, value) {
        let eKey = key.replace('.', '_');
        this.model[key].value = value;
        this.onChange(eKey, value);
    },
    onChange(key, value) {
        if (!this.model[key]) return;
        this.model[key].items.forEach(function(element) {
          element.innerHTML = value;
        }.bind(this));
    },
    getElements() {
        let collection = document.querySelectorAll('[data-bind]');
        collection.forEach(function(element) {
            key = element.getAttribute('data-bind');
            eKey = key.replace('.', '_');
            if (!this.model[eKey]) this.model[eKey] = {
              value:'',
              items:[]
            };
            this.model[eKey].items.push(element);
        }.bind(this));
    }
};
DataBind.init();
window.DataBind = DataBind;