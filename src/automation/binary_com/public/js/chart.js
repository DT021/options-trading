let ChartComponent = {
    chart: null,
    pchart: null,
    config: {
        type: 'line',
        options: {
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        suggestedMin: 10,
                        fontColor: "white"

                    }
                }],
                xAxes: [{
                    display: true,
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
    predictionConfig: {
        type: 'line',
        options: {
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        fontColor: "white"

                    }
                }],
                xAxes: [{
                    display: true,
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
        //myChart.width = document.body.clientWidth; //document.width is obsolete
        //document.getElementById("myChart").height = document.body.clientHeight; //document.height is obsolete
        var ctx = myChart.getContext("2d");
        var optionsNoAnimation = { animation: false }
        this.chart = new Chart(ctx, this.config);

        var pctx = pChart.getContext("2d");
        this.pchart = new Chart(pctx, this.predictionConfig);
    },
    update(item) {
        this.config.data.labels.push(item.time);
        this.config.data.datasets[0].data.push(Number(item.price));
        if (this.config.data.datasets[0].data.length >= 40) {
            this.config.data.datasets[0].data.shift();
            this.config.data.labels.shift();
        }
        this.config.options.scales.yAxes[0].ticks.min = item.lowestPrice ? item.lowestPrice - 5 : 0;
        this.chart.update();
    },
    updatePredictionChart(collection,lowestPrice,highestPrice) {
         this.predictionConfig.data.labels = collection;
        this.predictionConfig.data.datasets[0].data = collection;
         if(lowestPrice)this.predictionConfig.options.scales.yAxes[0].ticks.min = lowestPrice - 5;
         //if(highestPrice)this.predictionConfig.options.scales.yAxes[0].ticks.max = highestPrice + 5;
         //this.predictionConfig.options.scales.yAxes[0].ticks.max = highestPrice + 1;
        this.pchart.update();
    }
};
