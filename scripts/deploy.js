const hre = require("hardhat");

async function main() {
  const MunonFactory = await hre.ethers.getContractFactory("MunonFactory");
  const my_contract = await MunonFactory.deploy();

  await my_contract.deployed();

  console.log("MunonFactory deployed to:", my_contract.address);
}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });