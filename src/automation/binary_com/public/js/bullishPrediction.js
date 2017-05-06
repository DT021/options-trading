const BullishPrediction = {
    predict(ticks) {
        if ( Main.isProposal || Main.pauseTrading) return;
        let previousTick = ticks[ticks.length-2];
        let currentTick = ticks[ticks.length-1];
        let highest = currentTick;
        let lowest = currentTick;
        let found= false;
        if (previousTick < currentTick) {
            proposal = 'CALL';
            predictionType = 'BULL_UP';
            found = true;
            highest = currentTick;
            lowest = previousTick;
        } else if (previousTick > currentTick) {
            proposal = 'PUT';
            predictionType = 'BULL_DOWN';
            found = true;
             highest = previousTick;
            lowest = currentTick;
        }

        if (found) {
            Main.currentTrendItem = {
                predictionType: predictionType,
                type: proposal
            };
            ChartComponent.updatePredictionChart([previousTick,currentTick], lowest, highest);
            Main.setPrediction(proposal, predictionType);
        }

        return found;
    }
}
