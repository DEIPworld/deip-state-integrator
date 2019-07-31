const config = require('config');
const deipRPC = require('@deip/deip-rpc-client');
const ethRPC = require('services/ethereum');

const cron = require('../cron');
const { CRON_EVENTS } = require('../constants');

const deipStateIntegrationJob = async () => {
  const currentState = await deipRPC.api.getStateAsync('');
  const headBlockNumber = currentState.props.head_block_number;
  const headBlock = await deipRPC.api.getBlockAsync(headBlockNumber);
  const dataToIntegrate = JSON.stringify({
    [headBlock.block_id]: `${headBlockNumber}_${config.deipBlockchain.chainId}`,
  });

  await ethRPC.sendDataInTransaction(dataToIntegrate);
};

cron.on(CRON_EVENTS.EVERY_DAY, deipStateIntegrationJob);

if (config.isDev) {
  deipStateIntegrationJob();
}
