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
    uint256 public mintFee;
    uint funded = 0;
    uint public openSale = 0;
    uint public maxPerMint = 9;
    bool public isPreSale = true;

    event PeonMintedEvent(uint indexed peonId, uint indexed efficiency);
    event AcceptBidEvent(uint indexed peonId, address indexed buyer);
    event BidEvent(uint indexed peonId, address indexed buyer, uint256 indexed amount);
    event CancelEvent(uint indexed peonId, address indexed buyer);

    modifier onlyKeeper {
        require(msg.sender == treasuryKeeperAddress, "You are not treasury keeper");
        _;
    }

    constructor(address _treasuryKeeperAddress,
        address _mineralTokenAddress,
        uint _maxPeon,
        uint256 _mintFee) ERC721("Peon", "PEON") {
        treasuryKeeperAddress = _treasuryKeeperAddress;
        mineralTokenAddress = _mineralTokenAddress;
        maxPeon = _maxPeon;
        mintFee = _mintFee;
    }

    function preSale(uint numberOfPresales, address receiver) public onlyKeeper {
        require(isPreSale == true, "Pre-sale was ended");
        openSale += numberOfPresales;
        _mintGroup(receiver, numberOfPresales);
    }

    function endPresale() public onlyKeeper {
        require(isPreSale == true, "Pre-sale was ended");
        isPreSale = false;
    }

    function startSale(uint numberOfSales, uint256 feeInc) public onlyKeeper {
        require(openSale + numberOfSales <= maxPeon, "Exceeded the number of max peon");
        openSale += numberOfSales;
        mintFee += feeInc;
    }

    function bid(uint peonId) public payable {
        require(mintedPeon < openSale, "Sale was not started");
        require(bids[peonId][msg.sender] == 0, "You already have a bid for peon. Please cancel if you would like to bid another price");
        require(ownerOf(peonId) != msg.sender, "You cannot bid your own peon");
        bids[peonId][msg.sender] = msg.value;
        emit BidEvent(peonId, msg.sender, msg.value);
    }

    function getBid(uint peonId, address bidder) public view returns (uint256) {
        return bids[peonId][bidder];
    }

    function cancel(uint peonId) public payable {
        require(mintedPeon < openSale, "Sale was not started");
        require(bids[peonId][msg.sender] != 0, "You don't have any bid for this peon");
        Address.sendValue(payable(msg.sender), bids[peonId][msg.sender]);
        delete bids[peonId][msg.sender];

        emit CancelEvent(peonId, msg.sender);
    }

    function accept(uint peonId, address bidder) public payable {
        require(mintedPeon < openSale, "Sale was not started");
        address currentOwner = ownerOf(peonId);
        require(currentOwner == msg.sender, "You are not owner of this peon");
        require(bids[peonId][bidder] > 0, "Could not find bidder address");
        Address.sendValue(payable(currentOwner), bids[peonId][bidder]);
        safeTransferFrom(currentOwner, bidder, peonId);
        delete bids[peonId][bidder];
        emit AcceptBidEvent(peonId, bidder);
    }

    function _mintPeon(address sender, uint peonId) private {
        _safeMint(sender, peonId);
        efficiency[peonId] = randomEfficiency();
        lastHarvestedBlock[peonId] = block.number;
        mintedPeon += 1;
        emit PeonMintedEvent(peonId, efficiency[peonId]);
    }

    function _mintGroup(address receiver, uint numberOfPeons) private {
        for(uint i = 0; i < numberOfPeons; i++) {
            _mintPeon(receiver, mintedPeon);
        }
    }

    function mint(uint numberOfPeons) public payable {
        require(numberOfPeons <= maxPerMint, "Exceeded max token purchase");
        require(mintedPeon + numberOfPeons <= maxPeon, "Purchase would exceed max supply of tokens");
        require(mintFee * numberOfPeons <= msg.value, "Ether value sent is not correct");
        require(mintedPeon + numberOfPeons <= openSale, "Sale was not started");
        _mintGroup(msg.sender, numberOfPeons);
        funded += numberOfPeons;
    }

    function randomEfficiency() private view returns (uint) {
        uint score = uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, mintedPeon))) % maxPeon;
        if (score < maxPeon / 2) {
            return 50; // level 0 ==> 100%
        } else if (score < maxPeon * 10 / 15) {
            return 75; // 50%
        } else if (score < maxPeon * 10**2 / 125) {
            return 112; // 25%
        } else if (score < maxPeon * 10**3 / 1125) {
            return 168; // 12.5%
        } else if (score < maxPeon * 10**4 / 10625) {
            return 253; // 6.25%
        } else if (score < maxPeon * 10**5 / 103125) {
            return 379; // 3.12%
        } else if (score < maxPeon * 10**6 / 1015625) {
            return 569; // 1.56%
        } else if (score < maxPeon * 10**7 / 10078125) {
            return 854; // 0.78%
        } else if (score < maxPeon * 10**8 / 100390625) {
            return 1281; // 0.39%
        } else if (score < maxPeon * 10**9 / 1001953125 ) {
            return 1922; // 0.19%
        } else {
            return 2883; // level 10 ==> 0.09%
        }
    }

    function efficiencyOf(uint peonId) public view returns (uint) {
        return efficiency[peonId];
    }

    function harvestableAmount(uint peonId) public view returns (uint256) {
        uint256 numberOfBlocks = block.number - lastHarvestedBlock[peonId];
        uint pow = IMintableERC20(mineralTokenAddress).decimals();
        uint256 distributedReward = numberOfBlocks * 50 / mintedPeon;
        return distributedReward * 10**pow * efficiency[peonId] / 100;
    }

    function withdraw() public payable onlyKeeper {
        require(mintedPeon < openSale, "Sale was not started");
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

    function withdrawAmount() public view onlyKeeper returns (uint256){
        return funded * mintFee;
    }

    function harvest(uint peonId) public {
        require(mintedPeon < openSale, "Sale was not started");
        address sender = msg.sender;
        require(ownerOf(peonId) == sender, "Token is not owned by sender");
        _harvest(peonId, sender);
    }

    function _harvest(uint peonId, address receiver) private {
        uint256 amount = harvestableAmount(peonId);
        IMintableERC20(mineralTokenAddress).mint(receiver, amount);
        lastHarvestedBlock[peonId] = block.number;
    }
}