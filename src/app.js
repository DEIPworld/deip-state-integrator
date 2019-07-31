require('app-module-path').addPath(__dirname);
const config = require('config');
const deipRPC = require('@deip/deip-rpc-client');
const logger = require('logger');

// deipRPC is a singleton and should be configure for whole app
deipRPC.api.setOptions({ url: config.deipBlockchain.rpcEndpoint });
deipRPC.config.set('chain_id', config.deipBlockchain.chainId);

require('scheduler');

logger.info(`App is run in ${config.environment} mode`);
