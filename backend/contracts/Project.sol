//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

// [X] Anyone can contribute
// [X] End project if targeted contribution amount reached
// [X] Expire project if raised amount not fullfill between deadline
//    & return donated amount to all contributor .
// [X] Owner need to request contributers for withdraw amount.
// [X] Owner can withdraw amount if 50% contributors agree

contract Project{

   // Project state
    enum State {
        Fundraising,
        Expired,
        Successful
    }

    // Structs

    struct WithdrawRequest{
        string description;
        uint256 amount;
        uint256 noOfVotes;
        mapping(address => bool) voters;
        bool isCompleted;
        address payable reciptent;
    }

    // Variables
    address payable public creator;
    uint256 public minimumContribution;
    uint256 public deadline;
    uint256 public targetContribution; // required to reach at least this much amount
    uint public completeAt;
    uint256 public raisedAmount; // Total raised amount till now
    uint256 public noOfContributers;
    string public projectTitle;
    string public projectDes;
    State public state = State.Fundraising; 

    mapping (address => uint) public contributiors;
    mapping (uint256 => WithdrawRequest) public withdrawRequests;

    uint256 public numOfWithdrawRequests = 0;

    // Modifiers
    modifier isCreator(){
        require(msg.sender == creator,'You dont have access to perform this operation !');
        _;
    }

    modifier inState(State _state){
        require(state == _state,'Invalid state');
        _;
    }

    // Events

    // Event that will be emitted whenever funding will be received
    event FundingReceived(address contributor, uint amount, uint currentTotal);
    // Event that will be emitted whenever withdraw request created
    event WithdrawRequestCreated(
        uint256 requestId,
        string description,
        uint256 amount,
        uint256 noOfVotes,
        bool isCompleted,
        address reciptent
    );
    // Event that will be emitted whenever contributor vote for withdraw request
    event WithdrawVote(address voter, uint totalVote);
    // Event that will be emitted whenever contributor vote for withdraw request
    event AmountWithdrawSuccessful(
        uint256 requestId,
        string description,
        uint256 amount,
        uint256 noOfVotes,
        bool isCompleted,
        address reciptent
    );


    // @dev Create project
    // @return null

   constructor(
       address _creator,
       uint256 _minimumContribution,
       uint256 _deadline,
       uint256 _targetContribution,
       string memory _projectTitle,
       string memory _projectDes
   ) {
       creator = payable(_creator);
       minimumContribution = _minimumContribution;
       deadline = _deadline;
       targetContribution = _targetContribution;
       projectTitle = _projectTitle;
       projectDes = _projectDes;
       raisedAmount = 0;
   }

    // @dev Anyone can contribute
    // @return null

    function refreshState() public {
        if (state == State.Fundraising) {
            if (raisedAmount >= targetContribution) {
                state = State.Successful;
                completeAt = block.timestamp;
            } else if (block.timestamp >= deadline) {
                state = State.Expired;
                completeAt = block.timestamp;
            }
        }
    }

    function contribute(address _contributor) public payable {
        refreshState();
        require(state == State.Fundraising,'Invalid state');
        require(block.timestamp < deadline,'Deadline has passed !');
        require(msg.value >= minimumContribution,'Contribution amount is too low !');
        if(contributiors[_contributor] == 0){
            noOfContributers++;
        }
        contributiors[_contributor] += msg.value;
        raisedAmount += msg.value;
        emit FundingReceived(_contributor,msg.value,raisedAmount);
        refreshState();
    }

    // @dev Get contract current balance
    // @return uint 

    function getContractBalance() public view returns(uint256){
        return address(this).balance;
    }

    // @dev Request refunt if funding expired
    // @return boolean

    function requestRefund() public returns(bool) {
        refreshState();
        require(state == State.Expired,'Invalid state');
        uint256 contributedAmount = contributiors[msg.sender];
        require(contributedAmount > 0,'You dont have any contributed amount !');
        address payable user = payable(msg.sender);
        contributiors[msg.sender] = 0;
        raisedAmount -= contributedAmount;
        noOfContributers -= 1;
        user.transfer(contributedAmount);
        return true;
    }

    // @dev Request contributor for withdraw amount
    // @return null
   
    function createWithdrawRequest(string memory _description,uint256 _amount,address payable _reciptent) public isCreator() inState(State.Successful) {
        require(_amount > 0,'Amount should be greater than 0');
        require(_amount <= address(this).balance,'Requested amount exceeds contract balance');
        uint256 requestId = numOfWithdrawRequests;
        WithdrawRequest storage newRequest = withdrawRequests[requestId];
        numOfWithdrawRequests = requestId + 1;

        newRequest.description = _description;
        newRequest.amount = _amount;
        newRequest.noOfVotes = 0;
        newRequest.isCompleted = false;
        newRequest.reciptent = _reciptent;

        emit WithdrawRequestCreated(requestId,_description, _amount,0,false,_reciptent );
    }

    // @dev contributors can vote for withdraw request
    // @return null

    function voteWithdrawRequest(uint256 _requestId) public {
        refreshState();
        require(state == State.Successful,'Invalid state');
        require(_requestId < numOfWithdrawRequests,'Invalid request');
        require(contributiors[msg.sender] > 0,'Only contributor can vote !');
        WithdrawRequest storage requestDetails = withdrawRequests[_requestId];
        require(requestDetails.isCompleted == false,'Request already completed');
        require(requestDetails.voters[msg.sender] == false,'You already voted !');
        requestDetails.voters[msg.sender] = true;
        requestDetails.noOfVotes += 1;
        emit WithdrawVote(msg.sender,requestDetails.noOfVotes);
    }

    // @dev Owner can withdraw requested amount
    // @return null

    function withdrawRequestedAmount(uint256 _requestId) isCreator() inState(State.Successful) public{
        require(_requestId < numOfWithdrawRequests,'Invalid request');
        WithdrawRequest storage requestDetails = withdrawRequests[_requestId];
        require(requestDetails.isCompleted == false,'Request already completed');
        require(requestDetails.noOfVotes >= (noOfContributers + 1)/2,'At least 50% contributor need to vote for this request');
        require(requestDetails.amount <= address(this).balance,'Insufficient balance');
        requestDetails.isCompleted = true;
        requestDetails.reciptent.transfer(requestDetails.amount);

        emit AmountWithdrawSuccessful(
            _requestId,
            requestDetails.description,
            requestDetails.amount,
            requestDetails.noOfVotes,
            true,
            requestDetails.reciptent
        );

    }

    // @dev Get contract details
    // @return all the project's details

    function getProjectDetails() public view returns(
    address payable projectStarter,
    uint256 minContribution,
    uint256  projectDeadline,
    uint256 goalAmount, 
    uint completedTime,
    uint256 currentAmount, 
    string memory title,
    string memory desc,
    State currentState,
    uint256 balance
    ){
        projectStarter=creator;
        minContribution=minimumContribution;
        projectDeadline=deadline;
        goalAmount=targetContribution;
        completedTime=completeAt;
        currentAmount=raisedAmount;
        title=projectTitle;
        desc=projectDes;
        currentState=state;
        balance=address(this).balance;
    }

}
