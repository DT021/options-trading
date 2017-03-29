let App = {
    init() {
        document.addEventListener('DOMContentLoaded', this.onLoaded.bind(this));
    },
    onLoaded() {
        var ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=3367');

        ws.onopen = function(evt) {
            ws.send(JSON.stringify({ ticks: 'R_100' }));
        };

        ws.onmessage = function(msg) {
            var data = JSON.parse(msg.data);
            console.log('ticks update: %o', data);
        };
    }
};

App.init();
