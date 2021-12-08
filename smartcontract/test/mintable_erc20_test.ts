import { expect } from "chai";
import { ethers } from "hardhat";

describe("mintable erc20", function () {
  it("owner can mint new coin", async function () {
    const [admin] = await ethers.getSigners();
    const mintableErc20Factory = await ethers.getContractFactory(
      "MintableERC20"
    );
    const mintableErc20 = await mintableErc20Factory
      .connect(admin)
      .deploy("Peon", "PEON");
    await mintableErc20.deployed();
    await mintableErc20.connect(admin).mint(admin.address, 1000);
    expect(await mintableErc20.balanceOf(admin.address)).to.equal(1000);
  });
  it("non owner should not mint new coin", async function () {
    const [admin, user1] = await ethers.getSigners();
    const mintableErc20Factory = await ethers.getContractFactory(
      "MintableERC20"
    );
    const mintableErc20 = await mintableErc20Factory
      .connect(admin)
      .deploy("Peon", "PEON");
    await mintableErc20.deployed();
    await expect(
      mintableErc20.connect(user1).mint(admin.address, 1000)
    ).to.be.revertedWith("sender does not have permission to mint");
  });
  it("should not allow normal user set peon address", async function () {
    const [admin, user1, user2] = await ethers.getSigners();
    const mintableErc20Factory = await ethers.getContractFactory(
      "MintableERC20"
    );
    const mintableErc20 = await mintableErc20Factory
      .connect(admin)
      .deploy("Peon", "PEON");
    await mintableErc20.deployed();
    await expect(
      mintableErc20.connect(user1).setPeonAddress(user2.address)
    ).to.be.revertedWith("sender does not have permission to set peon");
  });
  it("should allow admin user set peon address", async function () {
    const [admin, user1, user2] = await ethers.getSigners();
    const mintableErc20Factory = await ethers.getContractFactory(
      "MintableERC20"
    );
    const mintableErc20 = await mintableErc20Factory
      .connect(admin)
      .deploy("Peon", "PEON");
    await mintableErc20.deployed();
    await mintableErc20.connect(admin).setPeonAddress(user2.address);
    expect(await mintableErc20.peonAddress()).to.equals(user2.address);
  });
});
