// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IAccessControl.sol";

interface IEncryptedDataVault {
    function hasActiveData(address _user) external view returns (bool);
}

/**
 * @title CreditScorer
 * @notice Computes and stores encrypted credit scores
 * @dev Uses shared AccessControl instance and references EncryptedDataVault
 * Score storage is restricted to authorized scorer address (coprocessor/relayer)
 */
contract CreditScorer {
    
    IAccessControl public immutable accessControl;
    IEncryptedDataVault public immutable dataVault;
    
    address public authorizedScorer;
    
    struct CreditScore {
        bytes32 encryptedScoreHandle;
        uint256 computedAt;
        ScoreStatus status;
        RiskTier riskTier;
    }
    
    enum ScoreStatus { None, Pending, Computed, Expired }
    enum RiskTier { Unknown, Low, Medium, High }
    
    mapping(address => CreditScore) private userScores;
    mapping(address => uint256) public pendingComputations;
    
    uint256 public constant SCORE_VALIDITY_PERIOD = 30 days;
    
    event ScoreComputationRequested(address indexed user, uint256 timestamp);
    event ScoreComputed(address indexed user, bytes32 encryptedScoreHandle, RiskTier riskTier, uint256 timestamp);
    event ScoreExpired(address indexed user, uint256 timestamp);
    event AuthorizedScorerUpdated(address indexed oldScorer, address indexed newScorer);
    
    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "Admin access required");
        _;
    }
    
    modifier onlyAuthorizedScorer() {
        require(
            msg.sender == authorizedScorer || accessControl.isAdmin(msg.sender),
            "Not authorized to store scores"
        );
        _;
    }
    
    constructor(address _accessControl, address _dataVault) {
        require(_accessControl != address(0), "Invalid AccessControl");
        require(_dataVault != address(0), "Invalid DataVault");
        accessControl = IAccessControl(_accessControl);
        dataVault = IEncryptedDataVault(_dataVault);
    }
    
    function setAuthorizedScorer(address _scorer) external onlyAdmin {
        require(_scorer != address(0), "Invalid scorer address");
        address oldScorer = authorizedScorer;
        authorizedScorer = _scorer;
        emit AuthorizedScorerUpdated(oldScorer, _scorer);
    }
    
    function requestScoreComputation() external {
        require(dataVault.hasActiveData(msg.sender), "No active financial data");
        pendingComputations[msg.sender] = block.timestamp;
        userScores[msg.sender].status = ScoreStatus.Pending;
        emit ScoreComputationRequested(msg.sender, block.timestamp);
    }
    
    function storeComputedScore(
        address _user,
        bytes32 _encryptedScoreHandle,
        RiskTier _riskTier
    ) external onlyAuthorizedScorer {
        require(userScores[_user].status == ScoreStatus.Pending, "No pending computation");
        require(_encryptedScoreHandle != bytes32(0), "Invalid score handle");
        require(_riskTier != RiskTier.Unknown, "Invalid risk tier");
        
        userScores[_user] = CreditScore({
            encryptedScoreHandle: _encryptedScoreHandle,
            computedAt: block.timestamp,
            status: ScoreStatus.Computed,
            riskTier: _riskTier
        });
        
        delete pendingComputations[_user];
        emit ScoreComputed(_user, _encryptedScoreHandle, _riskTier, block.timestamp);
    }
    
    function getCreditScore(address _user) 
        external 
        view 
        returns (
            bytes32 encryptedScoreHandle,
            uint256 computedAt,
            ScoreStatus status,
            RiskTier riskTier
        )
    {
        CreditScore storage score = userScores[_user];
        
        if (score.status == ScoreStatus.Computed && 
            block.timestamp > score.computedAt + SCORE_VALIDITY_PERIOD) {
            return (bytes32(0), score.computedAt, ScoreStatus.Expired, RiskTier.Unknown);
        }
        
        if (msg.sender == _user || accessControl.isAdmin(msg.sender)) {
            return (score.encryptedScoreHandle, score.computedAt, score.status, score.riskTier);
        } else if (accessControl.isLender(msg.sender)) {
            return (bytes32(0), score.computedAt, score.status, score.riskTier);
        } else {
            revert("Not authorized");
        }
    }
    
    function hasValidScore(address _user) external view returns (bool) {
        CreditScore storage score = userScores[_user];
        return score.status == ScoreStatus.Computed && 
               block.timestamp <= score.computedAt + SCORE_VALIDITY_PERIOD;
    }
    
    function getRiskTier(address _user) external view returns (RiskTier) {
        require(
            msg.sender == _user || 
            accessControl.isLender(msg.sender) || 
            accessControl.isAdmin(msg.sender),
            "Not authorized"
        );
        return userScores[_user].riskTier;
    }
}
