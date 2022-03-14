//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/SafeMath.sol";

import "hardhat/console.sol";

// ETHPool
/// @author hosokawa-zen
contract ETHPool is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // Deposited K amount map: address => k
    mapping(address => uint256) private depositedKMap;
    // Total K
    uint256 public totalKAmt;

    // Total Deposited Amount
    uint256 public totalDepositAmt;

    /**
    * ****************************************
    *
    * Events
    * ****************************************
    */
    event Receive(uint256 _amount);
    event Deposit(address _user, uint256 _amount);
    event DepositReward(uint256 _amount);
    event Withdraw(address _user, uint256 _amount);

    /**
    * ****************************************
    *
    *   External functions
    * ****************************************
    */
    /// @dev Users deposit Ether to the pool
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "ETHPool: Invalid amount");

        // calculate k
        /// @dev
        /// if total_deposited_K == 0 | total_deposited_coin == 0
        ///     => k = amount
        /// else
        ///     => k = amount * total_deposited_K / total_deposited_coin
        uint256 depositedK = 0;
        if(totalDepositAmt == 0 || totalKAmt == 0){
            depositedK = msg.value;
        } else {
            depositedK = totalKAmt.mul(msg.value)/totalDepositAmt;
        }

        // Set deposited map
        depositedKMap[msg.sender] = depositedKMap[msg.sender].add(depositedK);
        totalKAmt = totalKAmt.add(depositedK);

        // Set total users` deposited amount
        totalDepositAmt = totalDepositAmt.add(msg.value);

        // Pay to contract
        payable(address(this)).transfer(msg.value);

        emit Deposit(msg.sender, msg.value);
    }

    /// @dev Only Team deposit reward Ether to the pool
    function depositReward() external payable onlyOwner nonReentrant {
        require(msg.value > 0, "ETHPool: Invalid amount");

        // Set total reward deposited amount
        totalDepositAmt = totalDepositAmt.add(msg.value);

        // Pay to contract
        payable(address(this)).transfer(msg.value);

        emit DepositReward(msg.value);
    }

    /// @dev Users withdraw Ether from the pool
    function withdraw(uint256 _amount) external payable nonReentrant {

        uint256 claimableKAmt = getClaimableKAmt(msg.sender);
        require(claimableKAmt >= _amount && _amount > 0, "INVALID AMOUNT");

        // calculate claiming coin _amount
        /// @dev amount * total_deposited_coin / total_deposited_K
        uint256 claimedAmt = _amount.mul(totalDepositAmt).div(totalKAmt);

        // Set total deposited amount
        depositedKMap[msg.sender] = depositedKMap[msg.sender].sub(_amount);
        // Set total reward amount
        totalKAmt = totalKAmt.sub(_amount);
        // Set total deposit amount
        totalDepositAmt = totalDepositAmt.sub(claimedAmt);

        // Pay to contract
        payable(msg.sender).transfer(claimedAmt);

        emit Withdraw(msg.sender, claimedAmt);
    }

    /// @dev get claimable amount of user
    function getClaimableKAmt(address _addr) public view returns (uint256){
        return depositedKMap[_addr];
    }

    /**
    * ****************************************
    *
    *   Receive Ether functions
    * ****************************************
    */
    fallback() external payable {
        emit Receive(msg.value);
    }
    receive() external payable {
        emit Receive(msg.value);
    }
}
