import {ethers} from "hardhat";
import {Contract} from "ethers";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ONE_WEEK, travelTime} from "../helper";

export function shouldBehaveLikeETHPool(): void {
    describe("2. ETHPool", async function () {
        let owner: SignerWithAddress;
        let addr1: SignerWithAddress;
        let addr2: SignerWithAddress;
        let ethPool: Contract;

        beforeEach(async () => {
            [owner, addr1, addr2] = this.ctx.signers;
            ethPool = this.ctx.ethPool;
        });

        it("2.1 Anyone can deposit ETH to the pool", async () => {

            await expect(ethPool.connect(addr1).deposit({ value: 100 })).to.emit(ethPool, 'Deposit').withArgs(addr1.address, 100);

            await expect(ethPool.connect(addr2).deposit({ value: 100 })).to.emit(ethPool, 'Deposit').withArgs(addr2.address, 100);

        });

        it("2.2 Only the team can deposit rewards", async () => {

            await expect(ethPool.connect(owner).depositReward({ value: 100 })).to.emit(ethPool, 'DepositReward').withArgs(100);

            await expect(ethPool.connect(addr1).depositReward({ value: 100 })).to.revertedWith('Ownable: caller is not the owner');

        });

        it("3.3 User can withdraw ETH from the pool at any time", async () => {

            await ethPool.connect(addr1).deposit({ value: 100 });

            await expect(ethPool.connect(addr1).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr1.address, 100);

        });

        it("3.4 Get user`s claimable amount", async () => {

            await ethPool.connect(addr1).deposit({ value: 100 });
            expect(await ethPool.getClaimableAmt(addr1.address)).to.be.eq(100);

            await ethPool.connect(addr2).deposit({ value: 300 });
            expect(await ethPool.getClaimableAmt(addr2.address)).to.be.eq(300);

            await ethPool.connect(owner).depositReward({ value: 200 });

            expect(await ethPool.getClaimableAmt(addr1.address)).to.be.eq(150);
            expect(await ethPool.getClaimableAmt(addr2.address)).to.be.eq(450);
        });

        it("3.5 Users should be able to withdraw their deposits along with their share of rewards", async () => {

            await ethPool.connect(addr1).deposit({ value: 100 });

            await ethPool.connect(addr2).deposit({ value: 300 });

            await ethPool.connect(owner).depositReward({ value: 200 });

            await expect(ethPool.connect(addr1).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr1.address, 150);

            await expect(ethPool.connect(addr2).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr2.address, 450);

        });

        it("3.6 Users should receive rewards considering the time when they deposited", async () => {
            // A deposit
            await ethPool.connect(addr1).deposit({ value: 100 });
            // Team deposit
            await ethPool.connect(owner).depositReward({ value: 200 });
            // B deposit
            await ethPool.connect(addr2).deposit({ value: 300 });
            // A withdraw
            expect(await ethPool.getClaimableAmt(addr1.address)).to.be.eq(300);
            await expect(ethPool.connect(addr1).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr1.address, 300);
            // B withdraw
            expect(await ethPool.getClaimableAmt(addr2.address)).to.be.eq(300);
            await expect(ethPool.connect(addr2).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr2.address, 300);

        });

        it("3.7 Users should receive rewards considering the time when they deposited in several weeks", async () => {
            // A deposit
            await ethPool.connect(addr1).deposit({ value: 100 });
            // B deposit
            await ethPool.connect(addr2).deposit({ value: 300 });

            // Team deposit
            await ethPool.connect(owner).depositReward({ value: 200 });
            expect(await ethPool.getClaimableAmt(addr1.address)).to.be.eq(150);
            expect(await ethPool.getClaimableAmt(addr2.address)).to.be.eq(450);

            // A deposit
            await ethPool.connect(addr1).deposit({ value: 200 });

            await travelTime(ethers, ONE_WEEK);
            // Team deposit 350:450 200
            await ethPool.connect(owner).depositReward({ value: 200 });
            expect(await ethPool.getClaimableAmt(addr1.address)).to.be.eq(450);
            expect(await ethPool.getClaimableAmt(addr2.address)).to.be.eq(550);

            // A withdraw
            await expect(ethPool.connect(addr1).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr1.address, 450);
            // B withdraw
            await expect(ethPool.connect(addr2).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr2.address, 550);

        });


        it("3.8 When user withdraw some amount while staking in several weeks", async () => {
            // A deposit
            await ethPool.connect(addr1).deposit({ value: 100 });
            // B deposit
            await ethPool.connect(addr2).deposit({ value: 300 });

            // Team deposit
            await ethPool.connect(owner).depositReward({ value: 200 });
            expect(await ethPool.getClaimableAmt(addr1.address)).to.be.eq(150);
            expect(await ethPool.getClaimableAmt(addr2.address)).to.be.eq(450);

            // A deposit
            await ethPool.connect(addr1).deposit({ value: 100 });
            // B Withdraw
            await ethPool.connect(addr2).withdraw();

            await travelTime(ethers, ONE_WEEK);
            // Team deposit
            await ethPool.connect(owner).depositReward({ value: 200 });
            expect(await ethPool.getClaimableAmt(addr1.address)).to.be.eq(450);
            expect(await ethPool.getClaimableAmt(addr2.address)).to.be.eq(0);

            // A withdraw
            await expect(ethPool.connect(addr1).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr1.address, 450);
            // B withdraw
            await expect(ethPool.connect(addr2).withdraw()).to.revertedWith('No ETH');

        });

        it("3.9 Check ETH amount held on the pool", async () => {
            // A deposit
            await ethPool.connect(addr1).deposit({ value: 100 });
            expect(await ethPool.getTotalEth()).to.be.eq(100);
            // B deposit
            await ethPool.connect(addr2).deposit({ value: 300 });
            expect(await ethPool.getTotalEth()).to.be.eq(400);

            // Team deposit
            await ethPool.connect(owner).depositReward({ value: 200 });
            expect(await ethPool.getTotalEth()).to.be.eq(600);

            // A withdraw
            await expect(ethPool.connect(addr1).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr1.address, 150);
            expect(await ethPool.getTotalEth()).to.be.eq(450);
            // B withdraw
            await expect(ethPool.connect(addr2).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr2.address, 450);
            expect(await ethPool.getTotalEth()).to.be.eq(0);
        });

        it("3.10 Check ETH amount after several withdrawing and depositing", async () => {
            // A deposit
            await ethPool.connect(addr1).deposit({ value: 100 });
            expect(await ethPool.getTotalEth()).to.be.eq(100);
            // B deposit
            await ethPool.connect(addr2).deposit({ value: 300 });
            expect(await ethPool.getTotalEth()).to.be.eq(400);

            // Team deposit
            await ethPool.connect(owner).depositReward({ value: 200 });
            expect(await ethPool.getTotalEth()).to.be.eq(600);
            // A withdraw
            await expect(ethPool.connect(addr1).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr1.address, 150);
            expect(await ethPool.getTotalEth()).to.be.eq(450);
            // A deposit
            await ethPool.connect(addr1).deposit({ value: 300 });
            expect(await ethPool.getTotalEth()).to.be.eq(750);

            // After a week
            await travelTime(ethers, ONE_WEEK);
            // Team deposit
            await ethPool.connect(owner).depositReward({ value: 200 });
            expect(await ethPool.getTotalEth()).to.be.eq(950);

            // A withdraw
            await expect(ethPool.connect(addr1).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr1.address, 400);
            expect(await ethPool.getTotalEth()).to.be.eq(550);
            // B withdraw
            await expect(ethPool.connect(addr2).withdraw()).to.emit(ethPool, 'Withdraw').withArgs(addr2.address, 550);
            expect(await ethPool.getTotalEth()).to.be.eq(0);
        });
    })
}