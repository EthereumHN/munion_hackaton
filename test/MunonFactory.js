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

    describe("join", function () {
        let HackathonFactory;
        let hackathonFactory;
        let owner;

        beforeEach(async function () {
            [owner] = await ethers.getSigners();
            HackathonFactory = await ethers.getContractFactory("MunonFactory");
            hackathonFactory = await HackathonFactory.deploy();
        });

        it("should require the payment of the registration fee", async function () {
            [_, hackathonOwner, participant] = await ethers.getSigners();
            await hackathonFactory.connect(hackathonOwner).createHackathon("name", "some-hash", BigNumber.from(1), ["ui"]);

            // Amount is less than the fee
            await expect(hackathonFactory.connect(participant).join(BigNumber.from(1), {
                value: BigNumber.from(0)
            })).to.be.revertedWith("Amount not equal to pay fee");

            // Amount is more than the fee
            await expect(hackathonFactory.connect(participant).join(BigNumber.from(1), {
                value: BigNumber.from(3)
            })).to.be.revertedWith("Amount not equal to pay fee");

            // Amount is exactly equal to the fee
            const tx = await hackathonFactory.connect(participant).join(BigNumber.from(1), {
                value: BigNumber.from(1)
            });
            await tx.wait();
            await expect(await hackathonFactory.participant_has_joined(BigNumber.from(1),
                participant.address)).to.true;
        });
    });

    describe("sponsor", function () {
        let HackathonFactory;
        let hackathonFactory;
        let owner;

        beforeEach(async function () {
            [owner] = await ethers.getSigners();
            HackathonFactory = await ethers.getContractFactory("MunonFactory");
            hackathonFactory = await HackathonFactory.deploy();
        });

        it("should not allow to sponsor a finished hackathon", async function () {
            [_, hackathonOwner, sponsor] = await ethers.getSigners();
            const hackathonId = BigNumber.from(1);
            await hackathonFactory.connect(hackathonOwner).createHackathon("name", "some-hash", BigNumber.from(1), ["ui"]);

            await hackathonFactory.connect(hackathonOwner).finishHackathon(hackathonId);

            await expect(hackathonFactory.connect(sponsor).sponsor(hackathonId, {
                value: BigNumber.from(1),
            })).to.be.revertedWith("Hackathon is finished");
        });

        it("should increase the available pot", async function () {
            [_, hackathonOwner, sponsor] = await ethers.getSigners();
            const hackathonId = BigNumber.from(0);

            await hackathonFactory.connect(hackathonOwner).createHackathon("name", "some-hash", BigNumber.from(1), ["ui"]);
            await expect(() => hackathonFactory.connect(sponsor).sponsor(hackathonId, {
                value: BigNumber.from(1),
            })).to.changeEtherBalance(
                hackathonFactory, BigNumber.from(1),
            );

            const [, , , , , totalPot] = await hackathonFactory.hackathons(hackathonId);
            expect(totalPot).to.equal(BigNumber.from(1));
        });
    });

    describe("finishHackathon", function () {
        let HackathonFactory;
        let hackathonFactory;
        let owner;

        beforeEach(async function () {
            [owner] = await ethers.getSigners();
            HackathonFactory = await ethers.getContractFactory("MunonFactory");
            hackathonFactory = await HackathonFactory.deploy();
        });

        it("should allow only host to finish hackathon", async function () {
            [_, hackathonOwner] = await ethers.getSigners();
            const hackathonId = BigNumber.from(1);

            await hackathonFactory.connect(hackathonOwner).createHackathon("name", "some-hash", BigNumber.from(1), ["ui"]);

            await expect(hackathonFactory.connect(owner).finishHackathon(hackathonId))
                .to.be.revertedWith("You are not the hackathon host");

            const tx = await hackathonFactory.connect(hackathonOwner).finishHackathon(hackathonId);
            await tx.wait();

            const hackathon = await hackathonFactory.hackathons(hackathonId);
            expect(hackathon[1]).to.equal(2);
        });
    });
});