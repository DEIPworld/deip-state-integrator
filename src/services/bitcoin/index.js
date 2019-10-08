const config = require('config');
const btc = require('bitcoinjs-lib');
const axios = require('axios');
const logger = require('logger');
const _ = require('lodash');

const network = btc.networks[config.isDev ? 'testnet' : 'bitcoin'];
const btcBlockchainProvider = `https://api.blockcypher.com/v1/btc/${config.isDev ? 'test3' : 'main'}`;
const FEE = 2000;

const getUTXOByAddress = async (address) => {
  try {
    const lastTx = await axios
      .get(`${btcBlockchainProvider}/addrs/${address}?unspentOnly=true`)
      .then(({ data }) => _.find(data.txrefs, tx => tx.tx_output_n > -1 && tx.value >= FEE));
    if (!lastTx) return null;

    const txHex = await axios
      .get(`${btcBlockchainProvider}/txs/${lastTx.tx_hash}?includeHex=true`)
      .then(({ data }) => data.hex);

    return {
      hash: lastTx.tx_hash,
      vout: lastTx.tx_output_n,
      value: lastTx.value,
      hex: txHex,
    };
  } catch (err) {
    logger.error(err.stack);
    return null;
  }
};

const buildTransactionHex = async (data) => {
  const utxo = await getUTXOByAddress(config.bitcoin.address);
  if (!utxo) {
    throw new Error(`Invalid utxo value for ${config.bitcoin.address} btc address`);
  }
  const keyPair = btc.ECPair.fromWIF(config.bitcoin.wif, network);

  const ecnodedData = Buffer.from(data, 'utf8');
  const embed = btc.payments.embed({ data: [ecnodedData] });

  const psbt = new btc.Psbt({ network })
    .addInput({
      hash: utxo.hash,
      index: utxo.vout,
      nonWitnessUtxo: Buffer.from(utxo.hex, 'hex'),
    })
    .addOutput({
      script: embed.output,
      value: 0,
    })
    .addOutput({
      address: config.bitcoin.address,
      value: utxo.value - FEE,
    })
    .signInput(0, keyPair);
  psbt.finalizeAllInputs();

  return psbt.extractTransaction().toHex();
};

const sendRawTransaction = async (tx) => {
  try {
    const { data } = await axios.post(`${btcBlockchainProvider}/txs/push`, JSON.stringify({ tx }));
    logger.info(`Sent to Bitcoin in transaction ${data.tx.hash}`);
  } catch (err) {
    logger.error(err.stack);
  }
};

module.exports.sendDataInTransaction = async (data) => {
  try {
    const tx = await buildTransactionHex(data);
    await sendRawTransaction(tx);
  } catch (err) {
  }
};
