mocha.setup('bdd');

var expect = chai.expect;

describe("Stake", function() {
  describe("constructor", function() {
    let currentProfit = -1;
    for (let lossStreak = 1; lossStreak < 11;lossStreak++){
       it("profit should be " + currentProfit, function() {
        let profit = Math.abs(currentProfit);
      let stake = Math.ceil(profit + (profit * 0.06));
      expect(currentProfit * 2).to.equal(stake);
    });
    }
   

  });
});