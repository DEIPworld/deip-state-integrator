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
    toAddress: process.env.ETHEREUM_TO_ADDRESS,
    gasPrice: process.env.ETHEREUM_GAS_PRICE,
    gasLimit: process.env.ETHEREUM_GAS_LIMIT,
  },
});


// console.log(`Loaded ${envFileName} config: ${JSON.stringify(config, null, 2)}`);
module.exports = config;
