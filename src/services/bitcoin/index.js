const config = require('config');
const btc = require('bitcoinjs-lib');
const axios = require('axios');
const logger = require('logger');
const _ = require('lodash');

const network = btc.networks[config.isProd ? 'bitcoin' : 'testnet'];
const btcBlockchainProvider = `https://api.blockcypher.com/v1/btc/${config.isProd ? 'main' : 'test3'}`;

const getCurrentBTCPriceUSD = async () => {
  try {
    return axios
      .get('https://api.coincap.io/v2/rates/bitcoin')
      .then(({ data }) => +data.data.rateUsd);
  } catch (err) {
    logger.error(err.stack);
    return undefined;
  }
};

const getUTXOByAddress = async (address, minValue = Number.MAX_SAFE_INTEGER) => {
  try {
    const lastTx = await axios
      .get(`${btcBlockchainProvider}/addrs/${address}?unspentOnly=true`)
      .then(({ data }) => _.find(data.txrefs, tx => tx.tx_output_n > -1 && tx.value >= minValue));
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

const calcTxFee = async (output) => {
  const outputBuf = Buffer.from(output);
  const lowFeePerByte = await axios
    .get(btcBlockchainProvider)
    .then(({ data }) => Math.ceil(data.low_fee_per_kb / 1024));

  /**
   * https://bitcoin.stackexchange.com/questions/1195/how-to-calculate-transaction-size-before-sending-legacy-non-segwit-p2pkh-p2sh
   * for current purposes only 1 inputs and 2 outputs; also have to add embedded data size and fault
   * fault = 10 bytes per input + reserve (magic number)
   */
  const FAULT = 10 * 1 + 50;
  const txSize = 148 * 1 + 2 * 34 + FAULT + outputBuf.length;
  return txSize * lowFeePerByte;
};

module.exports.sendDataInTransaction = async (dataToSend) => {
  try {
    const keyPair = btc.ECPair.fromWIF(config.bitcoin.wif, network);

    const ecnodedData = Buffer.from(dataToSend, 'utf8');
    const { output } = btc.payments.embed({ data: [ecnodedData] });

    const [
      txFee,
      btcPriceUsd,
    ] = await Promise.all([
      calcTxFee(output),
      getCurrentBTCPriceUSD(),
    ]);
    const txPriceUsd = txFee * btcPriceUsd / 100000000; // txFee is in satoshis
    if (!txPriceUsd || txPriceUsd > config.bitcoin.priceLimitUSD) {
      logger.info(`Aborted: transaction fee is ${txPriceUsd}`);
      return;
    }
    const utxo = await getUTXOByAddress(config.bitcoin.address, txFee);
    if (!utxo) {
      throw new Error(`Invalid utxo value for ${config.bitcoin.address} btc address`);
    }
    const psbt = new btc.Psbt({ network })
      .addInput({
        hash: utxo.hash,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(utxo.hex, 'hex'),
      })
      .addOutput({
        script: output,
        value: 0,
      })
      .addOutput({
        address: config.bitcoin.address,
        value: utxo.value - txFee,
      })
      .signInput(0, keyPair);
    psbt.finalizeAllInputs();

    const rawTransaction = psbt.extractTransaction().toHex();
    const { data } = await axios.post(`${btcBlockchainProvider}/txs/push`, JSON.stringify({ tx: rawTransaction }));
    logger.info(`Sent to Bitcoin in transaction ${data.tx.hash}; Fee: ${txPriceUsd}$`);
  } catch (err) {
    logger.error(err.stack);
  }
};
