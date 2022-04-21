# CryptoInvestor
## App usage
clone the repository and install the packages in package.json

make Sure the transactions.csv is on the same directory as the project

### cmd parameters
Given a date and a token, return the portfolio value of that token in USD on that date
node .\index.js --date=7/3/2021 --token=BTC

Given a date, return the portfolio value per token in USD on that date
node .\index.js --date=7/3/2021


Given a token, return the latest portfolio value for that token in USD
node .\index.js --token=BTC

Given no parameters, return the latest portfolio value per token in USD
node .\index.js

## Design approach
I used promises for asynchronous coding and easy error catching

I used the papaparse library since the fastest recommended CSV editor from the performance benchmarks

I used the yargs library for easy cmd parameters fetching
