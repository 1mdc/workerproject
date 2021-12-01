import { expect } from "chai";
import { ethers } from "hardhat";

describe("mintable erc20", function () {
  it("Should return the new greeting once it's changed", async function () {
    const MinetableErc20Factory = await ethers.getContractFactory("MinetableERC20");
    const greeter = await MinetableErc20Factory.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
