pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IMintableERC20.sol";

/**
* Peon is a worker who can produce mineral
* Each peon has efficiency property to indicate how fast the peon generates mineral
* can be minted by anyone. Efficiency level will be randomly assign to peon after the peon minted
* The higher efficiency, the faster mineral generated for that peon.
* mineral is unlimited. Future projects utilize the mineral.
* Twenty thousand (20,000) peon could be minted. Cost to mint a peon is 1.1 BNB excluding gas fee
* maximum 10 peons can be minted at a time (i.e. in one transaction).
* Fee goes into treasuryKeeper for further developing this project in future.
* Only 1% (200) peons are allocated to the team for marketing purpose.
* Peon can be traded by active bidding system.
* Buyer bids with a BNB amount for any peon. Owner can accept a bid to transfer peon to a new owner. Buyer can cancel at any time to withdraw BNB.
*/
contract Peon is ERC721 {
    address public treasuryKeeperAddress;
    address public mineralTokenAddress;
    mapping(uint => uint256) lastHarvestedBlock;
    mapping(uint => uint) efficiency;
    mapping(uint => mapping(address => uint256)) bids;
    uint public mintedPeon = 0;
    uint public maxPeon;
    uint256 public mintFee = 0.042 * 10**18;
    uint public maxBuy = 10;
    uint funded = 0;

    event MintedPeon(uint indexed peonId, address indexed owner);

    constructor(address _treasuryKeeperAddress,
        address _mineralTokenAddress,
        uint _maxPeon,
        uint adminPreown) ERC721("Peon", "PEON") {
        treasuryKeeperAddress = _treasuryKeeperAddress;
        mineralTokenAddress = _mineralTokenAddress;
        maxPeon = _maxPeon;
        for(uint i = 0; i < adminPreown; i++) {
            _mintPeon(msg.sender, i);
        }
    }

    function bid(uint peonId) public payable {
        require(bids[peonId][msg.sender] == 0, "You already have a bid for peon. Please cancel if you would like to bid another price");
        require(ownerOf(peonId) != msg.sender, "You cannot bid your own peon");
        bids[peonId][msg.sender] = msg.value;
    }

    function getBid(uint peonId, address bidder) public view returns (uint256) {
        return bids[peonId][bidder];
    }

    function cancel(uint peonId) public payable {
        require(bids[peonId][msg.sender] != 0, "You don't have any bid for this peon");
        Address.sendValue(payable(msg.sender), bids[peonId][msg.sender]);
        bids[peonId][msg.sender] = 0;
    }

    function accept(uint peonId, address bidder) public payable {
        address currentOwner = ownerOf(peonId);
        require(currentOwner == msg.sender, "You are not owner of this peon");
        require(bids[peonId][bidder] > 0, "Could not find bidder address");
        Address.sendValue(payable(currentOwner), bids[peonId][bidder]);
        safeTransferFrom(currentOwner, bidder, peonId);
        bids[peonId][bidder] = 0;
    }

    function _mintPeon(address sender, uint peonId) private {
        _safeMint(sender, peonId);
        efficiency[peonId] = randomEfficiency();
        lastHarvestedBlock[peonId] = block.number;
        mintedPeon += 1;
    }

    function mint(uint numberOfPeons) public payable {
        require(numberOfPeons <= maxBuy, "Exceeded max token purchase");
        require(mintedPeon + numberOfPeons <= maxPeon, "Purchase would exceed max supply of tokens");
        require(mintFee * numberOfPeons <= msg.value, "Ether value sent is not correct");

        for(uint i = 0; i < numberOfPeons; i++) {
            uint peonId = mintedPeon + i;
            if (peonId < maxPeon) {
                _mintPeon(msg.sender, peonId);
                funded += 1;
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
        uint pow = IMintableERC20(mineralTokenAddress).decimals();
        return numberOfBlocks * 10**pow * efficiency[peonId] / 100;
    }

    function withdraw() public payable {
        require(treasuryKeeperAddress == msg.sender, "You are not treasury keeper");
        require(funded > 0, "no fund to withdraw");
        uint256 withdrawable = funded * mintFee;
        Address.sendValue(payable(treasuryKeeperAddress), withdrawable);
        funded = 0;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override (ERC721) {
        if (from != address(0)) _harvest(tokenId, from);
    }

    function withdrawAmount() public view returns (uint256){
        require(treasuryKeeperAddress == msg.sender, "You are not treasury keeper");
        return funded * mintFee;
    }

    function harvest(uint peonId) public {
        address sender = msg.sender;
        require(ownerOf(peonId) == sender, "Token is not owned by sender");
        _harvest(peonId, sender);
    }

    function _harvest(uint peonId, address receiver) internal {
        IMintableERC20(mineralTokenAddress).mint(receiver, harvestableAmount(peonId));
        lastHarvestedBlock[peonId] = block.number;
    }
}