require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

const { SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY } = process.env;

const networks = {
  hardhat: {
    chainId: 31337,
  },
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337,
  },
};

if (SEPOLIA_RPC_URL && SEPOLIA_PRIVATE_KEY) {
  networks.sepolia = {
    url: SEPOLIA_RPC_URL,
    accounts: [SEPOLIA_PRIVATE_KEY.startsWith("0x") ? SEPOLIA_PRIVATE_KEY : `0x${SEPOLIA_PRIVATE_KEY}`],
    chainId: 11155111,
  };
}

module.exports = {
  solidity: "0.8.4",
  paths: {
    artifacts: "../frontend/artifacts",
  },
  networks,
};