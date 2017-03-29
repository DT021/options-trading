 window.onload = function() {

     var Simulator = {
         dayCollection: [],
         dropdown: null,
         prevoiusTick: null,
         currentTick: null,
         direction: '',
         nextContract: null,
         contractStarted: false,
         currentTickCount: 0,
         strategyCode: null,
         numberOfWins: 0,
         numberOfLoses: 0,
         currentBalance: 0,
         contractPurchasePrice: 0,
         isWin: 0,
         ws: null,
         config: {
             type: 'line',
             options: {
                 scales: {
                     yAxes: [{
                         display: true,
                         ticks: {
                             suggestedMin: 10,

                         }
                     }],
                     xAxes: [{
                         display: true,
                         scaleLabel: {
                             display: true,
                             labelString: 'Time'
                         }
                     }],
                 }
             },
             data: {
                 labels: [],
                 datasets: [{
                     label: "Options Trading Simulator",
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
             switch (obj.key) {
                 case 'days':
                     this.dayCollection = obj.data;
                     this.populatingDaysDropdown();
                     break;
                 case 'tick':
                     this.setTickChange(obj.data);
                     if (this.strategyCode) this.nextContract = this.strategyCode.run(obj.data);
                     this.checkContract(obj.data);
                     this.updateChart(obj.data);
                     break;
                 case 'end':
                     this.tickEnd();
                     break;
             }
         },
         onRunClicked() {
             this.run();
         },
         tickEnd() {
             console.log('number of wins', this.numberOfWins);
             console.log('number of loses', this.numberOfLoses);
             console.log('Balance', this.currentBalance);
         },
         setupStrategy() {
             this.numberOfWins = 0;
             this.numberOfLoses = 0;
             this.currentBalance = 0;
             this.strategyCode = this.testCode().raiseStrategy;
             this.currentBalance = this.strategyCode.balance;
         },
         setTickChange(obj) {
             this.prevoiusTick = this.currentTick;
             this.currentTick = obj.price;
             this.direction = '';
             if (this.prevoiusTick > this.currentTick) {
                 this.direction = 'fall';
             } else if (this.prevoiusTick < this.currentTick) {
                 this.direction = 'raise';
             }
         },
         populatingDaysDropdown() {
             this.dropdown = document.querySelector('#days-dropdown');
             this.dayCollection.forEach(function(item, index) {
                 let optionElement = document.createElement('option');
                 optionElement.value = index;
                 optionElement.innerHTML = item;
                 this.dropdown.appendChild(optionElement);
             }.bind(this));
         },
         run() {
             this.endContract();
             this.setupStrategy();
             this.send('run', this.dayCollection[this.dropdown.selectedIndex]);
             this.config.data.datasets[0].data = [];
             this.chart.update();
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
         },
         updateChart(item) {
             /*
              if (this.config.data.datasets[0].data.length > 40) {
                  this.config.data.datasets[0].data.shift();
                  this.config.data.labels.shift();
              }
              */
             this.config.data.labels.push(item.time);
             this.config.data.datasets[0].data.push(Number(item.price));
             this.chart.update();
         },
         checkContract(item) {
             if (this.nextContract && !this.contractStarted) {
                 this.contractPurchasePrice = item.price;
                 this.contractStarted = true;
                 this.currentTickCount = 0;
             } else if (this.nextContract) {
                 this.currentTickCount++;
                 if (this.currentTickCount >= this.nextContract.tickDuration) {
                     this.trade(item.price);
                     this.endContract();
                 }
             }

         },
         endContract() {
             this.contractStarted = false;
             this.currentTickCount = 0;
             this.nextContract = null;
             if (this.strategyCode) this.strategyCode.end({
                 balance: this.currentBalance,
                 isWin: this.isWin
             });
         },
         trade(price) {
             if (this.nextContract.type == 'raise' && this.contractPurchasePrice < price || this.nextContract.type == 'fall' && this.contractPurchasePrice > price) {
                 console.log('contract won');
                 this.numberOfWins++;
                 this.currentBalance += this.nextContract.stake + (this.nextContract.stake * this.nextContract.payoutPercentage);
                 this.isWin = true;
             } else {
                 console.log('contract losed');
                 this.numberOfLoses++;
                 this.currentBalance -= this.nextContract.stake;
                 this.isWin = false;
             }
             console.log('balance', this.currentBalance.toFixed(2));
         },
         testCode() {
             return {
                 timeStrategy: {
                     balance: 100,
                     currentBalance: 100,
                     balanceBenchmark:100,
                     previous: 0,
                     lastResultIsWin: false,
                     run(item) {
                         let date = new Date();
                         let contract;
                         date.setHours(item.time.split(':')[0]);
                         date.setMinutes(item.time.split(':')[2]);
                         if (this.currentBalance <= 20) {
                             return;
                         }
                         if (date.getHours() == 8 && date.getMinutes() > 30 && this.previous > item.price) {
                             contract = {
                                 type: 'fall',
                                 tickDuration: 5,
                                 stake: 20,
                                 payoutPercentage: 0.81
                             }
                         } else if (date.getHours() == 9 && date.getMinutes() < 30 && this.previous < item.price) {
                             contract = {
                                 type: 'raise',
                                 tickDuration: 5,
                                 stake: 20,
                                 payoutPercentage: 0.81
                             }
                         } else if (date.getHours() == 10 && date.getMinutes() < 30 && this.previous < item.price) {
                             contract = {
                                 type: 'raise',
                                 tickDuration: 5,
                                 stake: 20,
                                 payoutPercentage: 0.81
                             }
                         } else if (date.getHours() == 10 && date.getMinutes() > 30 && this.previous > item.price) {
                             contract = {
                                 type: 'fall',
                                 tickDuration: 5,
                                 stake: 20,
                                 payoutPercentage: 0.81
                             }
                         }
                         this.previous = item.price;
                         return contract;

                     },
                     end(obj) {
                         this.currentBalance = obj.balance;
                         this.lastResultIsWin = obj.isWin;

                     }
                 },
                 raiseStrategy: {
                     balance: 100,
                     currentBalance: 100,
                     previous: null,
                     lastResultIsWin: false,
                     raiseCount: 0,
                     run(item) {
                         let date = new Date();
                         let contract;
                         date.setHours(item.time.split(':')[0]);
                         date.setMinutes(item.time.split(':')[2]);
                         if (this.currentBalance <= 20) {
                             return;
                         }
                         console.log(this.currentBalance % 100);
                         if (this.previous) {
                             if (this.previous < item.price) {
                                 this.raiseCount++;
                             } else {
                                 this.raiseCount = 0;
                             }

                             if (this.raiseCount == 2) {
                                 contract = {
                                     type: 'raise',
                                     tickDuration: 5,
                                     stake: 20,
                                     payoutPercentage: 0.81
                                 }
                                 this.raiseCount = 0;
                             }
                         }
                         this.previous = item.price;
                         return contract;

                     },
                     end(obj) {
                         this.currentBalance = obj.balance;
                         this.lastResultIsWin = obj.isWin;

                     }
                 }
             };
         }
     };

     Simulator.init();
 }
