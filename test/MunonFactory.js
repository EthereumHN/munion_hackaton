const {
    BigNumber
} = require("@ethersproject/bignumber");
const {
    expect
} = require("chai");
const {
    ethers
} = require("hardhat");

describe("Munon Factory tests", function () {
    describe("createHackaton", function () {
        let HackatonFactory;
        let hackatonFactory;
        let owner;

        beforeEach(async function () {
            [owner] = await ethers.getSigners();
            HackatonFactory = await ethers.getContractFactory("MunonFactory");
            hackatonFactory = await HackatonFactory.deploy();
        });


        it("should not allow to create hackatons with no metrics", async function () {
            await expect(hackatonFactory.createHackathon("name", "some-hash", BigNumber.from(1), [])).to.be.revertedWith("There must be at least one metric");
        });

        it("should create a hackaton with proper parameters", async function () {
            await hackatonFactory.createHackathon("name", "some-hash", BigNumber.from(1), ["metric"]);
            expect(await hackatonFactory.hackathon_count()).to.equal(1);

            const createdHackathon = await hackatonFactory.hackathons(BigNumber.from(1));
            expect(createdHackathon.name).to.equal("name");
            expect(createdHackathon.image_hash).to.equal("some-hash");
            expect(createdHackathon.pot).to.equal(BigNumber.from(0));
        });

        it("should emit HackathonCreation event", async function () {
            await expect(hackatonFactory.createHackathon("name", "some-hash", BigNumber.from(1), ["metric"]))
                .to.emit(hackatonFactory, "HackathonCreation");
        });
    });
});