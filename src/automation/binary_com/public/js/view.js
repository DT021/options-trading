let View = {
  previousPrediction:'put',
  profitClass:'call',
  init(){
    this.winElement = document.querySelector('#wins');
    this.loseElement = document.querySelector('#loses');
    this.balanceElement = document.querySelector('#balance');
    this.profitElement = document.querySelector('#profit');
    this.predictionElement = document.querySelector('#prediction');
    this.endedElement = document.querySelector('#ended');
  },
  updateCounts(wins,loses){
    this.winElement.textContent = wins;
    this.loseElement.textContent = loses;
  },
  ended(){
    this.endedElement.textContent = 'true';
  },
  updateBalance(balance,profit){
    this.balanceElement.textContent = balance;
    this.profitElement.textContent = profit.toFixed(2);
    this.profitElement.parentNode.parentNode.classList.remove(this.profitClass);
    this.profitElement.parentNode.parentNode.classList.add(profit > 0 ? 'positive' : 'negative');
  },
  updatePrediction(prediction){
    this.predictionElement.textContent = prediction + (prediction ? '(' + (prediction == 'PUT' ? 'FALL' : 'RAISE') + ')' :'');
    this.predictionElement.parentNode.parentNode.classList.remove(this.previousPrediction);
    if(prediction)this.predictionElement.parentNode.parentNode.classList.add(prediction.toLowerCase());
    if(prediction)this.previousPrediction = prediction.toLowerCase();
  }
};