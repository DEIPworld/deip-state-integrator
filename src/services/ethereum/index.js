const config = require('config');
const Web3 = require('web3');
const EthereumTx = require('ethereumjs-tx').Transaction;
const logger = require('logger');
const axios = require('axios');

const web3 = new Web3(new Web3.providers.HttpProvider(config.ethereum.rpcProvider));

const getCurrentETHPriceUSD = async () => {
  try {
    return axios
      .get('https://api.coincap.io/v2/rates/ethereum')
      .then(({ data }) => +data.data.rateUsd);
  } catch (err) {
    logger.error(err.stack);
    return undefined;
  }
};

module.exports.sendDataInTransaction = async (data) => {
  try {
    const rawTransaction = {
      from: config.ethereum.address,
      to: config.ethereum.address,
      data: web3.utils.toHex(data),
    };
    const [
      transactionsCount,
      recommendedGasPrice,
      estimatedGas,
      ethPriceUsd,
    ] = await Promise.all([
      web3.eth.getTransactionCount(config.ethereum.address, 'pending'),
      web3.eth.getGasPrice(),
      web3.eth.estimateGas(rawTransaction),
      getCurrentETHPriceUSD(),
    ]);
    const transactionPriceUSD = web3.utils.fromWei(recommendedGasPrice, 'ether') * estimatedGas * ethPriceUsd;
    if (!transactionPriceUSD || transactionPriceUSD > config.ethereum.priceLimitUSD) {
      logger.info(`Aborted: transaction price is ${transactionPriceUSD}`);
      return;
    }
    const transaction = new EthereumTx({
      ...rawTransaction,
      gasPrice: web3.utils.toHex(recommendedGasPrice),
      gas: web3.utils.toHex(estimatedGas),
      nonce: web3.utils.toHex(transactionsCount),
    }, {
      chain: config.ethereum.networkName,
    });
    transaction.sign(Buffer.from(config.ethereum.privateKey, 'hex'));
    const {
      gasUsed,
      transactionHash,
    } = await web3.eth.sendSignedTransaction(`0x${transaction.serialize().toString('hex')}`);
    logger.info(`Sent to Ethereum in transaction ${transactionHash}; Gas used: ${gasUsed}; Estimated transaction price: ${transactionPriceUSD.toFixed(6)}$`);
  } catch (err) {
    logger.error(err.stack);
  }
};
