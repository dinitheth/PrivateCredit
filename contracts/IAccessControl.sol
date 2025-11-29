// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IAccessControl
 * @notice Interface for the shared AccessControl contract
 */
interface IAccessControl {
    enum Role {
        None,
        Borrower,
        Lender,
        Admin
    }
    
    function getRole(address _user) external view returns (Role);
    function isAdmin(address _user) external view returns (bool);
    function isLender(address _user) external view returns (bool);
    function isBorrower(address _user) external view returns (bool);
}
