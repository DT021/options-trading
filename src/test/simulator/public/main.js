 window.onload = function() {

     var Simulator = {
         data: {
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
                 data: []
             }]
         },
         init() {
             this.setupWebSocket();
             this.createChart();
         },
         setupWebSocket() {
             if ("WebSocket" in window) {
                 console.log("WebSocket is supported by your Browser!");

                 // Let us open a web socket
                 var ws = new WebSocket("ws://localhost:3000/ws");

                 ws.onopen = function() {
                     // Web Socket is connected, send data using send()
                     ws.send("ready");
                     console.log("Message is sent...");
                 };

                 ws.onmessage = function(evt) {
                     var received_msg = evt.data;
                     console.log("Message is received...", received_msg);
                     Simulator.updateChart(JSON.parse(received_msg));
                 };

                 ws.onclose = function() {
                     // websocket is closed.
                     console.log("Connection is closed...");
                 };
             } else {
                 // The browser doesn't support WebSocket
                 console.log("WebSocket NOT supported by your Browser!");
             }
         },
         createChart() {
             document.getElementById("myChart").width = document.body.clientWidth; //document.width is obsolete
             document.getElementById("myChart").height = document.body.clientHeight; //document.height is obsolete
             var ctx = document.getElementById("myChart").getContext("2d");
             var optionsNoAnimation = { animation: false }
             this.chart = new Chart(ctx, {
                 type: 'line',
             });
             this.chart.Line(this.data, optionsNoAnimation)
         },
         updateChart(item) {
             if (this.data.datasets[0].data.length > 40)
             {
                this.data.datasets[0].data.shift();
              this.data.labels.shift();
             }
             this.data.labels.push(item.time);
             this.data.datasets[0].fill = false;
             this.data.datasets[0].data.push(Number(item.price));
             var optionsNoAnimation = {
                 animation: false
             }
             this.chart.Line(this.data, optionsNoAnimation)
         }

         //this.chart.options.data[0].dataPoints.push({ y: Number(item.price), x: item.time });
         // this.chart.render();
     };

     Simulator.init();
 }
