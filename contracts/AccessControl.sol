// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IAccessControl.sol";

/**
 * @title AccessControl
 * @notice Shared role-based access control for all Private Credit dApp contracts
 * @dev Single instance deployed and referenced by all other contracts
 */
contract AccessControl is IAccessControl {
    
    mapping(address => Role) private userRoles;
    
    address[] private allBorrowers;
    address[] private allLenders;
    address[] private allAdmins;
    
    address public immutable owner;
    
    event RoleGranted(address indexed user, Role role, address indexed grantedBy);
    event RoleRevoked(address indexed user, Role previousRole, address indexed revokedBy);
    
    constructor() {
        owner = msg.sender;
        userRoles[msg.sender] = Role.Admin;
        allAdmins.push(msg.sender);
        emit RoleGranted(msg.sender, Role.Admin, address(0));
    }
    
    modifier onlyAdmin() {
        require(userRoles[msg.sender] == Role.Admin, "Admin access required");
        _;
    }
    
    function registerAsBorrower() external {
        require(userRoles[msg.sender] == Role.None, "Already has a role");
        userRoles[msg.sender] = Role.Borrower;
        allBorrowers.push(msg.sender);
        emit RoleGranted(msg.sender, Role.Borrower, msg.sender);
    }
    
    function registerAsLender() external {
        require(userRoles[msg.sender] == Role.None, "Already has a role");
        userRoles[msg.sender] = Role.Lender;
        allLenders.push(msg.sender);
        emit RoleGranted(msg.sender, Role.Lender, msg.sender);
    }
    
    function grantAdmin(address _user) external onlyAdmin {
        require(_user != address(0), "Invalid address");
        require(userRoles[_user] != Role.Admin, "Already an admin");
        userRoles[_user] = Role.Admin;
        allAdmins.push(_user);
        emit RoleGranted(_user, Role.Admin, msg.sender);
    }
    
    function grantLender(address _user) external onlyAdmin {
        require(_user != address(0), "Invalid address");
        Role previousRole = userRoles[_user];
        userRoles[_user] = Role.Lender;
        if (previousRole == Role.None) {
            allLenders.push(_user);
        }
        emit RoleGranted(_user, Role.Lender, msg.sender);
    }
    
    function revokeRole(address _user) external onlyAdmin {
        require(_user != owner, "Cannot revoke owner");
        require(userRoles[_user] != Role.None, "No role to revoke");
        Role previousRole = userRoles[_user];
        userRoles[_user] = Role.None;
        emit RoleRevoked(_user, previousRole, msg.sender);
    }
    
    function getRole(address _user) external view override returns (Role) {
        return userRoles[_user];
    }
    
    function isAdmin(address _user) public view override returns (bool) {
        return userRoles[_user] == Role.Admin;
    }
    
    function isLender(address _user) public view override returns (bool) {
        return userRoles[_user] == Role.Lender || userRoles[_user] == Role.Admin;
    }
    
    function isBorrower(address _user) public view override returns (bool) {
        return userRoles[_user] == Role.Borrower || userRoles[_user] == Role.Admin;
    }
    
    function getRoleCounts() external view returns (
        uint256 borrowerCount,
        uint256 lenderCount,
        uint256 adminCount
    ) {
        require(isAdmin(msg.sender), "Admin access required");
        return (allBorrowers.length, allLenders.length, allAdmins.length);
    }
}
