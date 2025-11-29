// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IAccessControl.sol";

interface ICreditScorer {
    enum RiskTier { Unknown, Low, Medium, High }
    function hasValidScore(address _user) external view returns (bool);
    function getRiskTier(address _user) external view returns (RiskTier);
}

/**
 * @title LoanManager
 * @notice Manages loan applications, approvals, and repayments
 * @dev Uses shared AccessControl and references CreditScorer for risk assessment
 */
contract LoanManager {
    
    IAccessControl public immutable accessControl;
    ICreditScorer public immutable creditScorer;
    
    enum LoanStatus { Pending, Approved, Denied, Active, Repaid, Defaulted }
    
    struct Loan {
        uint256 id;
        address borrower;
        address lender;
        uint256 amount;
        uint256 interestRate;
        uint256 termDays;
        uint256 appliedAt;
        uint256 approvedAt;
        uint256 fundedAt;
        uint256 repaidAt;
        LoanStatus status;
        ICreditScorer.RiskTier riskTier;
    }
    
    mapping(uint256 => Loan) public loans;
    uint256 public loanCounter;
    
    mapping(address => uint256[]) private borrowerLoans;
    mapping(address => uint256[]) private lenderLoans;
    
    mapping(ICreditScorer.RiskTier => uint256) public tierInterestRates;
    mapping(ICreditScorer.RiskTier => uint256) public tierMaxAmounts;
    
    event LoanApplied(uint256 indexed loanId, address indexed borrower, uint256 amount, ICreditScorer.RiskTier riskTier);
    event LoanApproved(uint256 indexed loanId, address indexed lender, uint256 interestRate);
    event LoanDenied(uint256 indexed loanId, address indexed lender, string reason);
    event LoanFunded(uint256 indexed loanId, uint256 timestamp);
    event LoanRepaid(uint256 indexed loanId, uint256 totalRepaid, uint256 timestamp);
    
    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "Admin access required");
        _;
    }
    
    modifier onlyLender() {
        require(accessControl.isLender(msg.sender), "Lender access required");
        _;
    }
    
    constructor(address _accessControl, address _creditScorer) {
        require(_accessControl != address(0), "Invalid AccessControl");
        require(_creditScorer != address(0), "Invalid CreditScorer");
        accessControl = IAccessControl(_accessControl);
        creditScorer = ICreditScorer(_creditScorer);
        
        tierInterestRates[ICreditScorer.RiskTier.Low] = 500;
        tierInterestRates[ICreditScorer.RiskTier.Medium] = 1000;
        tierInterestRates[ICreditScorer.RiskTier.High] = 1500;
        
        tierMaxAmounts[ICreditScorer.RiskTier.Low] = 100 ether;
        tierMaxAmounts[ICreditScorer.RiskTier.Medium] = 50 ether;
        tierMaxAmounts[ICreditScorer.RiskTier.High] = 10 ether;
    }
    
    function applyForLoan(uint256 _amount, uint256 _termDays) external returns (uint256) {
        require(_amount > 0, "Amount must be positive");
        require(_termDays >= 7 && _termDays <= 365, "Term must be 7-365 days");
        require(creditScorer.hasValidScore(msg.sender), "Need valid credit score");
        
        ICreditScorer.RiskTier tier = creditScorer.getRiskTier(msg.sender);
        require(tier != ICreditScorer.RiskTier.Unknown, "Invalid risk tier");
        require(_amount <= tierMaxAmounts[tier], "Amount exceeds tier limit");
        
        loanCounter++;
        
        loans[loanCounter] = Loan({
            id: loanCounter,
            borrower: msg.sender,
            lender: address(0),
            amount: _amount,
            interestRate: tierInterestRates[tier],
            termDays: _termDays,
            appliedAt: block.timestamp,
            approvedAt: 0,
            fundedAt: 0,
            repaidAt: 0,
            status: LoanStatus.Pending,
            riskTier: tier
        });
        
        borrowerLoans[msg.sender].push(loanCounter);
        
        emit LoanApplied(loanCounter, msg.sender, _amount, tier);
        
        return loanCounter;
    }
    
    function approveLoan(uint256 _loanId) external payable onlyLender {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Pending, "Loan not pending");
        require(msg.value >= loan.amount, "Insufficient funds");
        require(loan.borrower != msg.sender, "Cannot fund own loan");
        
        loan.lender = msg.sender;
        loan.approvedAt = block.timestamp;
        loan.fundedAt = block.timestamp;
        loan.status = LoanStatus.Active;
        
        lenderLoans[msg.sender].push(_loanId);
        
        payable(loan.borrower).transfer(loan.amount);
        
        if (msg.value > loan.amount) {
            payable(msg.sender).transfer(msg.value - loan.amount);
        }
        
        emit LoanApproved(_loanId, msg.sender, loan.interestRate);
        emit LoanFunded(_loanId, block.timestamp);
    }
    
    function denyLoan(uint256 _loanId, string calldata _reason) external onlyLender {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Pending, "Loan not pending");
        loan.status = LoanStatus.Denied;
        emit LoanDenied(_loanId, msg.sender, _reason);
    }
    
    function repayLoan(uint256 _loanId) external payable {
        Loan storage loan = loans[_loanId];
        require(loan.borrower == msg.sender, "Not the borrower");
        require(loan.status == LoanStatus.Active, "Loan not active");
        
        uint256 totalDue = calculateRepaymentAmount(_loanId);
        require(msg.value >= totalDue, "Insufficient repayment");
        
        loan.status = LoanStatus.Repaid;
        loan.repaidAt = block.timestamp;
        
        payable(loan.lender).transfer(totalDue);
        
        if (msg.value > totalDue) {
            payable(msg.sender).transfer(msg.value - totalDue);
        }
        
        emit LoanRepaid(_loanId, totalDue, block.timestamp);
    }
    
    function calculateRepaymentAmount(uint256 _loanId) public view returns (uint256) {
        Loan storage loan = loans[_loanId];
        uint256 interest = (loan.amount * loan.interestRate * loan.termDays) / (365 * 10000);
        return loan.amount + interest;
    }
    
    function getBorrowerLoans(address _borrower) external view returns (uint256[] memory) {
        require(
            msg.sender == _borrower || 
            accessControl.isLender(msg.sender) || 
            accessControl.isAdmin(msg.sender),
            "Not authorized"
        );
        return borrowerLoans[_borrower];
    }
    
    function getLenderLoans(address _lender) external view returns (uint256[] memory) {
        require(
            msg.sender == _lender || accessControl.isAdmin(msg.sender),
            "Not authorized"
        );
        return lenderLoans[_lender];
    }
    
    function getLoan(uint256 _loanId) external view returns (Loan memory) {
        return loans[_loanId];
    }
    
    function getPendingLoansCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= loanCounter; i++) {
            if (loans[i].status == LoanStatus.Pending) {
                count++;
            }
        }
        return count;
    }
    
    function setTierInterestRate(ICreditScorer.RiskTier _tier, uint256 _rate) external onlyAdmin {
        require(_rate <= 5000, "Rate too high");
        tierInterestRates[_tier] = _rate;
    }
    
    function setTierMaxAmount(ICreditScorer.RiskTier _tier, uint256 _amount) external onlyAdmin {
        tierMaxAmounts[_tier] = _amount;
    }
    
    receive() external payable {}
}
