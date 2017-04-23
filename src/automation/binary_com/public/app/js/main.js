const Main = {
    ws: null,
    state:{
      highestPrice:0,
      lowestPrice:0,
    },
    init() {
        document.addEventListener('DOMContentLoaded', this.onLoaded.bind(this));
    },
    onLoaded() {
        console.log('loaded');
        ChartComponent.create();
        this.connect();
    },
    connect() {
        this.ws = new WebSocket('ws://localhost:8001/ws');
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
    },
    onOpen(event) {
        console.log(event);
        this.send({ key: 'UPDATE' });
    },
    onMessage(event) {
        let data = JSON.parse(event.data);
        switch (data.key) {
            case 'UPDATE':
                this.update(data.data);
                break;
            case 'TICK':
            ChartComponent.update({
              time:data.data.epoch,
              price:data.data.quote,
              lowestPrice:this.state.lowestPrice
            });
                break;
        }
    },
    update(data) {
        console.log(data);
        this.state.highestPrice = data.highestPrice;
        this.state.lowestPrice = data.lowestPrice;
        DataBind.set('balance', data.balance);
        DataBind.set('lossCap', data.lossCap);
        DataBind.set('profitCap', data.profitCap);
        DataBind.set('assetName', data.assetName);
        DataBind.set('highestPrice', data.highestPrice);
        DataBind.set('lowestPrice', data.lowestPrice);
    },
    onClose(event) {

    },
    send(data) {
        this.ws.send(JSON.stringify(data));
    }
};

Main.init();
