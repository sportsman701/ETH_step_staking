import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("query:GetTotalETH", "Get Total ETH amount of pool")
    .addParam("pooladdr", "The Pool address")
    .setAction(async function (taskArguments: TaskArguments, { ethers }) {
        // Deploy ETHPool Contract
        const ethPool = await ethers.getContractAt('ETHPool', taskArguments.pooladdr);
        const totalETH = await ethPool.getTotalEth();
        const parseETH = ethers.utils.formatEther(totalETH);

        console.log(`This ETHPool is holding ${parseETH}ETH`);
    });