// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DHAOToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("DHAOToken", "DHAO") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals()); // 초기 공급량
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

struct Proposal {
    uint256 proposalId;
    address jobOwner;
    uint256 initialJobPayment;
}

struct TrustGame {
    uint256 proposalId;
    address jobOwner;
    uint256 initialJobPayment;
    mapping(address => uint256) distributionByJobOwner;
    mapping(address => uint256) paybackByContributors;
}

contract DHAOContract {
    address private owner;
    address private cfo;
    DHAOToken private dhaoToken;
    address[] private members;
    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => TrustGame) private trustGameHistory;
    mapping(address => uint256) private balance;
    mapping(address => uint256) private lastClaimTime;
    uint256 public constant SERVICE_FEE_PERCENT = 10;
    uint256 public constant CLAIM_INTERVAL = 30 days;
    uint256 public constant CLAIM_PERCENT = 10;

    event ProposalCreated(uint256 indexed proposalId, address jobOwner, uint256 initialJobPayment);
    event TrustGameCreated(uint256 indexed proposalId, address jobOwner);
    event Paybacked(uint256 indexed proposalId, address contributor, uint256 amount);
    event Claimed(address user, uint256 amount);

    constructor( address _cfo, address[] memory _members) {
        dhaoToken = new DHAOToken(100000000);
        owner = msg.sender;
        dhaoToken.transfer(owner, 100000000 * 10 ** dhaoToken.decimals());
        cfo = _cfo;
        for (uint256 i = 0; i < _members.length; i++) {
            members.push(_members[i]);
        }
    }

    //modifier

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyCFO() {
        require(msg.sender == cfo, "Not the cfo");
        _;
    }

    modifier onlyJobOwner(uint256 proposalId) {
        require(msg.sender == trustGameHistory[proposalId].jobOwner, "Not the jobOwner");
        _;
    }

        // View functions
    function getOwner() external view returns (address) {
        return owner;
    }
    
    function getCfo() external view returns (address) {
        return cfo;
    }
    
    function getTokenAdress() external view returns (address) {
        return address(dhaoToken);
    }
    
    function getMember(uint256 index) external view returns (address) {
        require(index < members.length, "Index out of bounds");
        return members[index];
    }
    
    function getMembersCount() external view returns (uint256) {
        return members.length;
    }
    
    function getBalance(address user) external view returns (uint256) {
        return balance[user];
    }
    
    function getLastClaimTime(address user) external view returns (uint256) {
        return lastClaimTime[user];
    }
    
    // Proposal view function
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address jobOwner,
        uint256 initialJobPayment
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposalId,
            proposal.jobOwner,
            proposal.initialJobPayment
        );
    }
    
    // TrustGame view functions
    function getTrustGameBasicInfo(uint256 proposalId) external view returns (
        uint256 id,
        address jobOwner,
        uint256 initialJobPayment
    ) {
        TrustGame storage game = trustGameHistory[proposalId];
        return (
            proposalId,
            game.jobOwner,
            game.initialJobPayment
        );
    }
    
    function getTrustGameDistributionByContributor(uint256 proposalId, address contributor) external view returns (uint256) {
        return trustGameHistory[proposalId].distributionByJobOwner[contributor];
    }
    
    function getTrustGamePaybackByContributor(uint256 proposalId, address contributor) external view returns (uint256) {
        return trustGameHistory[proposalId].paybackByContributors[contributor];
    }

    //owner functions

    function addMember(address member) external onlyOwner {
        members.push(member);
    }
    
    function removeMember(address member) external onlyOwner {
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == member) {
                members[i] = members[members.length - 1];
                members.pop();
            }
        }
    }

    function mintDHAOToken(address to, uint256 amount) external onlyOwner {
        dhaoToken.mint(to, amount);
    }

    // function createProposal()

    function createProposal(uint256 proposalId, address jobOwner, uint256 initialJobPayment) onlyCFO external {
        require(proposals[proposalId].jobOwner == address(0), "proposal already exists");
        Proposal storage newProposal = proposals[proposalId];
        newProposal.proposalId = proposalId;
        newProposal.jobOwner = jobOwner;
        newProposal.initialJobPayment = initialJobPayment;
        emit ProposalCreated(proposalId, jobOwner, initialJobPayment); 
    }

    function createTrustGameByJobOwner(uint256 proposalId, address[] calldata contributors, uint256[] calldata allocatedAmounts) external onlyJobOwner(proposalId) {
        require(proposals[proposalId].jobOwner != address(0), "Proposal does not exist");
        require(contributors.length == allocatedAmounts.length, "Mismatched arrays");
        require(trustGameHistory[proposalId].jobOwner == address(0) , "Already distributed");
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < allocatedAmounts.length; i++) {
            totalAmount += allocatedAmounts[i];
        }
        require(totalAmount <= proposals[proposalId].initialJobPayment * (100-SERVICE_FEE_PERCENT) / 100, "Total amount is bigger than initial job payment");
        
        for (uint256 i = 0; i < contributors.length; i++) {
            address contributor = contributors[i];
            uint256 amount = allocatedAmounts[i];
            trustGameHistory[proposalId].distributionByJobOwner[contributor] = amount;
            balance[contributor] += amount * 2;
        }
        
        emit TrustGameCreated(proposalId, msg.sender);
    }

    function paybackedByContributor(uint256 proposalId, uint256 paybackAmount) external {
        address contributor = msg.sender;
        require(trustGameHistory[proposalId].jobOwner != address(0), "Trust game does not exist");
        require(trustGameHistory[proposalId].distributionByJobOwner[contributor] != 0, "You did not get distributed");
        require(trustGameHistory[proposalId].distributionByJobOwner[contributor] >= paybackAmount, "tip amount exceeds distributed amount");
        require(balance[contributor] >= paybackAmount, "Not enough balance");
        
        trustGameHistory[proposalId].paybackByContributors[contributor] = paybackAmount;
        
        address jobOwner = trustGameHistory[proposalId].jobOwner;
        
        balance[contributor] -= paybackAmount;
        balance[jobOwner] += paybackAmount;
        
        emit Paybacked(proposalId, contributor, paybackAmount);
    }

    function claim() external {
        require(block.timestamp >= lastClaimTime[msg.sender] + CLAIM_INTERVAL, "Claim interval not passed");
        
        uint256 claimAmount = balance[msg.sender] * CLAIM_PERCENT / 100;
        require(claimAmount > 0, "Nothing to claim");
        
        balance[msg.sender] -= claimAmount;
        lastClaimTime[msg.sender] = block.timestamp;

        dhaoToken.mint(msg.sender, claimAmount);
        
        emit Claimed(msg.sender, claimAmount);
    }
    
}
