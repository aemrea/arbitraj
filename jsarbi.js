cglobal.fetch = require("node-fetch");

var Arbitraj = {

    baseList: ['TRY', 'USDT'],
    kryptoKryptoComm: 0.0005,
    kryptoTryComm: 0.001,
    showAboveRatio: 1.002,
    showCount: 1,

    p1p: 0,
    p2p: 0,
    p3p: 0,
    p1e: "c",
    p2e: "c",
    p3e: "c",

    realData: [],

    possiblePaths: [],
    profitList: [],
    processing: false,
    createProfitList: function () {
        _this = this;
        _this.profitList = [];

        _this._fillPrices();
        _this._calculateRatios();


        _this.profitList.sort(function (a, b) {
            return b.ratio - a.ratio;
        });
    },

    _getPrice: function (path, ind) {
        let price = (path["d" + ind.toString()] ? (1 / path["ask" + ind.toString()]) : path["bid" + ind.toString()]);
        //console.log(price - (price * path["comm" + ind.toString()]));
        // console.log(price +" "+ emirTuru);
        if(ind==1)this.p1p = price;
        else if(ind==2)this.p2p = price;
        else if(ind==3)this.p3p = price;
        return price - (price * path["comm" + ind.toString()]);
    },
    _calculateRatios: function () {
        for (let pathRowInd = 0; pathRowInd < this.possiblePaths.length; pathRowInd++) {
            let path = this.possiblePaths[pathRowInd];
            path.ratio = this._getPrice(path, 1) * this._getPrice(path, 2) * this._getPrice(path, 3);

            //TODO:ProfitList burada doluyor
            //Emir burada girilecek
            // if (element.ratio > this.showAboveRatio) {
            //
            // }

            this.profitList.push({
                "path": path.p1 + " " + (path["d1"] ? "a" : "b") + " > "
                    + path.p2 + " " + (path["d2"] ? "a" : "b") + " > "
                    + path.p3 + " " + (path["d3"] ? "a" : "b"),
                "ratio": path.ratio,
                "p1e": (path["d1"] ? "a" : "b"),
                "p2e": (path["d2"] ? "a" : "b"),
                "p3e": (path["d3"] ? "a" : "b"),
                "p1p":this.p1p,
                "p2p":this.p2p,
                "p3p":this.p3p
            });
        }
    },
    _fillPrices: function () {
        for (let i = 0; i < this.realData.length; i++) {
            let data = this.realData[i];

            for (let pathRowInd = 0; pathRowInd < this.possiblePaths.length; pathRowInd++) {
                let path = this.possiblePaths[pathRowInd];


                for (let pathColInd = 1; pathColInd < 4; pathColInd++) {
                    let parityIndex = "p" + pathColInd.toString();
                    let paydaIndex = "d" + pathColInd.toString();

                    if (path[parityIndex] == data.pair) {
                        if (path[paydaIndex])
                            path["ask" + pathColInd.toString()] = data.ask;
                        else
                            path["bid" + pathColInd.toString()] = data.bid;


                        path["comm" + pathColInd.toString()] = data.numeratorSymbol == "TRY" || data.denominatorSymbol == "TRY" ? this.kryptoTryComm : this.kryptoKryptoComm;
                    }
                }
            }
        }
    },
    _createPossiblePaths: function () {
        _this = this;
        _this.possiblePaths = [];


        for (let b = 0; b < this.baseList.length; b++) {
            let basePair = this.baseList[b];

            for (let i1 = 0; i1 < this.realData.length; i1++) {
                let data1 = this.realData[i1];


                if (data1.denominatorSymbol != basePair &&
                    data1.numeratorSymbol != basePair) continue;
                let node = {
                    'b1': basePair,
                    'p1': data1.pair,
                    'd1': data1.denominatorSymbol == basePair,
                    'b2': data1.denominatorSymbol == basePair ?
                        data1.numeratorSymbol : data1.denominatorSymbol
                };

                for (let i2 = 0; i2 < this.realData.length; i2++) {
                    let data2 = this.realData[i2];
                    let foundPath = false;


                    if (data2.denominatorSymbol != node.b2 &&
                        data2.numeratorSymbol != node.b2) continue;

                    if (data2.denominatorSymbol == node.b1 ||
                        data2.numeratorSymbol == node.b1) continue;

                    node['p2'] = data2.pair;
                    node['d2'] = data2.denominatorSymbol == node.b2;
                    node['b3'] = data2.denominatorSymbol == node.b2 ?
                        data2.numeratorSymbol : data2.denominatorSymbol;

                    for (let i3 = 0; i3 < this.realData.length; i3++) {
                        let data3 = this.realData[i3];


                        if ((data3.denominatorSymbol == node.b1 &&
                            data3.numeratorSymbol == node.b3) ||
                            (data3.denominatorSymbol == node.b3 &&
                                data3.numeratorSymbol == node.b1)
                        ) {

                            node['p3'] = data3.pair;
                            node['d3'] = data3.denominatorSymbol == node.b3;

                            _this.possiblePaths.push(node);

                            foundPath = true;
                            break;
                        }
                    }


                    if (foundPath == true) break;
                }
            }
        }
    },
    _printInformation: function () {
        console.log('*********************************************');
        console.log('Krypto Krypto Comm: ' + _this.kryptoKryptoComm);
        console.log('Krypto Try Comm: ' + _this.kryptoTryComm);
        console.log('Show Above Ratio: ' + _this.showAboveRatio);
        console.log('*********************************************');
    },
    _printToConsole: function () {
        for (let index = 0; index < _this.profitList.length; index++) {
            const element = _this.profitList[index];
            console.log(element.path + " | Ratio: " + element.ratio.toFixed(5));
        }
        console.log('*********************************************');
        console.log("Olası tüm senaryoların sayısı: " + _this.profitList.length.toString());
        console.log('*********************************************');
    },
    _continuousDataToConsole: function () {
        let limit = this.showCount < 1 ? _this.profitList.length : this.showCount;

        for (let index = 0; index < limit; index++) {
            const element = _this.profitList[index];

            if (element.ratio > this.showAboveRatio) {
                //TODO: Otomatik emir girişi

                console.log(element.path + " | Ratio: " + element.ratio.toFixed(5) + " ==> 10.000 TL için kazanç ==> " + ((10000 * (element.ratio)) - 10000).toFixed(2));
                console.log(element.p1e + " ==> " + element.p2e + " ==> " + element.p3e);
                console.log(element.p1p + " ==> " + element.p2p + " ==> " + element.p3p);
            }
        }
    },
    _init: function (isContinuous) {
        _this = this;
        _this.processing = true;

        fetch('https://api.btcturk.com/api/v2/ticker')
            .then(response => response.json())
            .then(data => {
                _this.realData = data.data;

                if (_this.possiblePaths.length < 1) _this._createPossiblePaths();

                _this.createProfitList();
                if (isContinuous)
                    _this._continuousDataToConsole();
                else
                    _this._printToConsole();

                _this.processing = false;
            })
            .catch(function () {
                console.error('https://api.btcturk.com/api/v2/ticker veri çekerken hata aldım.');
                _this.processing = false;
            });
    },
    BtcTicker: function () {
        console.clear();
        console.log(this.realData);
    },
    PossiblePaths: function () {
        console.clear();
        console.log(this.possiblePaths);
    },
    TumVeri: function () {
        console.clear();
        this._init();
    },
    SurekliVeri: function () {
        _this = this;
        console.clear();
        _this._printInformation();

        setInterval(function () {
            if (!_this.processing)
                _this._init(true);
        }, 100);
    }
}


Arbitraj.SurekliVeri();
