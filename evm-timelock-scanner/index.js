require('dotenv').config();
const Web3 = require('web3');
const Redis = require('ioredis');
const Cron = require('cron');
const zlib = require('zlib');
const util = require('util');
const inflate = util.promisify(zlib.inflate);
const { TelegramClient } = require('messaging-api-telegram');

// Redis should be configured as persistent storage

// get accessToken from telegram [@BotFather](https://telegram.me/BotFather)
const telegramClient = new TelegramClient({
  accessToken: process.env.TELEGRAM_ACCESS_TOKEN,
});

const redis = new Redis();

const redisPrefix = 'tmlck:';
const redisKeys = {
  lastScannedBlock: `${redisPrefix}latestBlock`,
  contracts: `${redisPrefix}contracts`,
  telegramOffset: `${redisPrefix}telegramOffset`,
  telegramUser: `${redisPrefix}telegramUser:`,
};

const networkTypes = {
  ETH: 'ETH',
  BSC: 'BSC',
  MATIC: 'MATIC',
}

const networks = {
  [networkTypes.ETH]: process.env.WS_NODE_ETH,
  [networkTypes.BSC]: process.env.WS_NODE_BSC,
  [networkTypes.MATIC]: process.env.WS_NODE_MATIC,
}

const requiredObjectProperties = ['network', 'name', 'account', 'abi'];

const contracts = {
  [networkTypes.BSC]: {
    // '0x369899dace9aa3a224b32ba764c8f426edde3eef': {
    //   name: 'MasterChef TimeLock',
    //   network: networkTypes.BSC,
    //   child: '0x369899dace9aa3a224b32ba764c8f426edde3eef',
    //   track: true,
    //   account: '0x369899dace9aa3a224b32ba764c8f426edde3eef',
    //   abi: [{"inputs":[{"internalType":"address","name":"admin_","type":"address"},{"internalType":"uint256","name":"delay_","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"txHash","type":"bytes32"},{"indexed":true,"internalType":"address","name":"target","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"string","name":"signature","type":"string"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"},{"indexed":false,"internalType":"uint256","name":"eta","type":"uint256"}],"name":"CancelTransaction","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"txHash","type":"bytes32"},{"indexed":true,"internalType":"address","name":"target","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"string","name":"signature","type":"string"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"},{"indexed":false,"internalType":"uint256","name":"eta","type":"uint256"}],"name":"ExecuteTransaction","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newAdmin","type":"address"}],"name":"NewAdmin","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"newDelay","type":"uint256"}],"name":"NewDelay","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newPendingAdmin","type":"address"}],"name":"NewPendingAdmin","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"txHash","type":"bytes32"},{"indexed":true,"internalType":"address","name":"target","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"string","name":"signature","type":"string"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"},{"indexed":false,"internalType":"uint256","name":"eta","type":"uint256"}],"name":"QueueTransaction","type":"event"},{"inputs":[],"name":"GRACE_PERIOD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAXIMUM_DELAY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MINIMUM_DELAY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"admin_initialized","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"target","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"string","name":"signature","type":"string"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"uint256","name":"eta","type":"uint256"}],"name":"cancelTransaction","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"delay","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"target","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"string","name":"signature","type":"string"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"uint256","name":"eta","type":"uint256"}],"name":"executeTransaction","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"pendingAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"target","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"string","name":"signature","type":"string"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"uint256","name":"eta","type":"uint256"}],"name":"queueTransaction","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"queuedTransactions","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"delay_","type":"uint256"}],"name":"setDelay","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"pendingAdmin_","type":"address"}],"name":"setPendingAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}],
    // },
    // '0xf1f8e3ff67e386165e05b2b795097e95aac899f0': {
    //   name: 'MasterChef',
    //   network: networkTypes.BSC,
    //   owner: '0x369899dace9aa3a224b32ba764c8f426edde3eef',
    //   track: false,
    //   account: '0xf1f8e3ff67e386165e05b2b795097e95aac899f0',
    //   abi: [{"inputs":[{"internalType":"contract GenToken","name":"_gen","type":"address"},{"internalType":"contract IERC20","name":"_busd","type":"address"},{"internalType":"contract IGenNFT","name":"_nft","type":"address"},{"internalType":"address","name":"_busdGenLP","type":"address"},{"internalType":"contract IProxy","name":"_proxy","type":"address"},{"internalType":"address","name":"_devaddr","type":"address"},{"internalType":"address","name":"_feeAddress","type":"address"},{"internalType":"uint256","name":"_genPerBlock","type":"uint256"},{"internalType":"uint256","name":"_startBlock","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"pid","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"pid","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"EmergencyWithdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"pid","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[{"internalType":"uint256","name":"_allocPoint","type":"uint256"},{"internalType":"contract IERC20","name":"_lpToken","type":"address"},{"internalType":"uint16","name":"_depositFeeBP","type":"uint16"},{"internalType":"bool","name":"_withUpdate","type":"bool"}],"name":"add","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"bottomPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"busd","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"busdGenLP","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_devaddr","type":"address"}],"name":"dev","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"devaddr","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],"name":"emergencyWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"emissionUpdateInterval","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"gen","outputs":[{"internalType":"contract GenToken","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"genPerBlock","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastBlockUpdate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"massUpdatePools","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"nft","outputs":[{"internalType":"contract IGenNFT","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bytes","name":"","type":"bytes"}],"name":"onERC721Received","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"address","name":"_user","type":"address"}],"name":"pendingGen","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"poolInfo","outputs":[{"internalType":"uint256","name":"totalPower","type":"uint256"},{"internalType":"contract IERC20","name":"lpToken","type":"address"},{"internalType":"uint256","name":"allocPoint","type":"uint256"},{"internalType":"uint256","name":"lastRewardBlock","type":"uint256"},{"internalType":"uint256","name":"accGenPerPower","type":"uint256"},{"internalType":"uint16","name":"depositFeeBP","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"poolLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256[]","name":"_nftIds","type":"uint256[]"}],"name":"powerUpWithNFTs","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_allocPoint","type":"uint256"},{"internalType":"uint16","name":"_depositFeeBP","type":"uint16"},{"internalType":"bool","name":"_withUpdate","type":"bool"}],"name":"set","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_feeAddress","type":"address"}],"name":"setFeeAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IProxy","name":"_proxy","type":"address"}],"name":"setProxy","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"startBlock","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"topPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalAllocPoint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"updateEmissionIfNeeded","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_topPrice","type":"uint256"},{"internalType":"uint256","name":"_bottomPrice","type":"uint256"},{"internalType":"uint256","name":"_emissionUpdateInterval","type":"uint256"}],"name":"updateEmissionParameters","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_genPerBlock","type":"uint256"}],"name":"updateEmissionRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],"name":"updatePool","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],"name":"updatePower","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"userInfo","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"rewardDebt","type":"uint256"},{"internalType":"uint256","name":"power","type":"uint256"},{"internalType":"uint256","name":"lastPoweredBlock","type":"uint256"},{"internalType":"uint256","name":"lastClaimedBlock","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}],
    // },
    // '0x084e9b6928888a1d372b87e3d7bb3f90700df137': {
    //   name: 'PlanetFinance TimeLock',
    //   network: networkTypes.BSC,
    //   child: '0x084e9b6928888a1d372b87e3d7bb3f90700df137',
    //   track: true,
    //   account: '0x084e9b6928888a1d372b87e3d7bb3f90700df137',
    //   abi: [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":true,"internalType":"uint256","name":"index","type":"uint256"},{"indexed":false,"internalType":"address","name":"target","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"CallExecuted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":true,"internalType":"uint256","name":"index","type":"uint256"},{"indexed":false,"internalType":"address","name":"target","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"},{"indexed":false,"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"delay","type":"uint256"}],"name":"CallScheduled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"}],"name":"Cancelled","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"oldDuration","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newDuration","type":"uint256"}],"name":"MinDelayChange","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"oldDuration","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newDuration","type":"uint256"}],"name":"MinDelayReducedChange","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":true,"internalType":"uint256","name":"index","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_pid","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_allocPoint","type":"uint256"},{"indexed":false,"internalType":"bool","name":"_withUpdate","type":"bool"},{"indexed":false,"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"delay","type":"uint256"}],"name":"SetScheduled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":true,"internalType":"uint256","name":"index","type":"uint256"},{"indexed":false,"internalType":"address","name":"target","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"},{"indexed":false,"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"delay","type":"uint256"}],"name":"SetScheduled","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"EXECUTOR_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PROPOSER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TIMELOCK_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_planetFinanceAddress","type":"address"},{"internalType":"address","name":"_want","type":"address"},{"internalType":"bool","name":"_withUpdate","type":"bool"},{"internalType":"address","name":"_strat","type":"address"}],"name":"add","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"}],"name":"cancel","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"devWalletAddress","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"}],"name":"earn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"target","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"internalType":"bytes32","name":"salt","type":"bytes32"}],"name":"execute","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address[]","name":"targets","type":"address[]"},{"internalType":"uint256[]","name":"values","type":"uint256[]"},{"internalType":"bytes[]","name":"datas","type":"bytes[]"},{"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"internalType":"bytes32","name":"salt","type":"bytes32"}],"name":"executeBatch","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"_planetFinanceAddress","type":"address"},{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_allocPoint","type":"uint256"},{"internalType":"bool","name":"_withUpdate","type":"bool"},{"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"internalType":"bytes32","name":"salt","type":"bytes32"}],"name":"executeSet","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"}],"name":"farm","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getMinDelay","outputs":[{"internalType":"uint256","name":"duration","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getRoleMember","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleMemberCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"}],"name":"getTimestamp","outputs":[{"internalType":"uint256","name":"timestamp","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"target","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"internalType":"bytes32","name":"salt","type":"bytes32"}],"name":"hashOperation","outputs":[{"internalType":"bytes32","name":"hash","type":"bytes32"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address[]","name":"targets","type":"address[]"},{"internalType":"uint256[]","name":"values","type":"uint256[]"},{"internalType":"bytes[]","name":"datas","type":"bytes[]"},{"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"internalType":"bytes32","name":"salt","type":"bytes32"}],"name":"hashOperationBatch","outputs":[{"internalType":"bytes32","name":"hash","type":"bytes32"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"address","name":"_to","type":"address"}],"name":"inCaseTokensGetStuck","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"}],"name":"isOperationDone","outputs":[{"internalType":"bool","name":"done","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"}],"name":"isOperationPending","outputs":[{"internalType":"bool","name":"pending","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"}],"name":"isOperationReady","outputs":[{"internalType":"bool","name":"ready","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minDelay","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minDelayReduced","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"}],"name":"noTimeLockFunc1","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"}],"name":"noTimeLockFunc2","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"}],"name":"noTimeLockFunc3","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"}],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"target","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"internalType":"bytes32","name":"salt","type":"bytes32"},{"internalType":"uint256","name":"delay","type":"uint256"}],"name":"schedule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"targets","type":"address[]"},{"internalType":"uint256[]","name":"values","type":"uint256[]"},{"internalType":"bytes[]","name":"datas","type":"bytes[]"},{"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"internalType":"bytes32","name":"salt","type":"bytes32"},{"internalType":"uint256","name":"delay","type":"uint256"}],"name":"scheduleBatch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_planetFinanceAddress","type":"address"},{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_allocPoint","type":"uint256"},{"internalType":"bool","name":"_withUpdate","type":"bool"},{"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"internalType":"bytes32","name":"salt","type":"bytes32"}],"name":"scheduleSet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"},{"internalType":"address","name":"_buyBackAddress","type":"address"}],"name":"setBuyBackAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"_devWalletAddress","type":"address"}],"name":"setDevWalletAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"},{"internalType":"address","name":"_govAddress","type":"address"}],"name":"setGov","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"},{"internalType":"uint256","name":"newMinTimeToWithdraw","type":"uint256"}],"name":"setMinTimeToWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"},{"internalType":"bool","name":"_onlyGov","type":"bool"}],"name":"setOnlyGov","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"},{"internalType":"address","name":"_rewardsAddress","type":"address"}],"name":"setRewardsAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"},{"internalType":"uint256","name":"_entranceFeeFactor","type":"uint256"},{"internalType":"uint256","name":"_withdrawFeeFactor","type":"uint256"},{"internalType":"uint256","name":"_controllerFee","type":"uint256"},{"internalType":"uint256","name":"_buyBackRate","type":"uint256"},{"internalType":"uint256","name":"_slippageFactor","type":"uint256"}],"name":"setSettings","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"},{"internalType":"address","name":"_uniRouterAddress","type":"address"}],"name":"setUniRouterAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"}],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"newDelay","type":"uint256"}],"name":"updateMinDelay","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"newDelay","type":"uint256"}],"name":"updateMinDelayReduced","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_tokenAddress","type":"address"}],"name":"withdrawBEP20","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"withdrawBNB","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"_stratAddress","type":"address"}],"name":"wrapBNB","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}],
    // },
    // '0x0ac58Fd25f334975b1B61732CF79564b6200A933': {
    //   name: 'PlanetFinance',
    //   network: networkTypes.BSC,
    //   owner: '0x084e9b6928888a1d372b87e3d7bb3f90700df137',
    //   track: false,
    //   account: '0x0ac58Fd25f334975b1B61732CF79564b6200A933',
    //   abi: [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"pid","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"pid","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"EmergencyWithdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"pid","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[],"name":"AQUA","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"AQUAMaxSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"AQUAPerBlock","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_allocPoint","type":"uint256"},{"internalType":"contract IERC20","name":"_want","type":"address"},{"internalType":"bool","name":"_withUpdate","type":"bool"},{"internalType":"address","name":"_strat","type":"address"}],"name":"add","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"burnAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_newAddress","type":"address"}],"name":"changeAQUAaddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_wantAmt","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],"name":"emergencyWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_from","type":"uint256"},{"internalType":"uint256","name":"_to","type":"uint256"}],"name":"getMultiplier","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"inCaseTokensGetStuck","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"massUpdatePools","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"address","name":"_user","type":"address"}],"name":"pendingAQUA","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"poolInfo","outputs":[{"internalType":"contract IERC20","name":"want","type":"address"},{"internalType":"uint256","name":"allocPoint","type":"uint256"},{"internalType":"uint256","name":"lastRewardBlock","type":"uint256"},{"internalType":"uint256","name":"accAQUAPerShare","type":"uint256"},{"internalType":"address","name":"strat","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"poolLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_allocPoint","type":"uint256"},{"internalType":"bool","name":"_withUpdate","type":"bool"}],"name":"set","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"address","name":"_user","type":"address"}],"name":"stakedWantTokens","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"startBlock","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalAllocPoint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],"name":"updatePool","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"userInfo","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"uint256","name":"rewardDebt","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_wantAmt","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],"name":"withdrawAll","outputs":[],"stateMutability":"nonpayable","type":"function"}],
    // }
  },
  [networkTypes.ETH]: {},
  [networkTypes.MATIC]: {},
}

const initialize = (async () => {
  // for (const network in contracts) {
  //   for (const account of Object.keys(contracts[network])) {
  //     await redis.hset(redisKeys.contracts, `${network}:${account}`, JSON.stringify(contracts[network][account]));
  //   }
  // }

  const tmpContracts = await redis.hgetall(redisKeys.contracts);
  for (const tmpKey in tmpContracts) {
    const key = tmpKey.split(':');
    if (Object.keys(contracts).indexOf(key[0]) == -1) {
      contracts[key[0]] = [];
    }
    const contract = JSON.parse(tmpContracts[tmpKey]);
    contracts[key[0]][contract.account] = contract;
  }
})();
      


const web3s = {};
for (const network in networks) {
  const tmpWeb3 = new Web3(networks[network]);
  // Override default settings
  const tmpProvider = tmpWeb3.currentProvider;
  if (!tmpProvider.reconnectOptions) {
    tmpProvider.reconnectOptions = {};
  }
  tmpProvider.reconnectOptions.auto = true;
  tmpProvider.reconnectOptions.onTimeout = true;
  tmpProvider.reconnectOptions.delay = 5000;
  tmpProvider._customTimeout = 5000;
  tmpProvider.timeout = 5000;
  tmpWeb3.setProvider(tmpProvider);

  web3s[network] = tmpWeb3;
}

const processNetwork = async (network) => {
  try {
    const web3 = web3s[network];
    const currentBlock = await web3.eth.getBlockNumber();
    console.log(network, `Current block: ${currentBlock}`);
    if (Object.keys(contracts).indexOf(network) === -1 || Object.keys(contracts[network]).length == 0) {
      return;
    }
    const lastScannedBlock = parseInt(await redis.hget(redisKeys.lastScannedBlock, network));
    console.log(network, `Last scanned block: ${lastScannedBlock}`);
    if (Object.keys(contracts).indexOf(network) == -1 || Object.keys(contracts[network]).length == 0) {
      return;
    }
    for (const contractKey of Object.keys(contracts[network])) {
      const contractData = contracts[network][contractKey];
      if (!contractData.track) {
        continue;
      }
      const pastLogs = await web3.eth.getPastLogs({
        fromBlock: currentBlock - lastScannedBlock > 4950 ? currentBlock - 4950 : lastScannedBlock,
        toBlock: "latest",
        address: contractData.account,
        topics: ['0x76e2796dc3a81d57b0e8504b647febcbeeb5f4af818e164f11eef8131a6a763f'],
      });
      
      pastLogs.concat(await web3.eth.getPastLogs({
        fromBlock: currentBlock - lastScannedBlock > 4950 ? currentBlock - 4950 : lastScannedBlock,
        toBlock: "latest",
        address: contractData.account,
        topics: ['0xbeff167aab6e5067256065b2eb29930005ab5afa2b1c4d1d248e7db86afe810b'],
      }))

      const contract = new web3.eth.Contract(contractData.abi, contractData.account);
      const queryInterfaceJsonInterface = contract.options.jsonInterface.filter((e) => { return e.type == 'function' && e.name && ['queuetransaction', 'scheduleset'].indexOf(e.name.toLowerCase()) !== -1 })[0];
      if (!queryInterfaceJsonInterface) {
        console.error(`JSON interface not found for ${contractData.account}`);
        break;
      }
      const parameterTypesArray = queryInterfaceJsonInterface.inputs.map((e) => { return e.internalType; })
      const parameterNamesArray = queryInterfaceJsonInterface.inputs.map((e) => { return e.name; })
      for (const pastLog of pastLogs) {
        const transaction = await web3.eth.getTransaction(pastLog.transactionHash);
       // Update emission rate
        const decodedParameters = web3.eth.abi.decodeParameters(parameterTypesArray, `0x${transaction.input.substr(10)}`);
        // Only continue if data can be further parsed
        if (queryInterfaceJsonInterface.name.toLowerCase() != 'queuetransaction') {
          console.log("decodedParameters:", decodedParameters);
          await telegramClient.sendMessage(process.env.TELEGRAM_CHAT_ID, `Transaction sent to ${contractData.account} with txid ${pastLog.transactionHash} `
            + `, parameters ${parameterNamesArray} and decoded data ${JSON.stringify(decodedParameters)}`);
          continue;
        }

        const targetMethod = decodedParameters['3'].substr(0, 10);
        const targetParameters = decodedParameters['3'].substr(10);
        // TO-DO: Replace decodedParameters[0] with simply finding the child of the timelock owner contract?
        const filteredContracts = Object.keys(contracts[contractData.network]).filter((account) => { return account === decodedParameters['0'].toLowerCase() });
        const filteredContract = contracts[contractData.network][filteredContracts[0]];

        const targetContract = new web3.eth.Contract(filteredContract.abi, filteredContract.account);
        const targetMethodInterface = targetContract.options.jsonInterface.filter((e) => { return e.signature === targetMethod; })[0];
        const targetParameterTypesArray = targetMethodInterface.inputs.map((e) => { return e.internalType; })
        const targetParameterNamesArray = targetMethodInterface.inputs.map((e) => { return e.name; })

        const decodedTargetParameters = web3.eth.abi.decodeParameters(targetParameterTypesArray, `0x${targetParameters}`);
        console.log("decodedTargetParameters:", decodedTargetParameters);
        await telegramClient.sendMessage(process.env.TELEGRAM_CHAT_ID, `Transaction sent to ${contractData.account} with txid ${pastLogs.transactionHash} `
          + `with parameters ${targetParameterNamesArray} and decoded data ${JSON.stringify(decodedTargetParameters)}`);
      }
    }
    await redis.hset(redisKeys.lastScannedBlock, network, currentBlock);
  } catch (err) {
    telegramThrottleError(`${network} Error:`, JSON.stringify(err, Object.getOwnPropertyNames(err)));
  }
};

const start = async () => {
  console.log("New loop");
  for (const network in networks) {
    try {
      processNetwork(network);
    } catch (err) {
      telegramThrottleError(`An error has occurred while connecting to ${network}`, JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  }
};

const errorsSentToTelegram = {};
const telegramThrottleError = async (message, details) => {
  console.error(message, details);
  if (!(message in errorsSentToTelegram) || errorsSentToTelegram[message] < +new Date() - 3600000) {
    await telegramClient.sendMessage(process.env.TELEGRAM_CHAT_ID, message);
    errorsSentToTelegram[message] = +new Date();
  }
};

let passedTelegram = true;
const startTelegram = async () => {
  if (!passedTelegram) {
    return;
  }
  passedTelegram = false;
  console.log("Process Telegram bot updates");
  try {
    const offset = await redis.get(redisKeys.telegramOffset);
    const updates = await telegramClient.getUpdates({ offset: offset });
    //console.log("updates:", JSON.stringify(updates, null, 2));
    for (const update of updates) {
      let command = '';
      try {
        if (update.message && update.message.entities && update.message.entities[0].type == 'bot_command') {
          command = update.message.text.split('@')[0].substr(1);
          const data = update.message.text.substr(update.message.text.indexOf(' ') + 1);
          // TO-DO: change to id?
          const fromUser = update.message.from ? update.message.from.username : null;
          const userExists = await redis.get(`${redisKeys.telegramUser}${fromUser}`);
          let isAdmin = false;
          let isManager = false;
          if (userExists) {
            const userData = JSON.parse(userExists);
            isAdmin = userData.isAdmin;
            isManager = userData.isManager;
          }
          if (!isAdmin && !isManager) {
            throw new Error(`Access denied. User ${fromUser} is not admin nor manager.`);
          }
          let userKey = '';
          let user = null;
          switch (command) {
            case 'setmanager':
              if (!isAdmin) {
                throw new Error(`Access denied. User ${fromUser} is not an admin.`);
              }
              userKey = `${redisKeys.telegramUser}${data}`;
              user = await redis.get(userKey);
              if (!user) {
                await redis.set(userKey, JSON.stringify({ isAdmin: false, isManager: true }));
              } else {
                const userObj = JSON.parse(user);
                userObj.isManager = true;
                await redis.set(userKey, JSON.stringify(userObj));
              }
              break;
            case 'removemanager':
              if (!isAdmin) {
                throw new Error(`Access denied. User ${fromUser} is not an admin.`);
              }
              userKey = `${redisKeys.telegramUser}${data}`;
              user = await redis.get(userKey);
              if (user) {
                const userObj = JSON.parse(user);
                userObj.isManager = false;
                await redis.set(userKey, JSON.stringify(userObj));
              }
              break;
            case 'setadmin':
              if (!isAdmin) {
                throw new Error(`Access denied. User ${fromUser} is not an admin.`);
              }
              userKey = `${redisKeys.telegramUser}${data}`;
              user = await redis.get(userKey);
              if (!user) {
                await redis.set(userKey, JSON.stringify({ isAdmin: true, isManager: false }));
              } else {
                const userObj = JSON.parse(user);
                userObj.isAdmin = true;
                await redis.set(userKey, JSON.stringify(userObj));
              }
              break;
            case 'removeadmin':
              if (!isAdmin) {
                throw new Error(`Access denied. User ${fromUser} is not an admin.`);
              }
              userKey = `${redisKeys.telegramUser}${data}`;
              user = await redis.get(userKey);
              if (user) {
                const userObj = JSON.parse(user);
                userObj.isAdmin = false;
                await redis.set(userKey, JSON.stringify(userObj));
              }
              break;
            case 'addcontractpair':
              // http://www.txtwizard.net/compression - use deflate
              let inflatedData = await inflate(Buffer.from(data, 'base64'));
              const jsonData = JSON.parse(inflatedData.toString('utf8'));
              if (Object.prototype.toString.call(jsonData).indexOf('Array') == -1) {
                throw new Error(`Command ${command} error: expected an array`);
              }
              if (jsonData.length != 2) {
                throw new Error(`Command ${command} error: expected an array of size 2`);
              }
              if (Object.prototype.toString.call(jsonData[0]).indexOf('Object') == -1 || Object.prototype.toString.call(jsonData[1]).indexOf('Object') == -1) {
                throw new Error(`Command ${command} error: expected two objects in array`);
              }

              for (const jsonObject of jsonData) {
                for (const property of requiredObjectProperties) {
                  if (jsonObject[property] == 'undefined') {
                    throw new Error(`Command ${command} error: object missing property ${property}`);
                  }
                }
              }
              if (jsonData[1].owner == 'undefined' || jsonData[1].owner.toLowerCase() != jsonData[0].account.toLowerCase()) {
                throw new Error(`Command ${command} error: timelock contract object is missing owner or owner is incorrect`);
              }
              jsonData[0].track = true;
              jsonData[1].track = false;
              jsonData[0].account = jsonData[0].account.toLowerCase();
              jsonData[1].account = jsonData[1].account.toLowerCase();
              jsonData[1].owner = jsonData[1].account.toLowerCase();

              // TO-DO: Validate ABIs?

              for (const jsonObject of jsonData) {
                await redis.hset(redisKeys.contracts, `${jsonObject.network}:${jsonObject.account}`, JSON.stringify(jsonObject));
                contracts[jsonObject.network][jsonObject.account] = jsonObject;
              }
          break;
            case 'removecontractpair':
              const network = data.split(':')[0];
              const account = data.split(':')[1].toLowerCase();
              const targetAccount = Object.values(contracts).filter((e, i) => {
                return e.owner.toLowerCase() == account;
              });
              await redis.hdel(redisKeys.contracts, `${network}:${account}`);
              delete contracts[network][account];
              if (targetAccount.length) {
                await redis.hdel(redisKeys.contracts, `${network}:${targetAccount[0].account}`);
                delete contracts[network][targetAccount[0].account];
              } else {
                // TO-DO: Couldn't remove target contract
              }
              
              break;
            default:
              throw new Error(`Unknown command: ${command}`);
          }
        }
      } catch (err) {
        console.error('An error has occurred while processing Telegram bot update', JSON.stringify(err, Object.getOwnPropertyNames(err)));
        await telegramClient.sendMessage(process.env.TELEGRAM_CHAT_ID, `An error has occurred while processing command ${command}: ${err}`);
      }
      await redis.set(redisKeys.telegramOffset, update.updateId + 1);
    }
  } catch (err) {
    console.error('An error has occurred while processing Telegram bot updates', JSON.stringify(err, Object.getOwnPropertyNames(err)));
  }
  passedTelegram = true;
};

const job = new Cron.CronJob("*/30 * * * * *", start, null, null, null, null, true);
job.start();
const job2 = new Cron.CronJob("*/3 * * * * *", startTelegram, null, null, null, null, true);
job2.start();
