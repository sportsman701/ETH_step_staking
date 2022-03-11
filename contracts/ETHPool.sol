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

    /// User's deposited data
    struct DepositDetail {
        uint256 totalDepositAmt;
        uint256 pastDepositedAt;
    }

    // User`s Detail Data
    struct UserDetail {
        uint256 totalClaimedAmt;
        uint256 lastDepositedAt;
    }

    /// Team`s reward deposited data
    struct RewDepositDetail{
        uint256 rewAmt;
        uint256 totalDepositedAmt;
        uint256 pastRewDepositedAt;
    }

    // User Deposit Map : address => depositedAt => DepositDetail
    mapping(address => mapping(uint256 => DepositDetail)) private depositMap;
    // Last User`s Detail Data (Claimed Amount and Last Deposited Timestamp) : address => UserDetail
    mapping(address => UserDetail) userDetailMap;

    // Team Reward Deposit Map : rewardDepositedAt => RewardDepositDetail
    mapping(uint256 => RewDepositDetail) private rewDepositMap;
    // Last Team reward deposited timestamp
    uint256 public lastRewDepositedAt;

    // User Claimed Amount Map : address => rewardDepositTimestamp => claimed amount
    mapping(address => mapping(uint256 => uint256)) private claimedAmtMap;

    // Total Deposited Amount
    uint256 public totalDepositAmt;
    // Total Reward Deposited Amount
    uint256 public totalRewDepositAmt;
    // Total Claimed Amount
    uint256 public totalClaimedAmt;

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
    /// @dev get total ETH amount holding on contract
    function getTotalEth() external view returns(uint256) {
        return totalDepositAmt.add(totalRewDepositAmt).sub(totalClaimedAmt);
    }

    /// @dev Users deposit Ether to the pool
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "ETHPool: Invalid amount");

        uint256 depositedAt = block.timestamp;
        UserDetail storage ud = userDetailMap[msg.sender];
        DepositDetail storage dd = depositMap[msg.sender][depositedAt];

        // Set depositDetail
        dd.totalDepositAmt = depositMap[msg.sender][ud.lastDepositedAt].totalDepositAmt.add(msg.value);
        dd.pastDepositedAt = ud.lastDepositedAt;
        // Set user data
        ud.lastDepositedAt = depositedAt;
        // Set total users` deposited amount
        totalDepositAmt = totalDepositAmt.add(msg.value);

        // Pay to contract
        payable(address(this)).transfer(msg.value);

        emit Deposit(msg.sender, msg.value);
    }

    /// @dev Only Team deposit reward Ether to the pool
    function depositReward() external payable onlyOwner nonReentrant {
        require(msg.value > 0, "ETHPool: Invalid amount");

        uint256 depositedAt = block.timestamp;
        RewDepositDetail storage rdd = rewDepositMap[depositedAt];

        // Set reward deposit data
        rdd.rewAmt = msg.value;
        rdd.totalDepositedAmt = totalDepositAmt.sub(totalClaimedAmt);
        rdd.pastRewDepositedAt = lastRewDepositedAt;
        // Set last reward deposited timestamp
        lastRewDepositedAt = depositedAt;
        // Set total reward deposited amount
        totalRewDepositAmt = totalRewDepositAmt.add(msg.value);

        // Pay to contract
        payable(address(this)).transfer(msg.value);

        emit DepositReward(msg.value);
    }

    /// @dev Users withdraw Ether from the pool
    function withdraw() external payable nonReentrant {

        uint256 claimableAmt = getClaimableAmt(msg.sender);
        require(claimableAmt > 0, "No ETH");

        UserDetail storage ud = userDetailMap[msg.sender];
        uint256 userTotalDepositAmt = depositMap[msg.sender][ud.lastDepositedAt].totalDepositAmt;
        uint256 userRewardAmt = getRewardAmt(msg.sender, lastRewDepositedAt);

        // Reset user deposit detail
        depositMap[msg.sender][ud.lastDepositedAt].totalDepositAmt = 0;
        // Reset user`s total claimed amount
        ud.totalClaimedAmt = 0;
        // Set total deposited amount
        totalDepositAmt = totalDepositAmt.sub(userTotalDepositAmt);
        // Set total reward amount
        totalRewDepositAmt = totalRewDepositAmt.sub(userRewardAmt);
        // Reset claimedAmtMap
        claimedAmtMap[msg.sender][lastRewDepositedAt] = 0;

        // Pay to contract
        payable(msg.sender).transfer(claimableAmt);

        emit Withdraw(msg.sender, claimableAmt);
    }

    /// @dev get claimable amount of user
    function getClaimableAmt(address _addr) public view returns (uint256){
        UserDetail memory ud = userDetailMap[_addr];

        // Get user`s total deposit amount
        uint256 userTotalDepositAmt = depositMap[_addr][ud.lastDepositedAt].totalDepositAmt;
        // Calculate reward amount
        uint256 userRewardAmt = getRewardAmt(_addr, lastRewDepositedAt);
        // Calculate claimable amount
        return userTotalDepositAmt.add(userRewardAmt).sub(ud.totalClaimedAmt);
    }

    /// @dev get user`s reward amount by _rewDepositedAt point
    function getRewardAmt(address _addr, uint256 _rewDepositedAt) internal view returns (uint256){
        if(_rewDepositedAt == 0) return 0;

        UserDetail memory ud = userDetailMap[_addr];
        RewDepositDetail memory rdd = rewDepositMap[_rewDepositedAt];

        // Get user`s total deposit amount
        uint256 userTotalDepositAmt = getTotalDepositAmt(_addr, ud.lastDepositedAt, _rewDepositedAt);
        // Get user`s total claimed amount
        uint256 userTotalClaimedAmt = getClaimedAmountMap(_addr, rdd.pastRewDepositedAt);
        // Calculate reward amount
        uint256 rewardAmt = userTotalDepositAmt.sub(userTotalClaimedAmt).mul(rdd.rewAmt).div(rdd.totalDepositedAmt);

        if(rewardAmt == 0) return 0;
        return getRewardAmt(_addr, rdd.pastRewDepositedAt).add(rewardAmt);
    }

    /// @dev get user total deposit amount by _tpTimestamp
    /// @notice find first node below _tpTimestamp
    function getTotalDepositAmt(address _addr, uint256 _depositedAt, uint256 _tpTimestamp) internal view returns (uint256) {
        DepositDetail memory dd = depositMap[_addr][_depositedAt];
        if(_tpTimestamp == 0 || _depositedAt < _tpTimestamp){
            return dd.totalDepositAmt;
        }
        return getTotalDepositAmt(_addr, dd.pastDepositedAt, _tpTimestamp);
    }

    /// @dev get user total claimed amount by _rewDepositedAt
    function getClaimedAmountMap(address _addr, uint256 _rewDepositedAt) internal view returns (uint256) {
        if(_rewDepositedAt == 0 || claimedAmtMap[_addr][_rewDepositedAt] != 0){
            return claimedAmtMap[_addr][_rewDepositedAt];
        }
        return getClaimedAmountMap(_addr, rewDepositMap[_rewDepositedAt].pastRewDepositedAt);
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
