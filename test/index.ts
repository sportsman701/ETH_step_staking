import {ethers} from "hardhat";
import {shouldBehaveLikeOwnable} from "./units/Ownable.behavior";
import {shouldBehaveLikeETHPool} from "./units/ETHPool.behavior";

describe("ETHPool Unit Test", function () {

    beforeEach(async () => {
        this.ctx.signers = await ethers.getSigners();
        const [owner] = this.ctx.signers;

        // Deploy ETHPool Contract
        const ETHPool = await ethers.getContractFactory('ETHPool', owner);
        this.ctx.ethPool = await ETHPool.deploy()
        await this.ctx.ethPool.deployed()
    })

    shouldBehaveLikeOwnable();

    shouldBehaveLikeETHPool();
})
