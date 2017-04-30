let ChartComponent = {
    chart: null,
    pchart: null,
    config: {
        type: 'line',
        options: {
            title:{
                display:false
            },
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        fontColor: "white"

                    }
                }],
                xAxes: [{
                    display: false,
                    scaleLabel: {
                        display: true,
                        labelString: 'Time',
                        fontColor: "white",
                    }
                }],
            }
        },
        data: {
            labels: [],
            datasets: [{
                label: "Options Trading",
                fill: false,
                lineTension: 0,
                backgroundColor: "rgba(75,192,192,0.4)",
                borderColor: "rgba(75,192,192,1)",
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: "rgba(75,192,192,1)",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 0.5,
                pointHoverRadius: 0.5,
                pointHoverBackgroundColor: "rgba(75,192,192,1)",
                pointHoverBorderColor: "rgba(220,220,220,1)",
                pointHoverBorderWidth: 0.5,
                pointRadius: 0,
                pointHitRadius: 2,
                spanGaps: false,
                steppedLine: false,
                borderWidth: 0.5,
                data: []
            }]
        }

    },
    closeConfig: {
        type: 'line',
        options: {
            title:{
                display:false
            },
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        fontColor: "white"

                    }
                }],
                xAxes: [{
                    display: false,
                    scaleLabel: {
                        display: true,
                        labelString: 'Time',
                        fontColor: "white",
                    }
                }],
            }
        },
        data: {
            labels: [],
            datasets: [{
                label: "Options Trading",
                fill: false,
                lineTension: 0,
                backgroundColor: "rgba(75,192,192,0.4)",
                borderColor: "rgba(75,192,192,1)",
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: "rgba(75,192,192,1)",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 0.5,
                pointHoverRadius: 0.5,
                pointHoverBackgroundColor: "rgba(75,192,192,1)",
                pointHoverBorderColor: "rgba(220,220,220,1)",
                pointHoverBorderWidth: 0.5,
                pointRadius: 0,
                pointHitRadius: 2,
                spanGaps: false,
                steppedLine: false,
                borderWidth: 0.7,
                data: []
            }]
        }

    },
    predictionConfig: {
        type: 'line',
        options: {
            title:{
                display:false
            },
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        fontColor: "white"

                    }
                }],
                xAxes: [{
                    display: false,
                    scaleLabel: {
                        display: true,
                        labelString: 'Time',
                        fontColor: "white",
                    }
                }],
            }
        },
        data: {
            labels: [],
            datasets: [{
                label: "Options Trading",
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
    create() {
        let myChart = document.getElementById("myChart");
        let pChart = document.getElementById("pChart");
        let closeChart = document.getElementById("closeChart");
        //myChart.width = document.body.clientWidth; //document.width is obsolete
        //document.getElementById("myChart").height = document.body.clientHeight; //document.height is obsolete
        var ctx = myChart.getContext("2d");
        var optionsNoAnimation = { animation: false }
        this.chart = new Chart(ctx, this.config);

        var pctx = pChart.getContext("2d");
        this.pchart = new Chart(pctx, this.predictionConfig);
        if (closeChart) {
            var cctx = closeChart.getContext("2d");
            this.closechart = new Chart(cctx, this.closeConfig);
        }

    },
    setCloseData(collection) {
        this.closeConfig.data.labels = collection.concat([]);
        this.closeConfig.data.datasets[0].data = collection.concat([]);;
        this.closechart.update();
    },
    setData(collection) {
        this.config.data.labels = collection.concat([]);;
        this.config.data.datasets[0].data = collection.concat([]);;
        this.chart.update();
    },
    update(item) {
        this.config.data.labels.push(Number(item.price));
        this.config.data.datasets[0].data.push(Number(item.price));
        if (this.config.data.datasets[0].data.length >= 200) {
            this.config.data.datasets[0].data.shift();
            this.config.data.labels.shift();
        }
        this.config.options.scales.yAxes[0].ticks.min = item.lowestPrice ? item.lowestPrice - 20 : 0;
        this.chart.update();
    },
    updateClose(item) {
        this.closeConfig.data.labels.push(Number(item.price));
        this.closeConfig.data.datasets[0].data.push(Number(item.price));
        if (this.closeConfig.data.datasets[0].data.length >= 30) {
            this.closeConfig.data.datasets[0].data.shift();
            this.closeConfig.data.labels.shift();
        }
        this.closeConfig.options.scales.yAxes[0].ticks.min = item.lowestPrice ? item.lowestPrice - 10 : 0;
        this.closechart.update();
    },
    updatePredictionChart(collection, lowestPrice, highestPrice) {
        this.predictionConfig.data.labels = collection.concat([]);
        this.predictionConfig.data.datasets[0].data = collection.concat([]);
        if (lowestPrice) this.predictionConfig.options.scales.yAxes[0].ticks.min = lowestPrice - 5;
        //if(highestPrice)this.predictionConfig.options.scales.yAxes[0].ticks.max = highestPrice + 5;
        //this.predictionConfig.options.scales.yAxes[0].ticks.max = highestPrice + 1;
        this.pchart.update();
    }
};
