 window.onload = function() {

     var Simulator = {
         dayCollection: [],
         dropdown: null,
         ws: null,
         config: {
             type: 'line',
             options: {
                 scales: {
                     yAxes: [{
                         display: true,
                                ticks: {
                                    suggestedMin:10, 

                                }
                     }]
                 }
             },
             data:{
                labels: [],
                datasets: [{
                 label: "My First dataset",
                 fill: false,
                 lineTension: 0.1,
                 backgroundColor: "rgba(75,192,192,0.4)",
                 borderColor: "rgba(75,192,192,1)",
                 borderCapStyle: 'butt',
                 borderDash: [],
                 borderDashOffset: 0.0,
                 borderJoinStyle: 'miter',
                 pointBorderColor: "rgba(75,192,192,1)",
                 pointBackgroundColor: "#fff",
                 pointBorderWidth: 1,
                 pointHoverRadius: 5,
                 pointHoverBackgroundColor: "rgba(75,192,192,1)",
                 pointHoverBorderColor: "rgba(220,220,220,1)",
                 pointHoverBorderWidth: 2,
                 pointRadius: 1,
                 pointHitRadius: 10,
                 spanGaps: false,
                 steppedLine: false,
                 data: []
             }]
             }
             
         },
         init() {
             this.setupWebSocket();
             this.createChart();
             this.addListeners();
         },
         addListeners() {
             let runButton = document.querySelector('#run-button');
             runButton.addEventListener('click', this.onRunClicked.bind(this));
         },
         setupWebSocket() {
             if ("WebSocket" in window) {
                 console.log("WebSocket is supported by your Browser!");

                 // Let us open a web socket
                 this.ws = new WebSocket("ws://localhost:3000/ws");

                 this.ws.onopen = this.onOpen.bind(this);

                 this.ws.onmessage = this.onMessage.bind(this);

                 this.ws.onclose = function() {
                     // websocket is closed.
                     console.log("Connection is closed...");
                 };
             } else {
                 // The browser doesn't support WebSocket
                 console.log("WebSocket NOT supported by your Browser!");
             }
         },
         onOpen() {
             this.send('ready', {});
             console.log("Sent READY");
         },
         onMessage(event) {
             let obj = JSON.parse(event.data);
             console.log(obj);
             switch (obj.key) {
                 case 'days':
                     this.dayCollection = obj.data;
                     this.populatingDaysDropdown();
                     break;
                 case 'tick':
                     Simulator.updateChart(obj.data);
                     break;
             }
         },
         onRunClicked() {
             this.run();
         },
         populatingDaysDropdown() {
             this.dropdown = document.querySelector('#days-dropdown');
             console.log(this.dayCollection);
             this.dayCollection.forEach(function(item, index) {
                 let optionElement = document.createElement('option');
                 optionElement.value = index;
                 optionElement.innerHTML = item;
                 this.dropdown.appendChild(optionElement);
             }.bind(this));
         },
         run() {
             this.send('run', this.dayCollection[this.dropdown.selectedIndex]);
         },
         send(key, data) {
             let obj = {
                 key: key,
                 data: data
             };
             this.ws.send(JSON.stringify(obj));
         },
         createChart() {
             document.getElementById("myChart").width = document.body.clientWidth; //document.width is obsolete
             document.getElementById("myChart").height = document.body.clientHeight; //document.height is obsolete
             var ctx = document.getElementById("myChart").getContext("2d");
             var optionsNoAnimation = { animation: false }
             this.chart = new Chart(ctx, this.config);
             console.log(this.chart);
         },
         updateChart(item) {
             if (this.config.data.datasets[0].data.length > 40) {
                 this.config.data.datasets[0].data.shift();
                 this.config.data.labels.shift();
             }
             this.config.data.labels.push(item.time);
             this.config.data.datasets[0].data.push(Number(item.price));
             this.chart.update();
         }

         //this.chart.options.data[0].dataPoints.push({ y: Number(item.price), x: item.time });
         // this.chart.render();
     };

     Simulator.init();
 }
