const ethers = require('ethers');

const { init_ethers, loadChefContract } = require('./ethers_helper');

module.exports = async function main() {
  const App = await init_ethers();

  console.log(`Initialized ${App.YOUR_ADDRESS}\n`);
  console.log("Reading smart contracts...\n");

  const SPELL_CHEF_ADDR = "0xF43480afE9863da4AcBD4419A47D9Cc7d25A647F";
  const SPELL_CHEF_ABI = [{ "inputs": [{ "internalType": "contract IERC20", "name": "_ice", "type": "address" }, { "internalType": "uint256", "name": "_icePerSecond", "type": "uint256" }, { "internalType": "uint32", "name": "_startTime", "type": "uint32" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Deposit", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "EmergencyWithdraw", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Withdraw", "type": "event" }, { "inputs": [{ "internalType": "uint16", "name": "_allocPoint", "type": "uint16" }, { "internalType": "contract IERC20", "name": "_stakingToken", "type": "address" }, { "internalType": "bool", "name": "_withUpdate", "type": "bool" }], "name": "add", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint32", "name": "addSeconds", "type": "uint32" }], "name": "changeEndTime", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "claimOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "deposit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }], "name": "emergencyWithdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "endTime", "outputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_from", "type": "uint256" }, { "internalType": "uint256", "name": "_to", "type": "uint256" }], "name": "getMultiplier", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "ice", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "icePerSecond", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "massUpdatePools", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "address", "name": "_user", "type": "address" }], "name": "pendingIce", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pendingOwner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "poolInfo", "outputs": [{ "internalType": "contract IERC20", "name": "stakingToken", "type": "address" }, { "internalType": "uint256", "name": "stakingTokenTotalAmount", "type": "uint256" }, { "internalType": "uint256", "name": "accIcePerShare", "type": "uint256" }, { "internalType": "uint32", "name": "lastRewardTime", "type": "uint32" }, { "internalType": "uint16", "name": "allocPoint", "type": "uint16" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "poolLength", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "uint16", "name": "_allocPoint", "type": "uint16" }, { "internalType": "bool", "name": "_withUpdate", "type": "bool" }], "name": "set", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_icePerSecond", "type": "uint256" }, { "internalType": "bool", "name": "_withUpdate", "type": "bool" }], "name": "setIcePerSecond", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "startTime", "outputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalAllocPoint", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }, { "internalType": "bool", "name": "direct", "type": "bool" }, { "internalType": "bool", "name": "renounce", "type": "bool" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }], "name": "updatePool", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" }], "name": "userInfo", "outputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "rewardDebt", "type": "uint256" }, { "internalType": "uint256", "name": "remainingIceTokenReward", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]
  const SPELL_CHEF = new ethers.Contract(SPELL_CHEF_ADDR, SPELL_CHEF_ABI, App.provider);
  const rewardsPerWeek = await SPELL_CHEF.icePerSecond() / 1e18 * 604800;

  const data = await loadChefContract(App, SPELL_CHEF, SPELL_CHEF_ADDR, SPELL_CHEF_ABI,
    "SPELL", "ice", null, rewardsPerWeek, "pendingIce");

  for (const info of data.aprs) {
    info.name = info.stakeTokenTicker;
    info.rewardName = info.rewardTokenTicker;
    info.price = info.underlyingPrice;
    info.tvl = 0;
    info.staked = info.totalStakedUsd;
    info.aprYear = info.yearlyAPR;
  }

  return { infos: data.aprs };
}
