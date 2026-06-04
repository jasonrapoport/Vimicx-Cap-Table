/**
 * Dilution Math Engine for Cap Table Dilution Simulator
 */

/**
 * Calculates days between two date strings
 */
export function calculateDaysBetween(date1Str, date2Str) {
  if (!date1Str || !date2Str) return 0;
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  if (isNaN(d1.getTime()) || !isNaN(d2.getTime())) {
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
}

/**
 * Runs the dilution simulation for a new funding round.
 * 
 * @param {Object} capTable Current cap table data ({ shareholders, shareClasses, convertibleSecurities })
 * @param {Object} params Deal terms ({ preMoneyValuation, investmentAmount, targetOptionPoolPercent, optionPoolIncreaseType, conversionDate })
 * @returns {Object} Simulation results including pre/post tables and step-by-step math log.
 */
export function simulateDilution(capTable, params) {
  const {
    preMoneyValuation,
    investmentAmount,
    targetOptionPoolPercent = 0.15, // default 15%
    optionPoolIncreaseType = 'dilute_pre_round', // 'dilute_pre_round' (standard) or 'no_increase'
    conversionDate = new Date().toISOString().split('T')[0]
  } = params;

  const logs = [];
  logs.push(`Starting dilution simulation...`);
  logs.push(`Pre-Money Valuation: $${preMoneyValuation.toLocaleString()}`);
  logs.push(`New Investment: $${investmentAmount.toLocaleString()}`);
  logs.push(`Target Post-Round Option Pool: ${(targetOptionPoolPercent * 100).toFixed(2)}%`);

  // 1. Calculate Pre-Round Totals
  const preShareholders = capTable.shareholders.map(s => ({ ...s }));
  const preTotalShares = preShareholders.reduce((sum, s) => sum + s.shares, 0);
  
  // Find current option pool (if any)
  const unallocatedOptionShareholder = preShareholders.find(s => s.id === 'sh-employee-pool-unallocated');
  const initialUnallocatedOptions = unallocatedOptionShareholder ? unallocatedOptionShareholder.shares : 0;
  
  logs.push(`Pre-round outstanding shares: ${preTotalShares.toLocaleString()}`);
  logs.push(`Initial unallocated option pool: ${initialUnallocatedOptions.toLocaleString()} shares`);

  // 2. Identify SAFEs and Notes
  const securities = (capTable.convertibleSecurities || []).map(sec => {
    let accruedDebt = sec.amount;
    let interestLog = '';
    
    if (sec.type === 'convertible_note' && sec.interestRate && sec.issueDate) {
      const days = calculateDaysBetween(sec.issueDate, conversionDate);
      const interest = sec.amount * sec.interestRate * (days / 365);
      accruedDebt = sec.amount + interest;
      interestLog = ` (includes $${interest.toFixed(2)} interest accrued over ${days} days)`;
    }

    return {
      ...sec,
      accruedDebt,
      interestLog
    };
  });

  if (securities.length > 0) {
    logs.push(`Found ${securities.length} convertible securities to process:`);
    securities.forEach(s => {
      logs.push(` - ${s.name}: $${s.amount.toLocaleString()} investment${s.interestLog}. Cap: ${s.valuationCap ? '$' + s.valuationCap.toLocaleString() : 'None'}, Discount: ${s.discountRate ? (s.discountRate * 100).toFixed(0) + '%' : 'None'}`);
    });
  } else {
    logs.push(`No outstanding convertible securities.`);
  }

  // 3. Iterative solver for circular reference
  // We need to find:
  // - S_options_increase: new option pool shares added
  // - P: round price per share
  // - S_new: new investor shares
  // - S_safes: shares issued to convertible securities
  // Such that:
  // - P = preMoneyValuation / (preTotalShares + S_options_increase)
  // - S_new = investmentAmount / P
  // - S_safes is calculated by converting each SAFE/Note
  // - (initialUnallocatedOptions + S_options_increase) / (preTotalShares + S_options_increase + S_safes + S_new) = targetOptionPoolPercent

  let optionsIncrease = 0;
  let roundPrice = preMoneyValuation / preTotalShares;
  let newShares = investmentAmount / roundPrice;
  let totalPostShares = preTotalShares + newShares;
  let convertingSecuritiesShares = [];
  
  const maxIterations = 100;
  const tolerance = 0.0001;
  let converged = false;
  let iterationsRun = 0;

  logs.push(`Solving for circular references (Option Pool Increase & SAFE Conversions)...`);

  for (let i = 0; i < maxIterations; i++) {
    iterationsRun++;
    // Calculate new round price based on pre-round capitalization + option pool increase
    const priceBasis = preTotalShares + (optionPoolIncreaseType === 'dilute_pre_round' ? optionsIncrease : 0);
    const currentPriceEstimate = preMoneyValuation / priceBasis;
    
    // Convert all SAFEs/Notes under current price estimate
    const currentSecuritiesShares = securities.map(sec => {
      let conversionPrice = currentPriceEstimate;
      let conversionMethod = 'New Round Price';

      // Apply discount if applicable
      if (sec.discountRate && sec.discountRate < 1) {
        conversionPrice = currentPriceEstimate * sec.discountRate;
        conversionMethod = `Discount (${(sec.discountRate * 100).toFixed(0)}%)`;
      }

      // Apply Valuation Cap if applicable
      if (sec.valuationCap) {
        let capBasis = preTotalShares; // Default basis for pre-money SAFE & Notes
        
        if (sec.type === 'safe_post_money') {
          // Post-money SAFE basis includes options increase and all converting SAFEs, but excludes new round
          // In our iterative solver, we can approximate this by using the previous iteration's total shares excluding new round shares
          capBasis = preTotalShares + (optionPoolIncreaseType === 'dilute_pre_round' ? optionsIncrease : 0) + 
            convertingSecuritiesShares.reduce((sum, cs) => sum + cs.shares, 0);
        } else if (sec.type === 'safe_pre_money') {
          // Pre-money SAFEs exclude the option pool increase
          capBasis = preTotalShares;
        }

        const capPrice = sec.valuationCap / capBasis;
        if (capPrice < conversionPrice) {
          conversionPrice = capPrice;
          conversionMethod = `Valuation Cap ($${sec.valuationCap.toLocaleString()})`;
        }
      }

      const sharesIssued = sec.accruedDebt / conversionPrice;

      return {
        id: sec.id,
        name: sec.name,
        type: sec.type,
        amount: sec.amount,
        accruedDebt: sec.accruedDebt,
        conversionPrice,
        conversionMethod,
        shares: Math.round(sharesIssued)
      };
    });

    const totalSecuritiesShares = currentSecuritiesShares.reduce((sum, cs) => sum + cs.shares, 0);
    const currentNewShares = Math.round(investmentAmount / currentPriceEstimate);
    const estimatedPostTotal = preTotalShares + (optionPoolIncreaseType === 'dilute_pre_round' ? optionsIncrease : 0) + totalSecuritiesShares + currentNewShares;

    // Calculate option pool increase required to hit target % post-round
    let targetOptionsTotal = 0;
    let nextOptionsIncrease = 0;

    if (optionPoolIncreaseType === 'dilute_pre_round') {
      targetOptionsTotal = targetOptionPoolPercent * estimatedPostTotal;
      // We want: initialUnallocated + optionsIncrease = targetOptionsTotal
      // So: optionsIncrease = targetOptionsTotal - initialUnallocated
      nextOptionsIncrease = Math.max(0, targetOptionsTotal - initialUnallocatedOptions);
    } else {
      nextOptionsIncrease = 0;
    }

    // Check convergence
    const diff = Math.abs(nextOptionsIncrease - optionsIncrease);
    optionsIncrease = nextOptionsIncrease;
    roundPrice = currentPriceEstimate;
    newShares = currentNewShares;
    convertingSecuritiesShares = currentSecuritiesShares;
    totalPostShares = estimatedPostTotal;

    if (diff < tolerance && i > 5) {
      converged = true;
      break;
    }
  }

  logs.push(`Solver completed in ${iterationsRun} iterations. (Converged: ${converged ? 'Yes' : 'No'})`);
  logs.push(`Calculated New Round Price: $${roundPrice.toFixed(4)} per share`);
  if (optionPoolIncreaseType === 'dilute_pre_round' && optionsIncrease > 0) {
    logs.push(`Added ${Math.round(optionsIncrease).toLocaleString()} shares to the Unallocated Option Pool to achieve target ${ (targetOptionPoolPercent * 100).toFixed(1) }% unallocated pool post-round.`);
  }

  // 4. Build Post-Round Shareholders List
  const postShareholders = [];
  
  // A. Copy over existing shareholders with dilution
  preShareholders.forEach(sh => {
    let finalShares = sh.shares;
    
    // If it's the unallocated option pool, add the options increase
    if (sh.id === 'sh-employee-pool-unallocated') {
      finalShares += Math.round(optionsIncrease);
    }

    postShareholders.push({
      ...sh,
      preShares: sh.shares,
      shares: finalShares,
      prePercentage: (sh.shares / preTotalShares) * 100,
      postPercentage: (finalShares / totalPostShares) * 100
    });
  });

  // B. Add converting SAFE / Note holders as new shareholders
  convertingSecuritiesShares.forEach(cs => {
    postShareholders.push({
      id: `sh-conv-${cs.id}`,
      name: cs.name,
      type: 'investor',
      shareClassId: 'sc-seed', // Typically convert into seed/preferred
      preShares: 0,
      shares: cs.shares,
      prePercentage: 0,
      postPercentage: (cs.shares / totalPostShares) * 100,
      isConvertedSecurity: true,
      conversionMethod: cs.conversionMethod,
      conversionPrice: cs.conversionPrice,
      amount: cs.amount,
      accruedDebt: cs.accruedDebt
    });
  });

  // C. Add the new round investor
  postShareholders.push({
    id: 'sh-new-investor',
    name: 'New Round Investor(s)',
    type: 'investor',
    shareClassId: 'sc-seed',
    preShares: 0,
    shares: newShares,
    prePercentage: 0,
    postPercentage: (newShares / totalPostShares) * 100,
    isNewInvestor: true,
    amount: investmentAmount,
    conversionPrice: roundPrice
  });

  // Summary Metrics
  const summary = {
    roundPrice,
    preTotalShares,
    postTotalShares: totalPostShares,
    newSharesIssued: newShares,
    optionsIncrease: Math.round(optionsIncrease),
    totalOptionsUnallocatedPost: initialUnallocatedOptions + Math.round(optionsIncrease),
    optionsUnallocatedPercentagePost: ((initialUnallocatedOptions + Math.round(optionsIncrease)) / totalPostShares) * 100,
    totalConvertingSecuritiesShares: convertingSecuritiesShares.reduce((sum, cs) => sum + cs.shares, 0),
    postMoneyValuation: totalPostShares * roundPrice,
    impliedPreMoneyValuation: preTotalShares * roundPrice
  };

  logs.push(`Implied Pre-Money Valuation: $${summary.impliedPreMoneyValuation.toLocaleString(undefined, {maximumFractionDigits: 0})}`);
  logs.push(`Post-Money Valuation: $${summary.postMoneyValuation.toLocaleString(undefined, {maximumFractionDigits: 0})}`);
  logs.push(`Total Post-Round Shares: ${totalPostShares.toLocaleString()}`);

  return {
    params,
    summary,
    shareholders: postShareholders,
    convertingSecurities: convertingSecuritiesShares,
    logs
  };
}
