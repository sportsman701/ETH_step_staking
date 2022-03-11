import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("deploy:ETHPool", "Deploy ETHPool Contract")
    .setAction(async function (taskArguments: TaskArguments, { ethers }) {
      // Deploy ETHPool Contract
      const ETHPool = await ethers.getContractFactory('ETHPool');
      const ethPool = await ETHPool.deploy()
      await ethPool.deployed()

      console.log("ETHPool deployed to:", ethPool.address);
    });