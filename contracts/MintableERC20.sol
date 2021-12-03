pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MintableERC20 is ERC20 {
    address public peonAddress;

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        peonAddress = msg.sender;
    }

    function setPeonAddress(address _peonAddress) public {
        require(peonAddress == msg.sender, "sender does not have permission to set peon");
        peonAddress = _peonAddress;
    }

    function mint(address account, uint256 amount) public {
        require(peonAddress == msg.sender, "sender does not have permission to mint");
        _mint(account, amount);
    }
}