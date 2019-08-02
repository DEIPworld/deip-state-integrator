const _ = require('lodash');

const envToEnvFileNameMap = {
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
};

const config = _.merge(baseConfig, {
  deipBlockchain: {
    rpcEndpoint: process.env.DEIP_FULL_NODE_URL,
    chainId: process.env.DEIP_CHAIN_ID,
  },
  ethereum: {
    rpcProvider: process.env.ETHEREUM_RPC_PROVIDER,
    networkName: process.env.ETHEREUM_NETWORK_NAME,
    address: process.env.ETHEREUM_ADDRESS,
    privateKey: process.env.ETHEREUM_PRIVATE_KEY,
  },
  bitcoin: {
    address: process.env.BITCOIN_ADDRESS,
    wif: process.env.BITCOIN_WIF,
  },
});

module.exports = config;
