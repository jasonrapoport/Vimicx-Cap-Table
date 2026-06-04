import { simulateDilution } from '../frontend/src/utils/dilutionMath.js';

// Setup Mock Cap Table
const mockCapTable = {
  companyName: "Vimicx Inc.",
  shareClasses: [
    { id: "sc-common", name: "Common", type: "common" },
    { id: "sc-seed", name: "Seed Preferred", type: "preferred" }
  ],
  shareholders: [
    { id: "sh-founder1", name: "Founder 1", type: "founder", shareClassId: "sc-common", shares: 4000000 },
    { id: "sh-founder2", name: "Founder 2", type: "founder", shareClassId: "sc-common", shares: 4000000 },
    { id: "sh-employee-pool-unallocated", name: "Unallocated Option Pool", type: "employee", shareClassId: "sc-common", shares: 1000000 }
  ],
  convertibleSecurities: [
    {
      id: "conv-post-safe",
      name: "Post-money SAFE",
      type: "safe_post_money",
      amount: 1000000, // $1M
      valuationCap: 10000000, // $10M Cap
      discountRate: 1.0
    }
  ]
};

// Simulation Parameters
const params = {
  preMoneyValuation: 15000000, // $15M
  investmentAmount: 3000000, // $3M
  targetOptionPoolPercent: 0.15, // 15% Post-Round
  optionPoolIncreaseType: 'dilute_pre_round'
};

console.log("=== RUNNING DILUTION MATH ENGINE TEST ===");
try {
  const result = simulateDilution(mockCapTable, params);
  
  console.log("\n--- SIMULATION SUMMARY ---");
  console.log(`Pre-round total shares: ${result.summary.preTotalShares.toLocaleString()}`);
  console.log(`New Round Share Price: $${result.summary.roundPrice.toFixed(4)}`);
  console.log(`New shares issued to investors: ${result.summary.newSharesIssued.toLocaleString()}`);
  console.log(`Option pool increase: ${result.summary.optionsIncrease.toLocaleString()} shares`);
  console.log(`Post-round option pool %: ${result.summary.optionsUnallocatedPercentagePost.toFixed(2)}% (Target: 15%)`);
  console.log(`Post-round total shares: ${result.summary.postTotalShares.toLocaleString()}`);
  console.log(`Post-Money Valuation: $${result.summary.postMoneyValuation.toLocaleString()}`);
  
  console.log("\n--- CONVERTED SECURITIES ---");
  result.convertingSecurities.forEach(cs => {
    console.log(`${cs.name}: Converted into ${cs.shares.toLocaleString()} shares using ${cs.conversionMethod} at $${cs.conversionPrice.toFixed(4)}/share`);
  });

  console.log("\n--- SHAREHOLDERS POST-ROUND ---");
  result.shareholders.forEach(sh => {
    console.log(` - ${sh.name}: ${sh.shares.toLocaleString()} shares (${sh.postPercentage.toFixed(2)}%)`);
  });

  // Verify constraints
  const mathOk = 
    Math.abs(result.summary.optionsUnallocatedPercentagePost - 15) < 0.1 && 
    result.summary.postTotalShares > result.summary.preTotalShares;

  if (mathOk) {
    console.log("\n✅ MATH VALIDATION SUCCESSFUL!");
  } else {
    console.error("\n❌ MATH VALIDATION FAILED: Target constraints not met.");
    process.exit(1);
  }
} catch (err) {
  console.error("\n❌ TEST CRASHED:", err);
  process.exit(1);
}
