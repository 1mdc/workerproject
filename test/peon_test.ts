/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  MintableERC20,
  MintableERC20__factory,
  Peon,
  Peon__factory,
  // eslint-disable-next-line node/no-missing-import
} from "../typechain";

describe("peon contract", function () {
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let minetableErc20Factory: MintableERC20__factory;
  let peonFactory: Peon__factory;
  let mintableErc20: MintableERC20;
  let peon: Peon;
  before(async () => {
    [admin, user1, user2] = await ethers.getSigners();
    minetableErc20Factory = await ethers.getContractFactory("MintableERC20");
    peonFactory = await ethers.getContractFactory("Peon");
  });

  beforeEach(async () => {
    mintableErc20 = await minetableErc20Factory
      .connect(admin)
      .deploy("Mineral", "MNR");
    await mintableErc20.deployed();
    peon = await peonFactory
      .connect(admin)
      .deploy(admin.address, mintableErc20.address, 20000);
    await peon.deployed();
    await peon.preSale(1);
    await mintableErc20.setPeonAddress(peon.address);
    await peon.startSale();
  });
  it("setup peon and token", async function () {
    expect(await mintableErc20.peonAddress()).to.equal(peon.address);
    expect(await peon.treasuryKeeperAddress()).to.equal(admin.address);
    expect(await peon.mineralTokenAddress()).to.equal(mintableErc20.address);
  });
  it("should allow admin pre-own peons", async function () {
    const mintableErc20 = await minetableErc20Factory
      .connect(admin)
      .deploy("Mineral", "MNR");
    await mintableErc20.deployed();
    const peon = await peonFactory
      .connect(admin)
      .deploy(admin.address, mintableErc20.address, 20000);
    await peon.deployed();
    await peon.preSale(2);
    await mintableErc20.setPeonAddress(peon.address);

    expect(await peon.ownerOf(0)).to.equal(admin.address);
    expect(await peon.ownerOf(1)).to.equal(admin.address);
    await expect(peon.ownerOf(2)).to.be.revertedWith(
      "ERC721: owner query for nonexistent token"
    );

    expect(await peon.withdrawAmount()).to.equal(0);
    expect(await peon.mintedPeon()).to.equal(2);
  });
  it("user mint one peon", async function () {
    await peon
      .connect(user1)
      .mint(1, { value: ethers.utils.parseEther("0.042") });
    expect(await peon.ownerOf(0)).to.equal(admin.address);
    expect(await peon.ownerOf(1)).to.equal(user1.address);
    expect(await peon.efficiencyOf(1)).to.not.equal(0);
  });
  it("user cannot mint if max peon", async function () {
    const mintableErc20 = await minetableErc20Factory
      .connect(admin)
      .deploy("Mineral", "MNR");
    await mintableErc20.deployed();
    const peon = await peonFactory
      .connect(admin)
      .deploy(admin.address, mintableErc20.address, 2);
    await peon.deployed();
    await peon.preSale(1);
    await mintableErc20.setPeonAddress(peon.address);
    await peon.startSale();

    await peon
      .connect(user1)
      .mint(1, { value: ethers.utils.parseEther("0.042") });
    await expect(
      peon.connect(user1).mint(1, { value: ethers.utils.parseEther("0.042") })
    ).to.to.revertedWith("Purchase would exceed max supply of tokens");
  });
  it("mint multiple peons", async function () {
    await peon
      .connect(user1)
      .mint(10, { value: ethers.utils.parseEther("0.42") });
    expect(await peon.withdrawAmount()).to.equal(BigInt("420000000000000000"));
    expect(await peon.mintedPeon()).to.equal(11);
  });
  it("should not allow mint too many token at a time", async function () {
    await expect(
      peon.connect(user1).mint(11, { value: ethers.utils.parseEther("0.462") })
    ).to.be.revertedWith("Exceeded max token purchase");
  });

  it("should allow owner transfer peon", async function () {
    await peon.connect(admin).transferFrom(admin.address, user1.address, 0);
    expect(await peon.ownerOf(0)).to.equal(user1.address);
  });

  it("should allow transfer once", async function () {
    await peon.connect(admin).transferFrom(admin.address, user1.address, 0);
    await expect(
      peon.connect(admin).transferFrom(admin.address, user2.address, 0)
    ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
  });

  it("should not allow transfer other people peon", async function () {
    await expect(
      peon.connect(user1).transferFrom(admin.address, user1.address, 0)
    ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
  });
  it("buyer can bid for a peon", async function () {
    const userFundBefore = (
      await ethers.provider.getBalance(user1.address)
    ).toBigInt();
    const contractFundBefore = (
      await ethers.provider.getBalance(peon.address)
    ).toBigInt();

    await peon.connect(user1).bid(0, { value: ethers.utils.parseEther("0.1") });

    expect(await peon.getBid(0, user1.address)).to.equal(
      ethers.utils.parseEther("0.1")
    );

    const contractFundDelta =
      (await ethers.provider.getBalance(peon.address)).toBigInt() -
      contractFundBefore;
    const userFundDelta =
      (await ethers.provider.getBalance(user1.address)).toBigInt() -
      userFundBefore;

    expect(
      contractFundDelta === BigNumber.from(10).pow(17).toBigInt()
    ).to.equal(true);
    expect(
      parseInt(
        (userFundDelta / BigNumber.from(10).pow(17).toBigInt()).toString()
      )
    ).to.equal(-1);
  });
  it("owner can accept a bid", async function () {
    await peon.connect(user1).bid(0, { value: ethers.utils.parseEther("0.1") });
    const adminFundBefore = (
      await ethers.provider.getBalance(admin.address)
    ).toBigInt();
    const contractFundBefore = (
      await ethers.provider.getBalance(peon.address)
    ).toBigInt();
    expect(await peon.ownerOf(0)).to.equal(admin.address);
    await peon.connect(admin).approve(peon.address, 0);
    await peon.connect(admin).accept(0, user1.address);
    expect(await peon.ownerOf(0)).to.equal(user1.address);
    const deltaContract =
      (await ethers.provider.getBalance(peon.address)).toBigInt() -
      contractFundBefore;
    const adminDelta =
      (await ethers.provider.getBalance(admin.address)).toBigInt() -
      adminFundBefore;
    expect(
      parseInt(
        (deltaContract / BigNumber.from(10).pow(17).toBigInt()).toString()
      )
    ).to.equal(-1);
    const gasFee = BigNumber.from(10).pow(15).toBigInt();
    expect(
      parseInt(
        (
          (adminDelta + gasFee) /
          BigNumber.from(10).pow(17).toBigInt()
        ).toString()
      )
    ).to.equal(1);
    expect(await peon.getBid(0, user1.address)).to.equal(
      ethers.utils.parseEther("0")
    );
  });
  it("only owner can accept a bid", async function () {
    await peon.connect(user1).bid(0, { value: ethers.utils.parseEther("0.1") });
    await peon.connect(admin).approve(peon.address, 0);
    await expect(
      peon.connect(user1).accept(0, user1.address)
    ).to.be.revertedWith("You are not owner of this peon");
  });
  it("buyer can withdraw the bid", async function () {
    await peon.connect(user1).bid(0, { value: ethers.utils.parseEther("0.1") });
    await peon.connect(user1).cancel(0);
    expect(await peon.getBid(0, user1.address)).to.equal(
      ethers.utils.parseEther("0")
    );
    expect(
      parseInt(
        (await ethers.provider.getBalance(peon.address)).toBigInt().toString()
      )
    ).to.equal(0);
  });
  it("user cannot bid more than once", async function () {
    await peon.connect(user1).bid(0, { value: ethers.utils.parseEther("0.1") });
    await expect(
      peon.connect(user1).bid(0, { value: ethers.utils.parseEther("0.12") })
    ).to.be.revertedWith(
      "You already have a bid for peon. Please cancel if you would like to bid another price"
    );
  });
  it("multiple users can bid the same peon", async function () {
    await peon.connect(user1).bid(0, { value: ethers.utils.parseEther("0.1") });
    await peon.connect(user2).bid(0, { value: ethers.utils.parseEther("0.2") });
    expect(await peon.getBid(0, user1.address)).to.equal(
      ethers.utils.parseEther("0.1")
    );
    expect(await peon.getBid(0, user2.address)).to.equal(
      ethers.utils.parseEther("0.2")
    );
  });
  it("user can bid many peons at a time", async function () {
    const mintableErc20 = await minetableErc20Factory
      .connect(admin)
      .deploy("Mineral", "MNR");
    await mintableErc20.deployed();
    const peon = await peonFactory
      .connect(admin)
      .deploy(admin.address, mintableErc20.address, 20000);
    await peon.deployed();
    await peon.preSale(2);
    await mintableErc20.setPeonAddress(peon.address);
    await peon.startSale();

    await peon.connect(user1).bid(0, { value: ethers.utils.parseEther("0.1") });
    await peon.connect(user1).bid(1, { value: ethers.utils.parseEther("0.2") });
    expect(await peon.getBid(0, user1.address)).to.equal(
      ethers.utils.parseEther("0.1")
    );
    expect(await peon.getBid(1, user1.address)).to.equal(
      ethers.utils.parseEther("0.2")
    );
  });
  it("user cannot bid their own peon", async function () {
    await expect(
      peon.connect(admin).bid(0, { value: ethers.utils.parseEther("0.1") })
    ).to.be.revertedWith("You cannot bid your own peon");
  });
  it("correctly calculate resource", async function () {
    await peon
      .connect(admin)
      .mint(1, { value: ethers.utils.parseEther("0.042") });
    expect(await peon.harvestableAmount(1)).to.equal(0);
    await ethers.provider.send("evm_mine", []);
    expect(await peon.efficiencyOf(1)).to.be.gt(0);
    expect((await peon.harvestableAmount(1)).toString()).to.equal(
      (
        (await peon.efficiencyOf(1)).toBigInt() *
        BigNumber.from(10).pow(16).toBigInt()
      ).toString()
    );
  });
  it("withdraw resource when transfer peon to owner", async function () {
    await peon
      .connect(admin)
      .mint(1, { value: ethers.utils.parseEther("0.042") });
    expect((await mintableErc20.balanceOf(admin.address)).toString()).to.equal(
      "0"
    );
    await peon.transferFrom(admin.address, user1.address, 1);
    expect((await mintableErc20.balanceOf(admin.address)).toString()).to.equal(
      (
        (await peon.efficiencyOf(1)).toBigInt() *
        BigNumber.from(10).pow(16).toBigInt()
      ).toString()
    );
  });
  it("withdraw resource when transfer peon to owner after a block", async function () {
    await peon
      .connect(admin)
      .mint(1, { value: ethers.utils.parseEther("0.042") });
    await ethers.provider.send("evm_mine", []);
    expect((await mintableErc20.balanceOf(admin.address)).toString()).to.equal(
      "0"
    );
    await peon.transferFrom(admin.address, user1.address, 1);
    expect((await mintableErc20.balanceOf(admin.address)).toString()).to.equal(
      (
        (await peon.efficiencyOf(1)).toBigInt() *
        2n *
        BigNumber.from(10).pow(16).toBigInt()
      ).toString()
    );
  });
  it("withdraw resource after accepting a bid", async function () {
    await peon
      .connect(admin)
      .mint(1, { value: ethers.utils.parseEther("0.042") });
    expect((await mintableErc20.balanceOf(admin.address)).toString()).to.equal(
      "0"
    );
    const startBlockNumber = (await ethers.provider.getBlock("latest")).number;
    await peon.connect(user1).bid(1, { value: ethers.utils.parseEther("0.1") });
    await ethers.provider.send("evm_mine", []);
    await peon.connect(admin).approve(peon.address, 1);
    await peon.connect(admin).accept(1, user1.address);
    const testBlockNumber = (await ethers.provider.getBlock("latest")).number;
    expect((await mintableErc20.balanceOf(admin.address)).toString()).to.equal(
      (
        (await peon.efficiencyOf(1)).toBigInt() *
        BigNumber.from(testBlockNumber - startBlockNumber).toBigInt() *
        BigNumber.from(10).pow(16).toBigInt()
      ).toString()
    );
  });
  it("new owner can accept a bid from previous sells", async function () {
    await peon.connect(user1).bid(0, { value: ethers.utils.parseEther("0.1") });
    await peon.connect(user2).bid(0, { value: ethers.utils.parseEther("0.2") });
    await peon.connect(admin).accept(0, user1.address);
    expect(await peon.ownerOf(0)).to.equal(user1.address);
    await peon.connect(user1).accept(0, user2.address);
    expect(await peon.ownerOf(0)).to.equal(user2.address);
  });
  it("new owner cannot accept their own bid from previous sell", async function () {
    await peon.connect(user1).bid(0, { value: ethers.utils.parseEther("0.1") });
    await peon.connect(user2).bid(0, { value: ethers.utils.parseEther("0.2") });
    await peon.connect(admin).accept(0, user1.address);
    await expect(
      peon.connect(user1).accept(0, user1.address)
    ).to.be.revertedWith("Could not find bidder address");
  });
  it("keeper can withdraw fund", async function () {
    await peon
      .connect(user1)
      .mint(1, { value: ethers.utils.parseEther("0.042") });
    const contractFundBefore = (
      await ethers.provider.getBalance(peon.address)
    ).toBigInt();
    const adminFundBefore = (
      await ethers.provider.getBalance(admin.address)
    ).toBigInt();
    expect(contractFundBefore.toString()).to.not.equal("0");
    await peon.connect(admin).withdraw();
    const contractFundAfter = (
      await ethers.provider.getBalance(peon.address)
    ).toBigInt();
    const adminFundAfter = (
      await ethers.provider.getBalance(admin.address)
    ).toBigInt();
    expect(contractFundAfter.toString()).to.equal("0");
    expect(
      (adminFundAfter - adminFundBefore).toString().substring(0, 3)
    ).to.equal("419"); // 0.042 - gas fee
  });
  it("only keeper can withdraw fund", async function () {
    await expect(peon.connect(user1).withdraw()).to.be.revertedWith(
      "You are not treasury keeper"
    );
  });
  it("user cannot mint if not sale", async function () {
    const mintableErc20 = await minetableErc20Factory
      .connect(admin)
      .deploy("Mineral", "MNR");
    await mintableErc20.deployed();
    const peon = await peonFactory
      .connect(admin)
      .deploy(admin.address, mintableErc20.address, 2000);
    await peon.deployed();
    await peon.preSale(1);
    await mintableErc20.setPeonAddress(peon.address);
    await expect(
      peon.connect(user1).mint(1, { value: ethers.utils.parseEther("0.042") })
    ).to.be.revertedWith("Sale was not started");
  });
  it("user cannot bid if not sale", async function () {
    const mintableErc20 = await minetableErc20Factory
      .connect(admin)
      .deploy("Mineral", "MNR");
    await mintableErc20.deployed();
    const peon = await peonFactory
      .connect(admin)
      .deploy(admin.address, mintableErc20.address, 2000);
    await peon.deployed();
    await peon.preSale(1);
    await mintableErc20.setPeonAddress(peon.address);
    await expect(
      peon.connect(user1).bid(0, { value: ethers.utils.parseEther("0.1") })
    ).to.be.revertedWith("Sale was not started");
  });
  it("admin cannot withdraw if not sale", async function () {
    const mintableErc20 = await minetableErc20Factory
      .connect(admin)
      .deploy("Mineral", "MNR");
    await mintableErc20.deployed();
    const peon = await peonFactory
      .connect(admin)
      .deploy(admin.address, mintableErc20.address, 2000);
    await peon.deployed();
    await peon.preSale(1);
    await mintableErc20.setPeonAddress(peon.address);
    await expect(peon.connect(admin).withdraw()).to.be.revertedWith(
      "Sale was not started"
    );
  });
});
