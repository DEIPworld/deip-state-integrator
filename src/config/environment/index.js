const _ = require('lodash');

const envToEnvFileNameMap = {
  production: 'prod',
  development: 'dev',
  local: 'local',
};

const env = process.env.NODE_ENV || 'development';
const envFileName = envToEnvFileNameMap[env];
if (!envFileName) {
  console.error(`'${env}' environment isn't supported`);
  process.exit(1);
}

require('dotenv').config({
  path: `${__dirname}/.${envFileName}.env`,
});

const baseConfig = {
  environment: env,
  envFileName,
  isDev: env === 'development',
  isProd: env === 'production'
};

const config = _.merge(baseConfig, {
  forceRecurrenceRule: process.env.FORCE_RECURRENCE_RULE,
  deipBlockchain: {
    rpcEndpoint: process.env.DEIP_FULL_NODE_URL,
    chainId: process.env.DEIP_CHAIN_ID,
  },
  ethereum: {
    rpcProvider: process.env.ETHEREUM_RPC_PROVIDER,
    networkName: process.env.ETHEREUM_NETWORK_NAME,
    address: process.env.ETHEREUM_ADDRESS,
    privateKey: process.env.ETHEREUM_PRIVATE_KEY,
    priceLimitUSD: +process.env.ETHEREUM_PRICE_LIMIT_USD || 1.0,
  },
  bitcoin: {
    address: process.env.BITCOIN_ADDRESS,
    wif: process.env.BITCOIN_WIF,
    priceLimitUSD: process.env.BITCOIN_PRICE_LIMIT_USD || 1.0,
  },
});

module.exports = config;
