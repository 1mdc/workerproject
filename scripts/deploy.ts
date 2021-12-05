import { ethers } from "hardhat";

async function main() {
  const [admin] = await ethers.getSigners();
  const minetableErc20Factory = await ethers.getContractFactory(
    "MintableERC20"
  );
  const peonFactory = await ethers.getContractFactory("Peon");
  const mintableErc20 = await minetableErc20Factory
    .connect(admin)
    .deploy("Peon Gold", "pGold");
  const peon = await peonFactory
    .connect(admin)
    .deploy(admin.address, mintableErc20.address, 20000, 30);
  await peon.deployed();
  await mintableErc20.setPeonAddress(peon.address);

  console.log("Admin address:", admin.address);
  console.log("Peon address:", peon.address);
  console.log("pGold address:", mintableErc20.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
