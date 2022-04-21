var request = require("request");
const args = require('yargs').argv;
const papa = require('papaparse');


var cryptoCompare;
var usdValues;

// function to get the latest portfolio value per token in USD
var getLatestValPerTokenInUSD = function (lookOnCSV = true) {
    return new Promise(function (resolve) {

        var output = [];

        var btcOutputArr = { "token": "BTC", "amount": 0, "timestamp": 0 };
        var ethOutputArr = { "token": "ETH", "amount": 0, "timestamp": 0 };
        var xrpOutputArr = { "token": "XRP", "amount": 0, "timestamp": 0 };

        papa.parse(require('fs').createReadStream('transactions.csv'), {
            worker: true, // Don't bog down the main thread if its a big file
            step: function (result) {
                var fromLine = {};
                fromLine.timestamp = result.data[0];
                fromLine.transaction_type = result.data[1];
                fromLine.token = result.data[2];
                fromLine.amount = result.data[3];

                if (fromLine.token === 'ETH') {
                    if (fromLine.timestamp > ethOutputArr.timestamp) {
                        ethOutputArr.amount = fromLine.amount;
                        ethOutputArr.timestamp = fromLine.timestamp;
                    }
                }
                else if (fromLine.token === 'BTC') {
                    if (fromLine.timestamp > btcOutputArr.timestamp) {
                        btcOutputArr.amount = fromLine.amount;
                        btcOutputArr.timestamp = fromLine.timestamp
                    }
                }
                else if (fromLine.token === 'XRP') {
                    if (fromLine.timestamp > xrpOutputArr.timestamp) {
                        xrpOutputArr.amount = fromLine.amount;
                        xrpOutputArr.timestamp = fromLine.timestamp;
                    }
                }
            },
            complete: function (results, file) {
                cryptoCompare = getUSDValues();
                cryptoCompare.then(function (result) {
                    usdValues = result;
                    ethOutputArr.amount = ethOutputArr.amount * usdValues.ETH.USD;
                    btcOutputArr.amount = btcOutputArr.amount * usdValues.ETH.USD;
                    xrpOutputArr.amount = xrpOutputArr.amount * usdValues.ETH.USD;

                    output.push(ethOutputArr);
                    output.push(btcOutputArr);
                    output.push(xrpOutputArr);
                    resolve(output);
                }, function (err) {
                    console.log(err);
                })
            }
        });
    });
}
//function to get the portfolio value per token in USD
var getPortfolioValPerToken = function () {
    return new Promise(function (resolve) {

        var output = [];

        var btcOutputArr = [];
        var ethOutputArr = [];
        var xrpOutputArr = [];

        papa.parse(require('fs').createReadStream('transactions.csv'), {
            worker: true, // Don't bog down the main thread if its a big file
            step: function (result) {
                var fromLine = {};
                fromLine.timestamp = result.data[0];
                fromLine.transaction_type = result.data[1];
                fromLine.token = result.data[2];
                fromLine.amount = result.data[3];
                //converting date from timestamp
                var d = new Date(fromLine.timestamp * 1000);
                var dateFromCSV = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
                if (fromLine.token === 'ETH') {
                    if (args.date === dateFromCSV) {
                        ethOutputArr.push({ "token": fromLine.token, "amount": fromLine.amount * usdValues.ETH.USD })
                    }
                } else if (fromLine.token === 'BTC') {
                    if (args.date === dateFromCSV) {
                        btcOutputArr.push({ "token": fromLine.token, "amount": fromLine.amount * usdValues.ETH.USD })
                    }
                }
                else if (fromLine.token === 'XRP') {
                    if (args.date === dateFromCSV) {
                        xrpOutputArr.push({ "token": fromLine.token, "amount": fromLine.amount * usdValues.ETH.USD })
                    }
                }
            },
            complete: function (results, file) {
                output.push(ethOutputArr);
                output.push(btcOutputArr);
                output.push(xrpOutputArr);
                resolve(output);
            }
        });

    });
}

// function to fetch the crypto Values from CryptoCompare
function getUSDValues() {

    var cryptoURL = 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH,DASH&tsyms=BTC,USD,EUR&api_key=b9c4d1e4f0153838aeefb09d98f4c3d7a158ad7b14c64039e859afafc652243c';

    var options = {
        url: cryptoURL,
        headers: {
            'User-Agent': 'request'
        }
    };
    // Return new promise 
    return new Promise(function (resolve, reject) {
        request.get(options, function (err, resp, body) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(body));
            }
        })
    })

}

function filterByProperty(array, prop, value) {
    var filtered = [];
    for (var i = 0; i < array.length; i++) {
        var obj = array[i];
        for (var key in obj) {
            if (typeof (obj[key] == "object")) {
                var item = obj[key];
                if (item[prop] == value) {
                    filtered.push(item);
                }
            }
        }
    }

    return filtered;

}

//functions based on the type of the cmd parameters 
if (args.token === undefined && args.date === undefined) {
    console.log("Loading the latest portfolio value per token in USD");
    getLatestValPerTokenInUSD().then(function (result) {
        console.log(result);
    });
}
else if (args.token != undefined && args.date === undefined) {
    console.log("Loading the latest portfolio value for that token in USD");
    getLatestValPerTokenInUSD().then(function (result) {
        var resultPerToken = result.filter(function (record) {
            return record.token === args.token;
        })
        console.log(resultPerToken);
    });
}
else if (args.date != undefined && args.token === undefined) {
    console.log("Loading the portfolio value per token in USD on that date");
    cryptoCompare = getUSDValues();
    cryptoCompare.then(function (result) {
        usdValues = result;
        getPortfolioValPerToken().then(function (result) { console.log(result); });
    }, function (err) {
        console.log(err);
    })

}
else if (args.token != undefined && args.date != undefined) {
    console.log("Given a date of" + args.date + " and a" + args.token+" token, return the portfolio value of that token in USD on that date");
    cryptoCompare = getUSDValues();
    cryptoCompare.then(function (usdVal) {
        usdValues = usdVal;
        getPortfolioValPerToken().then(function (result) {

            var resultPerToken = filterByProperty(result, "token", args.token);
            console.log(resultPerToken);
        });
    }, function (err) {
        console.log(err);
    })
}
