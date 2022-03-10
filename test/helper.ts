import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";

export async function travelTime(ethers: HardhatEthersHelpers, time: number){
    await ethers.provider.send("evm_increaseTime", [time]);
    await ethers.provider.send("evm_mine", []);
}

export const ONE_WEEK   = 3600 * 24 * 7;



