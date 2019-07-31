const config = require('config');
const Web3 = require('web3');
const EthereumTx = require('ethereumjs-tx').Transaction;
const logger = require('logger');

const web3 = new Web3(new Web3.providers.HttpProvider(config.ethereum.rpcProvider));

module.exports.sendDataInTransaction = async (data) => {
  try {
    const transactionsCount = await web3.eth.getTransactionCount(config.ethereum.address);
    const transaction = new EthereumTx({
      from: config.ethereum.address,
      to: config.ethereum.address,
      data: web3.utils.toHex(data),
      gasPrice: web3.utils.toHex(web3.utils.toWei(config.ethereum.gasPrice, 'gwei')),
      gas: web3.utils.toHex(config.ethereum.gasLimit),
      nonce: web3.utils.toHex(transactionsCount),
    }, {
      chain: config.ethereum.networkName,
    });
    transaction.sign(Buffer.from(config.ethereum.privateKey, 'hex'));
    const {
      gasUsed,
      transactionHash,
    } = await web3.eth.sendSignedTransaction(`0x${transaction.serialize().toString('hex')}`);
    logger.info(`Sent to Ethereum in transaction ${transactionHash};\nData: ${data}\nGas used: ${gasUsed}`);
  } catch (err) {
    logger.error(err.stack);
  }
};
