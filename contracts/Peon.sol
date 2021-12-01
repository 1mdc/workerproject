pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./IMintableERC20.sol";

/**
* Peon is a worker who can produce mineral
* Each peon has efficiency property to indicate how fast the peon generates mineral
* can be minted by anyone. Efficiency level will be randomly assign to peon after the peon minted
* The higher efficiency, the faster mineral generated for that peon.
* mineral is unlimited. Future projects utilize the mineral.
* Fifty thousand (50,000) peon could be minted. Cost to mint a peon is 0.042 ETH excluding gas fee
* maximum 10 peons can be minted at a time (in one transaction).
* Fee goes into treasuryKeeper for further developing this project in future
*/
contract Peon is ERC721 {
    address treasuryKeeperAddress;
    address mineralTokenAddress;
    mapping(uint => uint256) lastHarvestedBlock;
    mapping(uint => uint) efficiency;
    mapping(uint => mapping(address => uint256)) bids;
    uint mintedPeon = 0;
    uint maxPeon = 20000;
    uint256 mintFee = 0.042 * 10**18;
    uint maxBuy = 10;

    constructor(address _treasuryKeeperAddress, address _mineralTokenAddress) ERC721("Peon", "PEON") {
        treasuryKeeperAddress = _treasuryKeeperAddress;
        mineralTokenAddress = _mineralTokenAddress;
    }

    function bid(uint peonId) public payable {
        require(bids[peonId][msg.sender] == 0, "You already have a bid for peon. Please cancel if you would like to bid another price");
        bids[peonId][msg.sender] = msg.value;
    }

    function cancel(uint peonId) public payable {
        require(bids[peonId][msg.sender] != 0, "You don't have any bid for this peon");
        bids[peonId][msg.sender] = 0;
        Address.sendValue(payable(msg.sender), msg.value);
    }

    function accept(uint peonId, address bidder) public payable {
        require(ownerOf(peonId) == msg.sender, "You are not owner of this peon");
        require(bids[peonId][bidder] > 0, "Could not find bidder address");
        _harvest(peonId, msg.sender);
        transferFrom(msg.sender, bidder, peonId);
        Address.sendValue(payable(msg.sender), bids[peonId][bidder]);

    }

    function mint(uint numberOfPeons) public payable {
        require(numberOfPeons <= maxBuy, "Exceeded max token purchase");
        require(maxPeon + numberOfPeons <= maxPeon, "Purchase would exceed max supply of tokens");
        require(mintFee * numberOfPeons <= msg.value, "Ether value sent is not correct");

        for(uint i = 0; i < numberOfPeons; i++) {
            uint mintIndex = maxPeon;
            if (maxPeon < maxPeon) {
                _safeMint(msg.sender, mintIndex);
                efficiency[mintIndex] = randomEfficiency();
                lastHarvestedBlock[mintIndex] = block.number;
                mintedPeon += 1;
            }
        }
    }

    function randomEfficiency() private view returns (uint) {
        uint score = uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, mintedPeon))) % maxPeon;
        if (score < maxPeon / 2) {
            return 50;
        } else if (score < maxPeon * 10 / 15) {
            return 75;
        } else if (score < maxPeon * 10**2 / 125) {
            return 112;
        } else if (score < maxPeon * 10**3 / 1125) {
            return 168;
        } else if (score < maxPeon * 10**4 / 10625) {
            return 253;
        } else if (score < maxPeon * 10**5 / 103125) {
            return 379;
        } else if (score < maxPeon * 10**6 / 1015625) {
            return 569;
        } else if (score < maxPeon * 10**7 / 10078125) {
            return 854;
        } else if (score < maxPeon * 10**8 / 100390625) {
            return 1281;
        } else if (score < maxPeon * 10**9 / 1001953125 ) {
            return 1922;
        } else {
            return 2883;
        }
    }

    function efficiencyOf(uint peonId) public view returns (uint) {
        return efficiency[peonId];
    }

    function harvestableAmount(uint peonId) public view returns (uint256) {
        uint256 numberOfBlocks = block.number - lastHarvestedBlock[peonId];
        return numberOfBlocks * IMintableERC20(mineralTokenAddress).decimals() * efficiency[peonId] / 100;
    }

    function withdraw() public payable {
        require(treasuryKeeperAddress == msg.sender, "You are not treasury keeper");
        uint256 balance = address(this).balance;
        Address.sendValue(payable(treasuryKeeperAddress), balance);
    }

    function harvest(uint peonId) public {
        address sender = msg.sender;
        require(ownerOf(peonId) == sender, "Token is not owned by sender");
        _harvest(peonId, sender);
    }

    function _harvest(uint peonId, address receiver) internal {
        uint256 numberOfBlocks = block.number - lastHarvestedBlock[peonId];
        uint256 numberOfTokens = numberOfBlocks * IMintableERC20(mineralTokenAddress).decimals() * efficiency[peonId] / 100;
        IMintableERC20(mineralTokenAddress).mint(receiver, numberOfTokens);
        lastHarvestedBlock[peonId] = block.number;
    }
}