import { expect } from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from 'ethers';

export function shouldBehaveLikeOwnable(): void {
    describe("1. Ownable", async function() {
        let owner: SignerWithAddress;
        let addr1: SignerWithAddress;
        let addr2: SignerWithAddress;
        let ethPool: Contract;

        beforeEach(async () => {
            [owner, addr1, addr2] = this.ctx.signers;
            ethPool = this.ctx.ethPool;
        });

        it("1.1 Pool owner should be deployer", async () => {

            expect(await ethPool.owner()).to.be.eq(owner.address);

        });

        it("1.2 Succeeds when owner transfers ownership", async () => {

            await expect(ethPool.transferOwnership(addr1.address))
                .to.emit(ethPool, 'OwnershipTransferred')

        });


        it("1.3 Fails when non-owner transfers ownership", async () => {

            await ethPool.transferOwnership(addr1.address);

            await expect(ethPool.transferOwnership(addr2.address))
                .to.be.revertedWith('Ownable: caller is not the owner')
        });

    });
}
