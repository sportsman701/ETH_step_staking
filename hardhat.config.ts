import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

import "./scripts/deploy";
import "./scripts/query";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// Ensure that we have all the environment variables we need.
const accountPrivateKey = process.env.PRIVATE_KEY;
if (!accountPrivateKey) {
  throw new Error("Please set your private key in a .env file");
}

const infuraApiKey = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  defaultNetwork: "localhost",
  solidity: "0.8.4",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
      hardfork: 'istanbul',
      gas: 9500000,
      chainId: 31337,
      accounts: {
        count: 10,
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        path: "m/44'/60'/0'/0",
      }
    },
    ropsten: {
      url:
          process.env.INFURA_API_KEY !== undefined ? "https://ropsten.infura.io/v3/" + infuraApiKey : "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId:3,
    },
    rinkeby: {
      url:
          process.env.INFURA_API_KEY !== undefined ? "https://rinkeby.infura.io/v3/" + infuraApiKey : "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId:4,
    },
    mainnet: {
      url:
          process.env.INFURA_API_KEY !== undefined ? "https://mainnet.infura.io/v3/" + infuraApiKey : "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId:1,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: "./build/typechain",
    target: "ethers-v5",
  },
  paths: {
    sources: "contracts",
    artifacts: "./build/artifacts",
    cache: "./build/cache",
  }
};

export default config;
