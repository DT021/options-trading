const Tester = {
    isTesting: false,
    testBalance: false,
    assetArray: [],
    stake: 0.5,
    currentStake: 0.5,
    startBalance: 700,
    balance: 700,
    history: [
        "11906.28",
        "11905.66",
        "11907.54",
        "11908.13",
        "11909.92",
        "11907.19",
        "11905.98",
        "11903.04",
        "11909.79",
        "11907.88",
        "11910.39",
        "11913.68",
        "11912.08",
        "11908.07",
        "11901.80",
        "11900.20",
        "11898.24",
        "11896.87",
        "11898.40",
        "11900.36",
        "11902.39",
        "11900.25",
        "11899.77",
        "11901.48",
        "11896.74",
        "11896.05",
        "11893.85",
        "11894.90",
        "11891.04",
        "11892.98",
        "11891.30",
        "11892.27",
        "11891.54",
        "11890.14",
        "11895.66",
        "11895.67",
        "11896.68",
        "11898.69",
        "11900.94",
        "11901.90",
        "11904.00",
        "11908.76",
        "11909.67",
        "11915.23",
        "11916.95",
        "11917.82",
        "11918.49",
        "11919.91",
        "11920.65",
        "11922.96",
        "11923.69",
        "11924.58",
        "11935.18"
    ],
    ws: {
        send(str) {
            let data = JSON.parse(str);
            console.log(data);
            if (data.proposal) {
                Tester.currentStake = data.amount;
                Tester.send({
                    msg_type: 'proposal',
                    proposal: {
                        payout: 1.94,
                        id: 1232323232,
                    }
                });
            }
        }
    },
    start() {
        if (this.testBalance) {
            this.balance = Storage.get(Storage.keys.balance) ? Number(Storage.get(Storage.keys.balance)) : this.startBalance;
            this.startBalance = this.balance;
        }
        if (!this.isTesting) return;
        Main.ws = this.ws;
        Main.assetArray = this.assetArray;
        Main.startBalance = this.balance;
        Main.accountBalance = this.balance;
       
    },
    predict(){
         this.send({
            msg_type: 'balance',
            balance: {
                balance: this.balance,
            }
        });
        this.send({
            msg_type: 'history',
            history: {
                prices: this.history,
                times: []
            }
        });
        this.send({
            msg_type: 'tick',
            tick: {
                quote: '11940.28',
                epoch: 12121212
            }
        });
    },
    setBalance(profit) {
        console.log('setBalance', profit);
        if (!this.startBalance) this.startBalance = this.balance;
        this.balance = this.balance + profit;
        Main.startBalance = this.startBalance;
        Main.balance = this.balance;
        View.updateBalance(this.balance, profit);
    },
    storeBalance() {
        if (this.testBalance) {
            Storage.setBalance(this.balance);
        }
    },
    setLoss() {
        Main.getPriceProposal('CALL');
        this.balance -= Main.currentStake;
        this.send({
            msg_type: 'balance',
            balance: {
                balance: this.balance,
            }
        });
        this.send({
            msg_type: 'transaction',
            transaction: {
                amount: '0.00',
                action: 'sell'
            }
        });
        console.log('loss', Main.currentStake)

    },
    setLossWithoutTransaction(){
        Main.getPriceProposal('CALL');
        this.balance -= Main.currentStake;
        this.send({
            msg_type: 'transaction',
            transaction: {
                amount: '0.00',
                action: 'buy'
            }
        });
        this.send({
            msg_type: 'balance',
            balance: {
                balance: this.balance,
            }
        });
        
        
    },
    setWin() {

        Main.getPriceProposal('CALL');

        this.balance += Main.currentStake + (Main.currentStake * 0.94);
        this.send({
            msg_type: 'balance',
            balance: {
                balance: this.balance,
            }
        });
        this.send({
            msg_type: 'transaction',
            transaction: {
                amount: '1.00',
                action: 'sell'
            }
        });
    },
    closeAndOpenConnection() {
        Main.onClose();
    },
    loseConnection() {
        Main.authorize();
    },
    send(value) {
        Main.onMessage({
            data: JSON.stringify(value)
        });
    }
};
