import { ruleset } from "@shared/ruleset";
import type { IntakeData, ResultsData } from "@shared/schema";

/**
 * CFP®-designed Monte Carlo simulation engine for retirement readiness assessment.
 * This encodes the judgment, experience, and mental models of a CFP® when evaluating retirement readiness.
 */

// Helper to generate normally distributed random numbers (Box-Muller transform)
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

// Calculate life expectancy age from bucket
function getLifeExpectancyAge(bucket: string): number {
  return ruleset.life_expectancy_ages[bucket as keyof typeof ruleset.life_expectancy_ages] || 90;
}

// Calculate starting portfolio from bucket
function getStartingPortfolio(bucket: string): number {
  return ruleset.asset_midpoints[bucket as keyof typeof ruleset.asset_midpoints] || 1000000;
}

// Get return assumptions from allocation
function getAllocationAssumptions(allocation: string) {
  return ruleset.monte_carlo.allocation_assumptions[allocation as keyof typeof ruleset.monte_carlo.allocation_assumptions] 
    || ruleset.monte_carlo.allocation_assumptions.balanced;
}

// Calculate retirement duration
function calculateRetirementDuration(intake: IntakeData): number {
  const userLifeExp = getLifeExpectancyAge(intake.user_life_expectancy);
  let maxLifeExp = userLifeExp;
  
  if (intake.planning_for === 'couple' && intake.spouse_life_expectancy) {
    const spouseLifeExp = getLifeExpectancyAge(intake.spouse_life_expectancy);
    maxLifeExp = Math.max(userLifeExp, spouseLifeExp);
  }
  
  return maxLifeExp - intake.retirement_age;
}

// Calculate annual spending for a given year
function calculateAnnualSpending(
  intake: IntakeData,
  year: number,
  retirementAge: number,
  hasLtcEvent: boolean,
  ltcYearsRemaining: number
): number {
  const currentAge = retirementAge + year;
  const birthYear = ruleset.current_year - intake.user_age;
  let spending = intake.monthly_spending_ex_mortgage * 12;
  
  // Mortgage costs
  if (intake.has_mortgage && intake.mortgage_monthly && intake.mortgage_payoff_year) {
    const payoffAge = intake.mortgage_payoff_year - birthYear;
    if (currentAge < payoffAge) {
      spending += intake.mortgage_monthly * 12;
    }
  }
  
  // Pre-65 healthcare
  if (currentAge < 65) {
    if (intake.pre65_healthcare === 'yes' && intake.pre65_healthcare_monthly) {
      spending += intake.pre65_healthcare_monthly * 12;
    } else if (intake.pre65_healthcare === 'not_sure') {
      // Use default estimate
      const personsNeedingCoverage = intake.planning_for === 'couple' ? 2 : 1;
      spending += ruleset.healthcare.default_pre65_per_person_monthly * personsNeedingCoverage * 12;
    }
    
    // Spouse employer healthcare offset
    if (intake.spouse_employer_health === 'yes' && intake.planning_for === 'couple') {
      spending -= ruleset.healthcare.default_pre65_per_person_monthly * 12;
    }
  }
  
  // Early spending adjustment
  if (year < 5 && intake.early_spending_pattern === 'higher') {
    spending *= 1.15; // 15% higher in early years
  } else if (year < 3 && intake.early_spending_pattern === 'one_time_purchases') {
    spending += 20000; // One-time purchases in first few years
  } else if (intake.early_spending_pattern === 'lower') {
    spending *= 0.90;
  }
  
  // Long-term care costs (if event triggered)
  if (hasLtcEvent && ltcYearsRemaining > 0) {
    let ltcCost = ruleset.ltc.cost_per_year;
    
    // Apply insurance reduction
    const insuranceReduction = ruleset.ltc.insurance_reduction[intake.ltc_insurance as keyof typeof ruleset.ltc.insurance_reduction];
    if (insuranceReduction) {
      const avgReduction = (insuranceReduction.min + insuranceReduction.max) / 2;
      ltcCost *= (1 - avgReduction);
    }
    
    spending += ltcCost;
  }
  
  // Apply inflation
  spending *= Math.pow(1 + ruleset.monte_carlo.inflation_rate, year);
  
  return spending;
}

// Calculate guaranteed income for a given year
function calculateGuaranteedIncome(intake: IntakeData, year: number, retirementAge: number): number {
  const currentAge = retirementAge + year;
  let income = 0;
  
  // Social Security
  if (!intake.ss_not_sure && intake.ss_claim_age && intake.ss_monthly_household) {
    if (currentAge >= intake.ss_claim_age) {
      income += intake.ss_monthly_household * 12;
    }
  }
  
  // Pension
  if (intake.has_pension && intake.pension_monthly && intake.pension_start_age) {
    if (currentAge >= intake.pension_start_age) {
      income += intake.pension_monthly * 12;
    }
  }
  
  // Rental/Business income
  if (intake.has_rental_business_income && intake.rental_annual_amount && intake.rental_start_age) {
    const endAge = intake.rental_end_age === 'ongoing' ? 100 : (intake.rental_end_age || 100);
    if (currentAge >= intake.rental_start_age && currentAge < endAge) {
      let rentalIncome = intake.rental_annual_amount;
      // Discount for reliability
      if (intake.rental_reliability === 'variable') {
        rentalIncome *= 0.85;
      } else if (intake.rental_reliability === 'uncertain') {
        rentalIncome *= 0.70;
      }
      income += rentalIncome;
    }
  }
  
  // Apply inflation adjustment to income (assuming it grows with inflation)
  income *= Math.pow(1 + ruleset.monte_carlo.inflation_rate * 0.5, year); // Partial inflation adjustment
  
  return income;
}

// Run a single Monte Carlo trial
function runTrial(
  intake: IntakeData,
  startingPortfolio: number,
  duration: number,
  allocationParams: { mean_return: number; volatility: number },
  ltcEventAge?: number
): { success: boolean; endingPortfolio: number } {
  let portfolio = startingPortfolio;
  const retirementAge = intake.retirement_age;
  
  // Determine cash buffer strategy
  const hasCashBuffer = intake.bridge_years === '3_5' || intake.bridge_years === '6_10' || intake.bridge_years === '10_plus';
  let cashBufferYears = 0;
  if (intake.bridge_years === '3_5') cashBufferYears = 4;
  else if (intake.bridge_years === '6_10') cashBufferYears = 8;
  else if (intake.bridge_years === '10_plus') cashBufferYears = 10;
  
  let negativeYearsUsedBuffer = 0;
  
  for (let year = 0; year < duration; year++) {
    const currentAge = retirementAge + year;
    
    // Check for LTC event
    const hasLtcEvent = ltcEventAge !== undefined && currentAge >= ltcEventAge;
    const ltcYearsRemaining = ltcEventAge !== undefined ? Math.max(0, ruleset.ltc.years - (currentAge - ltcEventAge)) : 0;
    
    // Calculate spending and income
    const spending = calculateAnnualSpending(intake, year, retirementAge, hasLtcEvent, ltcYearsRemaining);
    const guaranteedIncome = calculateGuaranteedIncome(intake, year, retirementAge);
    const portfolioWithdrawal = Math.max(0, spending - guaranteedIncome);
    
    // Generate return for this year
    const annualReturn = randomNormal(allocationParams.mean_return, allocationParams.volatility);
    
    // Cash buffer logic: if return is negative in early years and we have buffer
    if (year < 3 && annualReturn < 0 && hasCashBuffer && negativeYearsUsedBuffer < cashBufferYears) {
      // Use cash buffer - don't sell from portfolio during down market
      portfolio *= (1 + annualReturn); // Portfolio still loses value
      portfolio -= portfolioWithdrawal * 0.5; // Partial withdrawal from portfolio
      negativeYearsUsedBuffer++;
    } else {
      // Normal withdrawal
      portfolio *= (1 + annualReturn);
      portfolio -= portfolioWithdrawal;
    }
    
    // Check for failure
    if (portfolio < 0) {
      return { success: false, endingPortfolio: 0 };
    }
  }
  
  return { success: true, endingPortfolio: portfolio };
}

// Generate LTC event age (or undefined if no event)
function generateLtcEventAge(intake: IntakeData, retirementAge: number, duration: number): number | undefined {
  const ltcProb = intake.ltc_expectation === 'both_may_need' 
    ? ruleset.ltc.probability_both 
    : intake.ltc_expectation === 'one_may_need' || intake.ltc_expectation === 'not_sure'
      ? ruleset.ltc.probability_one
      : 0;
  
  if (Math.random() < ltcProb) {
    // LTC occurs late in retirement (age 80-88)
    const ltcAge = 80 + Math.floor(Math.random() * 9);
    if (ltcAge >= retirementAge && ltcAge < retirementAge + duration) {
      return ltcAge;
    }
  }
  
  return undefined;
}

// Calculate scoring adjustments
function calculateScoringAdjustments(intake: IntakeData, duration: number): number {
  let adjustment = 0;
  const { penalties, offsets } = ruleset.scoring;
  
  // Duration penalty
  if (duration > 30) {
    adjustment += penalties.long_duration_per_year * (duration - 30);
  }
  
  // LTC risk penalty
  if (intake.ltc_expectation === 'both_may_need') {
    adjustment += penalties.ltc_risk_both;
  } else if (intake.ltc_expectation === 'one_may_need' || intake.ltc_expectation === 'not_sure') {
    adjustment += penalties.ltc_risk_one;
  }
  
  // Early withdrawal penalty (years before SS starts)
  if (!intake.ss_not_sure && intake.ss_claim_age) {
    const yearsBeforeSS = Math.max(0, intake.ss_claim_age - intake.retirement_age);
    adjustment += penalties.early_withdrawal_per_year * yearsBeforeSS;
  }
  
  // Diversification penalty
  if (intake.diversification_confidence < 4) {
    adjustment += penalties.low_diversification;
  }
  if (intake.allocation_bucket === 'concentrated') {
    adjustment += penalties.concentrated_portfolio;
  }
  
  // Stress response penalty
  if (intake.market_stress_response === 'high_stress') {
    adjustment += penalties.high_stress_response;
  }
  
  // Spending confidence penalty
  if (intake.spending_confidence < 4) {
    adjustment += penalties.low_spending_confidence;
  }
  
  // Cash buffer offset
  if (intake.bridge_years === '6_10' || intake.bridge_years === '10_plus') {
    adjustment += offsets.strong_cash_buffer;
  } else if (intake.bridge_years === '0_2') {
    adjustment += penalties.no_cash_buffer;
  }
  
  // Flexibility offset
  if (intake.flexibility_score >= 7) {
    adjustment += offsets.high_flexibility;
  }
  
  // Mortgage payoff offset
  if (intake.has_mortgage && intake.mortgage_payoff_year) {
    const birthYear = ruleset.current_year - intake.user_age;
    const payoffAge = intake.mortgage_payoff_year - birthYear;
    if (payoffAge <= intake.retirement_age) {
      adjustment += offsets.mortgage_paid_at_retirement;
    }
  }
  
  // Employer healthcare offset
  if (intake.spouse_employer_health === 'yes') {
    adjustment += offsets.employer_healthcare_bridge;
  }
  
  // Strong pension offset
  if (intake.has_pension && intake.pension_survivor === 'full') {
    adjustment += offsets.pension_with_survivor;
  }
  
  return adjustment;
}

// Generate top risks based on intake
function generateTopRisks(intake: IntakeData, duration: number, successRate: number): ResultsData['top_3_risks'] {
  const risks: { title: string; description: string; severity: 'high' | 'medium' | 'low'; score: number }[] = [];
  
  // Long retirement duration
  if (duration > 35) {
    risks.push({
      title: "Long Retirement Duration",
      description: `Your ${duration}-year retirement timeline is significantly longer than average. This increases the risk of outliving your savings.`,
      severity: duration > 40 ? 'high' : 'medium',
      score: duration - 30
    });
  }
  
  // LTC tail risk
  if (intake.ltc_expectation !== 'none' && intake.ltc_insurance !== 'comprehensive') {
    risks.push({
      title: "Long-Term Care Exposure",
      description: "Potential long-term care costs could significantly impact your plan. Consider reviewing your coverage options.",
      severity: intake.ltc_expectation === 'both_may_need' ? 'high' : 'medium',
      score: intake.ltc_expectation === 'both_may_need' ? 15 : 10
    });
  }
  
  // Early sequence risk
  if (intake.bridge_years === '0_2' && intake.retirement_age < 65) {
    risks.push({
      title: "Sequence of Returns Risk",
      description: "Limited cash reserves make you vulnerable to market downturns in early retirement. A poor first few years could significantly impact your plan.",
      severity: 'high',
      score: 12
    });
  }
  
  // Concentrated portfolio
  if (intake.allocation_bucket === 'concentrated') {
    risks.push({
      title: "Portfolio Concentration",
      description: "A concentrated portfolio increases volatility and risk. Consider diversifying across asset classes.",
      severity: 'high',
      score: 14
    });
  }
  
  // Pre-65 healthcare gap
  if (intake.pre65_healthcare !== 'no' && intake.retirement_age < 65) {
    const yearsWithoutMedicare = 65 - intake.retirement_age;
    risks.push({
      title: "Pre-Medicare Healthcare Gap",
      description: `You'll need ${yearsWithoutMedicare} years of healthcare coverage before Medicare eligibility, which can be expensive.`,
      severity: yearsWithoutMedicare > 5 ? 'high' : 'medium',
      score: yearsWithoutMedicare * 2
    });
  }
  
  // Low diversification
  if (intake.diversification_confidence < 4) {
    risks.push({
      title: "Portfolio Diversification Concerns",
      description: "Your portfolio may lack sufficient diversification. This increases risk and volatility.",
      severity: 'medium',
      score: 8
    });
  }
  
  // Mortgage continuing into retirement
  if (intake.has_mortgage && intake.mortgage_payoff_year) {
    const birthYear = ruleset.current_year - intake.user_age;
    const payoffAge = intake.mortgage_payoff_year - birthYear;
    if (payoffAge > intake.retirement_age) {
      const yearsWithMortgage = payoffAge - intake.retirement_age;
      risks.push({
        title: "Mortgage in Retirement",
        description: `You'll have ${yearsWithMortgage} years of mortgage payments in retirement, reducing flexibility.`,
        severity: yearsWithMortgage > 5 ? 'medium' : 'low',
        score: yearsWithMortgage
      });
    }
  }
  
  // High stress response
  if (intake.market_stress_response === 'high_stress') {
    risks.push({
      title: "Behavioral Risk",
      description: "Emotional reactions to market volatility could lead to poor timing decisions. Having a plan before downturns occur is crucial.",
      severity: 'medium',
      score: 7
    });
  }
  
  // Sort by score and return top 3
  return risks
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ title, description, severity }) => ({ title, description, severity }));
}

// Generate top levers based on intake
function generateTopLevers(intake: IntakeData, duration: number): ResultsData['top_3_levers'] {
  const levers: { title: string; description: string; impact: 'high' | 'medium' | 'low'; score: number }[] = [];
  
  // Delay retirement
  if (intake.flexibility_score < 7) {
    levers.push({
      title: "Delay Retirement",
      description: "Each year you delay retirement adds to savings, reduces withdrawal years, and potentially increases Social Security benefits.",
      impact: 'high',
      score: 15
    });
  }
  
  // Delay Social Security
  if (!intake.ss_not_sure && intake.ss_claim_age && intake.ss_claim_age < 70) {
    levers.push({
      title: "Delay Social Security Claiming",
      description: "Waiting to claim Social Security until age 70 maximizes your guaranteed lifetime income by approximately 8% per year of delay.",
      impact: 'high',
      score: 14
    });
  }
  
  // Reduce spending
  levers.push({
    title: "Reduce Discretionary Spending",
    description: "Even a 10% reduction in spending can significantly improve your plan's probability of success.",
    impact: 'medium',
    score: 10
  });
  
  // Build cash reserves
  if (intake.bridge_years === '0_2' || intake.bridge_years === '3_5') {
    levers.push({
      title: "Build Cash Reserves",
      description: "Having 3-5 years of expenses in stable assets protects against sequence of returns risk in early retirement.",
      impact: 'high',
      score: 12
    });
  }
  
  // LTC insurance
  if (intake.ltc_insurance !== 'comprehensive' && intake.ltc_expectation !== 'none') {
    levers.push({
      title: "Consider Long-Term Care Insurance",
      description: "A comprehensive LTC policy could protect your portfolio from a major tail risk.",
      impact: 'medium',
      score: 9
    });
  }
  
  // Diversify portfolio
  if (intake.allocation_bucket === 'concentrated' || intake.diversification_confidence < 5) {
    levers.push({
      title: "Diversify Your Portfolio",
      description: "Spreading investments across asset classes, sectors, and geographies reduces risk and volatility.",
      impact: 'medium',
      score: 8
    });
  }
  
  // Pay off mortgage
  if (intake.has_mortgage) {
    levers.push({
      title: "Pay Off Mortgage Before Retirement",
      description: "Eliminating mortgage payments reduces your baseline expenses and provides more flexibility.",
      impact: 'medium',
      score: 7
    });
  }
  
  // Part-time work
  levers.push({
    title: "Consider Part-Time Work",
    description: "Even modest income in early retirement years reduces portfolio withdrawals during the critical sequence risk period.",
    impact: 'medium',
    score: 6
  });
  
  return levers
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ title, description, impact }) => ({ title, description, impact }));
}

// Generate special callouts
function generateSpecialCallouts(intake: IntakeData, duration: number): ResultsData['special_callouts'] {
  const callouts: ResultsData['special_callouts'] = [];
  
  if (duration >= 40) {
    callouts.push({
      type: "Long Retirement Duration",
      message: `Your ${duration}-year retirement timeline requires extra conservative planning. Small changes now have big impacts.`
    });
  }
  
  if (intake.retirement_age < 60) {
    callouts.push({
      type: "Early Retirement",
      message: "Early retirement increases sequence of returns risk. The first 10 years of returns matter significantly more."
    });
  }
  
  if (intake.has_mortgage && intake.mortgage_payoff_year) {
    const birthYear = ruleset.current_year - intake.user_age;
    const payoffAge = intake.mortgage_payoff_year - birthYear;
    if (payoffAge > intake.retirement_age + 5) {
      callouts.push({
        type: "Mortgage Duration",
        message: `Your mortgage won't be paid off until age ${payoffAge}. This impacts your early retirement flexibility.`
      });
    }
  }
  
  if (intake.retirement_age < 65 && intake.pre65_healthcare !== 'no') {
    callouts.push({
      type: "Pre-65 Healthcare Bridge",
      message: "Healthcare costs before Medicare can be $15,000-25,000 per year for a couple. Budget accordingly."
    });
  }
  
  return callouts;
}

// Generate what matters less
function generateWhatMattersLess(intake: IntakeData): string[] {
  const items: string[] = [];
  
  if (intake.has_pension && intake.pension_monthly && intake.pension_monthly > 3000) {
    items.push("Short-term market volatility - your strong pension provides a stable income floor");
  }
  
  if (!intake.ss_not_sure && intake.ss_monthly_household && intake.ss_monthly_household > 5000) {
    items.push("Portfolio withdrawal rate - strong Social Security coverage reduces dependence on portfolio");
  }
  
  if (intake.flexibility_score >= 8) {
    items.push("Exact retirement date - your high flexibility allows adjustment if needed");
  }
  
  if (intake.bridge_years === '10_plus') {
    items.push("Sequence of returns risk - your substantial cash reserves provide significant protection");
  }
  
  if (intake.ltc_insurance === 'comprehensive') {
    items.push("Long-term care costs - your comprehensive coverage addresses this tail risk");
  }
  
  return items.slice(0, 3);
}

// Main simulation function
export function runMonteCarloSimulation(intake: IntakeData): ResultsData {
  const { trials } = ruleset.monte_carlo;
  const startingPortfolio = getStartingPortfolio(intake.assets_bucket);
  const allocationParams = getAllocationAssumptions(intake.allocation_bucket);
  const duration = calculateRetirementDuration(intake);
  
  let successCount = 0;
  const endingPortfolios: number[] = [];
  
  // Run Monte Carlo trials
  for (let i = 0; i < trials; i++) {
    const ltcEventAge = generateLtcEventAge(intake, intake.retirement_age, duration);
    const result = runTrial(intake, startingPortfolio, duration, allocationParams, ltcEventAge);
    
    if (result.success) {
      successCount++;
    }
    endingPortfolios.push(result.endingPortfolio);
  }
  
  // Calculate base success probability
  let successProbability = (successCount / trials) * 100;
  
  // Apply scoring adjustments
  const adjustment = calculateScoringAdjustments(intake, duration);
  successProbability = Math.max(0, Math.min(100, successProbability + adjustment));
  
  // Special rule: Don't allow "On Track" verdict if duration >= 40 unless very strong factors
  if (duration >= 40 && successProbability >= 85) {
    const hasStrongIncome = (intake.ss_monthly_household || 0) > 4000 || 
                            (intake.pension_monthly || 0) > 2500;
    const hasHighFlexibility = intake.flexibility_score >= 8;
    
    if (!hasStrongIncome && !hasHighFlexibility) {
      successProbability = Math.min(successProbability, 82);
    }
  }
  
  // Calculate median and worst case ending portfolios
  endingPortfolios.sort((a, b) => a - b);
  const medianIndex = Math.floor(endingPortfolios.length / 2);
  const worstCaseIndex = Math.floor(endingPortfolios.length * 0.05); // 5th percentile
  
  // Determine verdict
  let verdict: 'on_track' | 'borderline' | 'at_risk';
  if (successProbability >= ruleset.verdict_thresholds.on_track) {
    verdict = 'on_track';
  } else if (successProbability >= ruleset.verdict_thresholds.borderline) {
    verdict = 'borderline';
  } else {
    verdict = 'at_risk';
  }
  
  // Calculate year 1 spending and guaranteed income
  const year1Spending = calculateAnnualSpending(intake, 0, intake.retirement_age, false, 0);
  const year1GuaranteedIncome = calculateGuaranteedIncome(intake, 0, intake.retirement_age);
  
  // Calculate Social Security annual income (when it kicks in)
  const ssAnnualIncome = (!intake.ss_not_sure && intake.ss_monthly_household) 
    ? intake.ss_monthly_household * 12 
    : 0;
  
  // Calculate withdrawal rates
  // Pre-SS: spending / total assets (before Social Security kicks in)
  const preSSWithdrawalRate = startingPortfolio > 0 
    ? (year1Spending / startingPortfolio) * 100 
    : 0;
  
  // Post-SS: (spending - SS income) / total assets (after Social Security kicks in)
  const postSSWithdrawalRate = startingPortfolio > 0 
    ? (Math.max(0, year1Spending - ssAnnualIncome) / startingPortfolio) * 100 
    : 0;
  
  // Generate distribution data for chart
  const distributionData = generateDistributionData(endingPortfolios, trials);
  
  // Generate results
  return {
    verdict,
    success_probability: Math.round(successProbability * 10) / 10,
    top_3_risks: generateTopRisks(intake, duration, successProbability),
    top_3_levers: generateTopLevers(intake, duration),
    what_matters_less: generateWhatMattersLess(intake),
    assumptions_and_limits: [
      `Inflation assumed at ${(ruleset.monte_carlo.inflation_rate * 100).toFixed(1)}% annually`,
      `Portfolio returns modeled using ${allocationParams.mean_return * 100}% mean return with ${allocationParams.volatility * 100}% volatility`,
      `Social Security assumed to pay stated benefits (no reduction modeled)`,
      `Long-term care costs estimated at $${(ruleset.ltc.cost_per_year / 1000).toFixed(0)}k/year for ${ruleset.ltc.years} years if needed`,
      `Taxes not explicitly modeled - actual withdrawals may need to be higher`,
      `Results based on ${trials.toLocaleString()} Monte Carlo simulations`
    ],
    special_callouts: generateSpecialCallouts(intake, duration),
    simulation_details: {
      trials,
      median_ending_portfolio: Math.round(endingPortfolios[medianIndex] || 0),
      worst_case_portfolio: Math.round(endingPortfolios[worstCaseIndex] || 0),
      retirement_duration_years: duration,
      annual_spending_year1: Math.round(year1Spending),
      guaranteed_income_at_start: Math.round(year1GuaranteedIncome),
      starting_portfolio: startingPortfolio,
      ss_annual_income: ssAnnualIncome,
      pre_ss_withdrawal_rate: Math.round(preSSWithdrawalRate * 10) / 10,
      post_ss_withdrawal_rate: Math.round(postSSWithdrawalRate * 10) / 10,
      distribution_data: distributionData
    }
  };
}

// Generate distribution data for the histogram chart
function generateDistributionData(portfolios: number[], total: number): { range: string; count: number; percentage: number }[] {
  // Define mutually exclusive buckets
  const buckets = [
    { test: (p: number) => p <= 0, label: "Failed" },
    { test: (p: number) => p > 0 && p <= 250000, label: "$0-250K" },
    { test: (p: number) => p > 250000 && p <= 500000, label: "$250K-500K" },
    { test: (p: number) => p > 500000 && p <= 1000000, label: "$500K-1M" },
    { test: (p: number) => p > 1000000 && p <= 2000000, label: "$1M-2M" },
    { test: (p: number) => p > 2000000 && p <= 3000000, label: "$2M-3M" },
    { test: (p: number) => p > 3000000 && p <= 5000000, label: "$3M-5M" },
    { test: (p: number) => p > 5000000, label: "$5M+" }
  ];
  
  const distribution = buckets.map(bucket => {
    const count = portfolios.filter(bucket.test).length;
    return {
      range: bucket.label,
      count,
      percentage: Math.round((count / total) * 1000) / 10
    };
  }).filter(d => d.count > 0);
  
  return distribution;
}
