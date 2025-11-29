// Deployment script for Private Credit dApp smart contracts
// Run: npx hardhat run deploy.js --network baseSepolia

const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting Private Credit dApp Contract Deployment...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // 1. Deploy AccessControl (single shared instance)
  console.log("1️⃣ Deploying AccessControl (shared instance)...");
  const AccessControl = await hre.ethers.getContractFactory("AccessControl");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("   ✅ AccessControl deployed to:", accessControlAddress);
  console.log("   👤 Deployer is Admin:", deployer.address);

  // 2. Deploy EncryptedDataVault (references AccessControl)
  console.log("\n2️⃣ Deploying EncryptedDataVault...");
  const EncryptedDataVault = await hre.ethers.getContractFactory("EncryptedDataVault");
  const dataVault = await EncryptedDataVault.deploy(accessControlAddress);
  await dataVault.waitForDeployment();
  const dataVaultAddress = await dataVault.getAddress();
  console.log("   ✅ EncryptedDataVault deployed to:", dataVaultAddress);

  // 3. Deploy CreditScorer (references AccessControl and DataVault)
  console.log("\n3️⃣ Deploying CreditScorer...");
  const CreditScorer = await hre.ethers.getContractFactory("CreditScorer");
  const creditScorer = await CreditScorer.deploy(accessControlAddress, dataVaultAddress);
  await creditScorer.waitForDeployment();
  const creditScorerAddress = await creditScorer.getAddress();
  console.log("   ✅ CreditScorer deployed to:", creditScorerAddress);

  // 4. Deploy LoanManager (references AccessControl and CreditScorer)
  console.log("\n4️⃣ Deploying LoanManager...");
  const LoanManager = await hre.ethers.getContractFactory("LoanManager");
  const loanManager = await LoanManager.deploy(accessControlAddress, creditScorerAddress);
  await loanManager.waitForDeployment();
  const loanManagerAddress = await loanManager.getAddress();
  console.log("   ✅ LoanManager deployed to:", loanManagerAddress);

  // 5. Post-deployment configuration
  console.log("\n5️⃣ Configuring contracts...");
  
  // Set the deployer as the authorized scorer (in production, this would be the coprocessor)
  console.log("   Setting authorized scorer...");
  const creditScorerContract = await hre.ethers.getContractAt("CreditScorer", creditScorerAddress);
  await creditScorerContract.setAuthorizedScorer(deployer.address);
  console.log("   ✅ Authorized scorer set to deployer (for testing)");
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("─".repeat(40));
  console.log("AccessControl:      ", accessControlAddress);
  console.log("EncryptedDataVault: ", dataVaultAddress);
  console.log("CreditScorer:       ", creditScorerAddress);
  console.log("LoanManager:        ", loanManagerAddress);
  
  console.log("\n🔗 Contract Dependencies:");
  console.log("─".repeat(40));
  console.log("AccessControl ← EncryptedDataVault");
  console.log("AccessControl ← CreditScorer ← DataVault");
  console.log("AccessControl ← LoanManager ← CreditScorer");

  console.log("\n📝 Add these to your frontend .env file:");
  console.log("─".repeat(40));
  console.log(`VITE_ACCESS_CONTROL_ADDRESS=${accessControlAddress}`);
  console.log(`VITE_DATA_VAULT_ADDRESS=${dataVaultAddress}`);
  console.log(`VITE_CREDIT_SCORER_ADDRESS=${creditScorerAddress}`);
  console.log(`VITE_LOAN_MANAGER_ADDRESS=${loanManagerAddress}`);

  console.log("\n🔐 Roles & Permissions:");
  console.log("─".repeat(40));
  console.log("Admin:", deployer.address);
  console.log("Authorized Scorer:", deployer.address, "(for testing)");
  console.log("\n⚠️  In production, set authorizedScorer to the FHE coprocessor address");

  console.log("\n🔍 Verify contracts on BaseScan:");
  console.log("─".repeat(40));
  console.log(`npx hardhat verify --network baseSepolia ${accessControlAddress}`);
  console.log(`npx hardhat verify --network baseSepolia ${dataVaultAddress} "${accessControlAddress}"`);
  console.log(`npx hardhat verify --network baseSepolia ${creditScorerAddress} "${accessControlAddress}" "${dataVaultAddress}"`);
  console.log(`npx hardhat verify --network baseSepolia ${loanManagerAddress} "${accessControlAddress}" "${creditScorerAddress}"`);

  console.log("\n📖 Next Steps:");
  console.log("─".repeat(40));
  console.log("1. Users call registerAsBorrower() or registerAsLender() on AccessControl");
  console.log("2. Borrowers submit encrypted data via EncryptedDataVault");
  console.log("3. Borrowers request score computation via CreditScorer");
  console.log("4. Authorized scorer stores computed scores");
  console.log("5. Borrowers apply for loans via LoanManager");
  console.log("6. Lenders approve and fund loans");

  return {
    accessControl: accessControlAddress,
    dataVault: dataVaultAddress,
    creditScorer: creditScorerAddress,
    loanManager: loanManagerAddress,
  };
}

main()
  .then((addresses) => {
    console.log("\n✨ All contracts deployed and configured successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
