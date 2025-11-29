// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IAccessControl.sol";

/**
 * @title EncryptedDataVault
 * @notice Stores encrypted financial data handles for privacy-preserving credit scoring
 * @dev Uses shared AccessControl instance for role-based permissions
 */
contract EncryptedDataVault {
    
    IAccessControl public immutable accessControl;
    
    struct EncryptedFinancialData {
        bytes32 salaryHandle;
        bytes32 debtsHandle;
        bytes32 expensesHandle;
        uint256 submittedAt;
        bool isActive;
    }
    
    mapping(address => EncryptedFinancialData) private userEncryptedData;
    address[] private submittedUsers;
    mapping(address => bool) private hasSubmitted;
    
    event EncryptedDataSubmitted(
        address indexed user,
        bytes32 salaryHandle,
        bytes32 debtsHandle,
        bytes32 expensesHandle,
        uint256 timestamp
    );
    
    event EncryptedDataRevoked(address indexed user, uint256 timestamp);
    
    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "Admin access required");
        _;
    }
    
    constructor(address _accessControl) {
        require(_accessControl != address(0), "Invalid AccessControl address");
        accessControl = IAccessControl(_accessControl);
    }
    
    function submitEncryptedData(
        bytes32 _salaryHandle,
        bytes32 _debtsHandle,
        bytes32 _expensesHandle
    ) external {
        require(_salaryHandle != bytes32(0), "Invalid salary handle");
        require(_debtsHandle != bytes32(0), "Invalid debts handle");
        require(_expensesHandle != bytes32(0), "Invalid expenses handle");
        
        if (!hasSubmitted[msg.sender]) {
            submittedUsers.push(msg.sender);
            hasSubmitted[msg.sender] = true;
        }
        
        userEncryptedData[msg.sender] = EncryptedFinancialData({
            salaryHandle: _salaryHandle,
            debtsHandle: _debtsHandle,
            expensesHandle: _expensesHandle,
            submittedAt: block.timestamp,
            isActive: true
        });
        
        emit EncryptedDataSubmitted(
            msg.sender,
            _salaryHandle,
            _debtsHandle,
            _expensesHandle,
            block.timestamp
        );
    }
    
    function getEncryptedData(address _user) 
        external 
        view 
        returns (
            bytes32 salaryHandle,
            bytes32 debtsHandle,
            bytes32 expensesHandle,
            uint256 submittedAt,
            bool isActive
        ) 
    {
        require(
            msg.sender == _user || 
            accessControl.isLender(msg.sender) || 
            accessControl.isAdmin(msg.sender),
            "Not authorized"
        );
        
        EncryptedFinancialData storage data = userEncryptedData[_user];
        return (
            data.salaryHandle,
            data.debtsHandle,
            data.expensesHandle,
            data.submittedAt,
            data.isActive
        );
    }
    
    function hasActiveData(address _user) external view returns (bool) {
        return userEncryptedData[_user].isActive;
    }
    
    function revokeData() external {
        require(userEncryptedData[msg.sender].isActive, "No active data");
        userEncryptedData[msg.sender].isActive = false;
        emit EncryptedDataRevoked(msg.sender, block.timestamp);
    }
    
    function getSubmittedUserCount() external view onlyAdmin returns (uint256) {
        return submittedUsers.length;
    }
}
