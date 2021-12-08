import { ethers } from "hardhat";

async function main() {
  const admin = "0x4E510ae456d8733561861AcdDd9ee2343b4bca9c";
  const [deployer] = await ethers.getSigners();
  const minetableErc20Factory = await ethers.getContractFactory(
    "MintableERC20"
  );
  const peonFactory = await ethers.getContractFactory("Peon");
  const mintableErc20 = await minetableErc20Factory
    .connect(deployer)
    .deploy("Peon Gold", "pGold");
  await mintableErc20.deployed();

  const peon = await peonFactory
    .connect(deployer)
    .deploy(
      admin,
      mintableErc20.address,
      20000,
      ethers.utils.parseEther("0.1")
    );
  await peon.deployed();
  await mintableErc20.setPeonAddress(peon.address);

  console.log("Admin address:", admin);
  console.log("Peon address:", peon.address);
  console.log("pGold address:", mintableErc20.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
