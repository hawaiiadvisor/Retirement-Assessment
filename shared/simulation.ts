import { ruleset } from "./ruleset";
import type { IntakeData, ResultsData } from "./schema";

function formatDollarsShort(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

function getLifeExpectancyAge(bucket: string): number {
  return ruleset.life_expectancy_ages[bucket as keyof typeof ruleset.life_expectancy_ages] || 90;
}

function getStartingPortfolio(bucket: string): number {
  return ruleset.asset_midpoints[bucket as keyof typeof ruleset.asset_midpoints] || 1000000;
}

function getAllocationAssumptions(allocation: string) {
  return ruleset.monte_carlo.allocation_assumptions[allocation as keyof typeof ruleset.monte_carlo.allocation_assumptions] 
    || ruleset.monte_carlo.allocation_assumptions.balanced;
}

function calculateRetirementDuration(intake: IntakeData): number {
  const userLifeExp = getLifeExpectancyAge(intake.user_life_expectancy);
  let maxLifeExp = userLifeExp;
  
  if (intake.planning_for === 'couple' && intake.spouse_life_expectancy) {
    const spouseLifeExp = getLifeExpectancyAge(intake.spouse_life_expectancy);
    maxLifeExp = Math.max(userLifeExp, spouseLifeExp);
  }
  
  return maxLifeExp - intake.retirement_age;
}

function getEarlierDeathAge(intake: IntakeData): number | undefined {
  if (intake.planning_for !== 'couple' || !intake.spouse_life_expectancy) {
    return undefined;
  }
  const userLifeExp = getLifeExpectancyAge(intake.user_life_expectancy);
  const spouseLifeExp = getLifeExpectancyAge(intake.spouse_life_expectancy);
  return Math.min(userLifeExp, spouseLifeExp);
}

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
  
  if (intake.has_mortgage && intake.mortgage_monthly && intake.mortgage_payoff_year) {
    const payoffAge = intake.mortgage_payoff_year - birthYear;
    if (currentAge < payoffAge) {
      spending += intake.mortgage_monthly * 12;
    }
  }
  
  if (currentAge < 65) {
    if (intake.pre65_healthcare === 'yes' && intake.pre65_healthcare_monthly) {
      spending += intake.pre65_healthcare_monthly * 12;
    } else if (intake.pre65_healthcare === 'not_sure') {
      const personsNeedingCoverage = intake.planning_for === 'couple' ? 2 : 1;
      spending += ruleset.healthcare.default_pre65_per_person_monthly * personsNeedingCoverage * 12;
    }
    
    if (intake.spouse_employer_health === 'yes' && intake.planning_for === 'couple') {
      spending -= ruleset.healthcare.default_pre65_per_person_monthly * 12;
    }
  }
  
  if (year < 5 && intake.early_spending_pattern === 'higher') {
    spending *= 1.15;
  } else if (year < 3 && intake.early_spending_pattern === 'one_time_purchases') {
    spending += (intake.monthly_spending_ex_mortgage * 12) * ruleset.one_time_purchase_factor;
  } else if (intake.early_spending_pattern === 'lower') {
    spending *= 0.90;
  }
  
  if (hasLtcEvent && ltcYearsRemaining > 0) {
    let ltcCost = ruleset.ltc.cost_per_year;
    
    const insuranceReduction = ruleset.ltc.insurance_reduction[intake.ltc_insurance as keyof typeof ruleset.ltc.insurance_reduction];
    if (insuranceReduction) {
      const avgReduction = (insuranceReduction.min + insuranceReduction.max) / 2;
      ltcCost *= (1 - avgReduction);
    }
    
    spending += ltcCost;
  }
  
  const earlierDeathAge = getEarlierDeathAge(intake);
  if (earlierDeathAge !== undefined && currentAge >= earlierDeathAge) {
    spending *= (1 - ruleset.survivor_spending_reduction);
  }
  
  return spending;
}

function getSSIncome(intake: IntakeData, currentAge: number): number {
  if (intake.ss_not_sure) {
    const ssDefault = intake.planning_for === 'couple'
      ? ruleset.ss_defaults.couple_monthly
      : ruleset.ss_defaults.individual_monthly;
    const claimAge = ruleset.ss_defaults.default_claim_age;
    if (currentAge >= claimAge) {
      return ssDefault * 12;
    }
  } else if (intake.ss_claim_age && intake.ss_monthly_household) {
    if (currentAge >= intake.ss_claim_age) {
      return intake.ss_monthly_household * 12;
    }
  }
  return 0;
}

function getPensionIncome(intake: IntakeData, currentAge: number): number {
  if (intake.has_pension && intake.pension_monthly && intake.pension_start_age) {
    if (currentAge >= intake.pension_start_age) {
      let pensionAnnual = intake.pension_monthly * 12;
      const pensionYears = currentAge - intake.pension_start_age;
      pensionAnnual *= Math.pow(1 / (1 + ruleset.monte_carlo.inflation_rate), pensionYears);
      return pensionAnnual;
    }
  }
  return 0;
}

function getOtherIncome(intake: IntakeData, currentAge: number): number {
  if (intake.has_rental_business_income && intake.rental_annual_amount && intake.rental_start_age) {
    const endAge = intake.rental_end_age === 'ongoing' ? 100 : (intake.rental_end_age || 100);
    if (currentAge >= intake.rental_start_age && currentAge < endAge) {
      let rentalIncome = intake.rental_annual_amount;
      if (intake.rental_reliability === 'variable') {
        rentalIncome *= 0.85;
      } else if (intake.rental_reliability === 'uncertain') {
        rentalIncome *= 0.70;
      }
      return rentalIncome;
    }
  }
  return 0;
}

function calculateGuaranteedIncome(intake: IntakeData, year: number, retirementAge: number): number {
  const currentAge = retirementAge + year;
  return getSSIncome(intake, currentAge) + getPensionIncome(intake, currentAge) + getOtherIncome(intake, currentAge);
}

function getNonSSIncomeAtRetirement(intake: IntakeData): number {
  return getPensionIncome(intake, intake.retirement_age) + getOtherIncome(intake, intake.retirement_age);
}

interface TrialResult {
  success: boolean;
  endingPortfolio: number;
  yearlyBalances: number[];
}

function runTrial(
  intake: IntakeData,
  startingPortfolio: number,
  duration: number,
  allocationParams: { mean_return: number; volatility: number },
  ltcEventAge?: number,
  trackYearly: boolean = false
): TrialResult {
  let portfolio = startingPortfolio;
  const retirementAge = intake.retirement_age;
  const taxRate = ruleset.monte_carlo.effective_tax_rate;
  
  const hasCashBuffer = intake.bridge_years === '3_5' || intake.bridge_years === '6_10' || intake.bridge_years === '10_plus';
  let cashBufferYears = 0;
  if (intake.bridge_years === '3_5') cashBufferYears = 4;
  else if (intake.bridge_years === '6_10') cashBufferYears = 8;
  else if (intake.bridge_years === '10_plus') cashBufferYears = 10;
  
  let negativeYearsUsedBuffer = 0;
  const yearlyBalances: number[] = trackYearly ? [startingPortfolio] : [];
  
  for (let year = 0; year < duration; year++) {
    const currentAge = retirementAge + year;
    
    const hasLtcEvent = ltcEventAge !== undefined && currentAge >= ltcEventAge;
    const ltcYearsRemaining = ltcEventAge !== undefined ? Math.max(0, ruleset.ltc.years - (currentAge - ltcEventAge)) : 0;
    
    const spending = calculateAnnualSpending(intake, year, retirementAge, hasLtcEvent, ltcYearsRemaining);
    const guaranteedIncome = calculateGuaranteedIncome(intake, year, retirementAge);
    const netSpending = Math.max(0, spending - guaranteedIncome);
    const portfolioWithdrawal = netSpending / (1 - taxRate);
    
    const annualReturn = randomNormal(allocationParams.mean_return, allocationParams.volatility);
    
    if (year < cashBufferYears && annualReturn < 0 && hasCashBuffer && negativeYearsUsedBuffer < cashBufferYears) {
      portfolio *= (1 + annualReturn);
      portfolio -= portfolioWithdrawal * 0.5;
      negativeYearsUsedBuffer++;
    } else {
      portfolio *= (1 + annualReturn);
      portfolio -= portfolioWithdrawal;
    }
    
    if (portfolio < 0) {
      if (trackYearly) {
        for (let r = year + 1; r < duration; r++) yearlyBalances.push(0);
      }
      return { success: false, endingPortfolio: 0, yearlyBalances };
    }
    
    if (trackYearly) {
      yearlyBalances.push(portfolio);
    }
  }
  
  return { success: true, endingPortfolio: portfolio, yearlyBalances };
}

function generateLtcEventAge(intake: IntakeData, retirementAge: number, duration: number): number | undefined {
  const ltcProb = intake.ltc_expectation === 'both_may_need' 
    ? ruleset.ltc.probability_both 
    : intake.ltc_expectation === 'one_may_need' || intake.ltc_expectation === 'not_sure'
      ? ruleset.ltc.probability_one
      : 0;
  
  if (Math.random() < ltcProb) {
    const ltcAge = 80 + Math.floor(Math.random() * 9);
    if (ltcAge >= retirementAge && ltcAge < retirementAge + duration) {
      return ltcAge;
    }
  }
  
  return undefined;
}

function calculateScoringAdjustments(intake: IntakeData, duration: number): number {
  let adjustment = 0;
  const { penalties, offsets } = ruleset.scoring;
  
  if (duration > 30) {
    adjustment += penalties.long_duration_per_year * (duration - 30);
  }
  
  if (intake.ltc_expectation === 'both_may_need') {
    adjustment += penalties.ltc_risk_both;
  } else if (intake.ltc_expectation === 'one_may_need' || intake.ltc_expectation === 'not_sure') {
    adjustment += penalties.ltc_risk_one;
  }
  
  if (!intake.ss_not_sure && intake.ss_claim_age) {
    const yearsBeforeSS = Math.max(0, intake.ss_claim_age - intake.retirement_age);
    adjustment += penalties.early_withdrawal_per_year * yearsBeforeSS;
  }
  
  if (intake.diversification_confidence < 4) {
    adjustment += penalties.low_diversification;
  }
  if (intake.allocation_bucket === 'concentrated') {
    adjustment += penalties.concentrated_portfolio;
  }
  
  if (intake.market_stress_response === 'high_stress') {
    adjustment += penalties.high_stress_response;
  }
  
  if (intake.spending_confidence < 4) {
    adjustment += penalties.low_spending_confidence;
  }
  
  if (intake.bridge_years === '6_10' || intake.bridge_years === '10_plus') {
    adjustment += offsets.strong_cash_buffer;
  } else if (intake.bridge_years === '0_2') {
    adjustment += penalties.no_cash_buffer;
  }
  
  if (intake.flexibility_score >= 7) {
    adjustment += offsets.high_flexibility;
  }
  
  if (intake.has_mortgage && intake.mortgage_payoff_year) {
    const birthYear = ruleset.current_year - intake.user_age;
    const payoffAge = intake.mortgage_payoff_year - birthYear;
    if (payoffAge <= intake.retirement_age) {
      adjustment += offsets.mortgage_paid_at_retirement;
    }
  }
  
  if (intake.spouse_employer_health === 'yes') {
    adjustment += offsets.employer_healthcare_bridge;
  }
  
  if (intake.has_pension && intake.pension_survivor === 'full') {
    adjustment += offsets.pension_with_survivor;
  }
  
  const maxAdj = ruleset.scoring.max_adjustment;
  adjustment = Math.max(-maxAdj, Math.min(maxAdj, adjustment));
  
  return adjustment;
}

function generateTopRisks(intake: IntakeData, duration: number, successRate: number): ResultsData['top_3_risks'] {
  const risks: { title: string; description: string; severity: 'high' | 'medium' | 'low'; score: number; impact_estimate?: string }[] = [];
  
  if (duration > 35) {
    risks.push({
      title: "Long Retirement Duration",
      description: `Your ${duration}-year retirement timeline is significantly longer than average. This increases the risk of outliving your savings.`,
      severity: duration > 40 ? 'high' : 'medium',
      score: duration - 30,
      impact_estimate: `Each extra year requires ~$${Math.round(intake.monthly_spending_ex_mortgage * 12 / 1000)}k in additional portfolio support`
    });
  }
  
  if (intake.ltc_expectation !== 'none' && intake.ltc_insurance !== 'comprehensive') {
    const ltcYears = ruleset.ltc.years;
    const ltcCost = ruleset.ltc.cost_per_year;
    const insuranceReduction = ruleset.ltc.insurance_reduction[intake.ltc_insurance as keyof typeof ruleset.ltc.insurance_reduction];
    const avgReduction = insuranceReduction ? (insuranceReduction.min + insuranceReduction.max) / 2 : 0;
    const netCost = ltcCost * (1 - avgReduction) * ltcYears;
    risks.push({
      title: "Long-Term Care Exposure",
      description: "Potential long-term care costs could significantly impact your plan. Consider reviewing your coverage options.",
      severity: intake.ltc_expectation === 'both_may_need' ? 'high' : 'medium',
      score: intake.ltc_expectation === 'both_may_need' ? 15 : 10,
      impact_estimate: `Potential cost of $${Math.round(netCost / 1000)}k over ${ltcYears} years`
    });
  }
  
  if (intake.bridge_years === '0_2' && intake.retirement_age < 65) {
    risks.push({
      title: "Sequence of Returns Risk",
      description: "Limited cash reserves make you vulnerable to market downturns in early retirement. A poor first few years could significantly impact your plan.",
      severity: 'high',
      score: 12,
      impact_estimate: "A 2008-style downturn could reduce success rate by 15-25%"
    });
  }
  
  if (intake.allocation_bucket === 'concentrated') {
    risks.push({
      title: "Portfolio Concentration",
      description: "A concentrated portfolio increases volatility and risk. Consider diversifying across asset classes.",
      severity: 'high',
      score: 14,
      impact_estimate: "Concentrated portfolios can lose 40-60% in a single downturn"
    });
  }
  
  if (intake.pre65_healthcare !== 'no' && intake.retirement_age < 65) {
    const yearsWithoutMedicare = 65 - intake.retirement_age;
    const annualCost = intake.planning_for === 'couple'
      ? ruleset.healthcare.default_pre65_per_person_monthly * 2 * 12
      : ruleset.healthcare.default_pre65_per_person_monthly * 12;
    const totalCost = annualCost * yearsWithoutMedicare;
    risks.push({
      title: "Pre-Medicare Healthcare Gap",
      description: `You'll need ${yearsWithoutMedicare} years of healthcare coverage before Medicare eligibility, which can be expensive.`,
      severity: yearsWithoutMedicare > 5 ? 'high' : 'medium',
      score: yearsWithoutMedicare * 2,
      impact_estimate: `~$${Math.round(totalCost / 1000)}k total over ${yearsWithoutMedicare} years (~$${Math.round(annualCost / 1000)}k/yr)`
    });
  }
  
  if (intake.diversification_confidence < 4) {
    risks.push({
      title: "Portfolio Diversification Concerns",
      description: "Your portfolio may lack sufficient diversification. This increases risk and volatility.",
      severity: 'medium',
      score: 8,
      impact_estimate: "Poor diversification can add 3-5% annual volatility"
    });
  }
  
  if (intake.has_mortgage && intake.mortgage_payoff_year) {
    const birthYear = ruleset.current_year - intake.user_age;
    const payoffAge = intake.mortgage_payoff_year - birthYear;
    if (payoffAge > intake.retirement_age) {
      const yearsWithMortgage = payoffAge - intake.retirement_age;
      const totalMortgageCost = (intake.mortgage_monthly || 0) * 12 * yearsWithMortgage;
      risks.push({
        title: "Mortgage in Retirement",
        description: `You'll have ${yearsWithMortgage} years of mortgage payments in retirement, reducing flexibility.`,
        severity: yearsWithMortgage > 5 ? 'medium' : 'low',
        score: yearsWithMortgage,
        impact_estimate: `$${Math.round(totalMortgageCost / 1000)}k total mortgage cost in retirement`
      });
    }
  }
  
  if (intake.market_stress_response === 'high_stress') {
    risks.push({
      title: "Behavioral Risk",
      description: "Emotional reactions to market volatility could lead to poor timing decisions. Having a plan before downturns occur is crucial.",
      severity: 'medium',
      score: 7,
      impact_estimate: "Panic selling during downturns costs 2-4% annually on average"
    });
  }
  
  return risks
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ title, description, severity, impact_estimate }) => ({ title, description, severity, impact_estimate }));
}

function generateTopLevers(intake: IntakeData, duration: number): ResultsData['top_3_levers'] {
  const levers: { title: string; description: string; impact: 'high' | 'medium' | 'low'; score: number }[] = [];
  
  if (intake.flexibility_score < 7) {
    levers.push({
      title: "Delay Retirement",
      description: "Each year you delay retirement adds to savings, reduces withdrawal years, and potentially increases Social Security benefits.",
      impact: 'high',
      score: 15
    });
  }
  
  if (!intake.ss_not_sure && intake.ss_claim_age && intake.ss_claim_age < 70) {
    levers.push({
      title: "Delay Social Security Claiming",
      description: "Waiting to claim Social Security until age 70 maximizes your guaranteed lifetime income by approximately 8% per year of delay.",
      impact: 'high',
      score: 14
    });
  }
  
  levers.push({
    title: "Reduce Discretionary Spending",
    description: "Even a 10% reduction in spending can significantly improve your plan's probability of success.",
    impact: 'medium',
    score: 10
  });
  
  if (intake.bridge_years === '0_2' || intake.bridge_years === '3_5') {
    levers.push({
      title: "Build Cash Reserves",
      description: "Having 3-5 years of expenses in stable assets protects against sequence of returns risk in early retirement.",
      impact: 'high',
      score: 12
    });
  }
  
  if (intake.ltc_insurance !== 'comprehensive' && intake.ltc_expectation !== 'none') {
    levers.push({
      title: "Consider Long-Term Care Insurance",
      description: "A comprehensive LTC policy could protect your portfolio from a major tail risk.",
      impact: 'medium',
      score: 9
    });
  }
  
  if (intake.allocation_bucket === 'concentrated' || intake.diversification_confidence < 5) {
    levers.push({
      title: "Diversify Your Portfolio",
      description: "Spreading investments across asset classes, sectors, and geographies reduces risk and volatility.",
      impact: 'medium',
      score: 8
    });
  }
  
  if (intake.has_mortgage) {
    levers.push({
      title: "Pay Off Mortgage Before Retirement",
      description: "Eliminating mortgage payments reduces your baseline expenses and provides more flexibility.",
      impact: 'medium',
      score: 7
    });
  }
  
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
  
  if (intake.ss_not_sure) {
    const ssDefault = intake.planning_for === 'couple'
      ? ruleset.ss_defaults.couple_monthly
      : ruleset.ss_defaults.individual_monthly;
    callouts.push({
      type: "Social Security Estimate",
      message: `Since you weren't sure about Social Security, we assumed $${ssDefault.toLocaleString()}/month starting at age ${ruleset.ss_defaults.default_claim_age}. Your actual benefit may differ — check ssa.gov for a personalized estimate.`
    });
  }
  
  return callouts;
}

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

function generateDistributionData(portfolios: number[], total: number): { range: string; count: number; percentage: number }[] {
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

function computeTrajectoryPercentiles(
  allYearlyBalances: number[][],
  duration: number,
  retirementAge: number
): ResultsData['trajectory_percentiles'] {
  const result: ResultsData['trajectory_percentiles'] = [];

  for (let y = 0; y <= duration; y++) {
    const vals = allYearlyBalances.map(b => b[y] ?? 0).sort((a, b) => a - b);
    const n = vals.length;
    const pct = (p: number) => vals[Math.floor(n * p)] ?? 0;
    result.push({
      year: y,
      age: retirementAge + y,
      p10: Math.round(pct(0.10)),
      p25: Math.round(pct(0.25)),
      p50: Math.round(pct(0.50)),
      p75: Math.round(pct(0.75)),
      p90: Math.round(pct(0.90))
    });
  }
  return result;
}

function generateIncomeSpendingTimeline(
  intake: IntakeData,
  duration: number,
  retirementAge: number
): ResultsData['income_spending_timeline'] {
  const timeline: ResultsData['income_spending_timeline'] = [];

  for (let year = 0; year < duration; year++) {
    const currentAge = retirementAge + year;
    const totalSpending = calculateAnnualSpending(intake, year, retirementAge, false, 0);
    const ssIncome = getSSIncome(intake, currentAge);
    const pensionIncome = getPensionIncome(intake, currentAge);
    const otherIncome = getOtherIncome(intake, currentAge);
    const totalIncome = ssIncome + pensionIncome + otherIncome;
    const portfolioWithdrawal = Math.max(0, totalSpending - totalIncome);

    timeline.push({
      age: currentAge,
      total_spending: Math.round(totalSpending),
      ss_income: Math.round(ssIncome),
      pension_income: Math.round(pensionIncome),
      other_income: Math.round(otherIncome),
      portfolio_withdrawal: Math.round(portfolioWithdrawal)
    });
  }
  return timeline;
}

function computeSpendingPhases(
  intake: IntakeData,
  duration: number,
  retirementAge: number
): { early: number; mid: number; late: number } {
  let earlyTotal = 0, earlyCount = 0;
  let midTotal = 0, midCount = 0;
  let lateTotal = 0, lateCount = 0;

  for (let year = 0; year < duration; year++) {
    const spending = calculateAnnualSpending(intake, year, retirementAge, false, 0);
    if (year < 10) { earlyTotal += spending; earlyCount++; }
    else if (year < 20) { midTotal += spending; midCount++; }
    else { lateTotal += spending; lateCount++; }
  }

  return {
    early: earlyCount > 0 ? Math.round(earlyTotal / earlyCount) : 0,
    mid: midCount > 0 ? Math.round(midTotal / midCount) : 0,
    late: lateCount > 0 ? Math.round(lateTotal / lateCount) : 0
  };
}

function runQuickSimulation(
  intake: IntakeData,
  startingPortfolio: number,
  duration: number,
  allocationParams: { mean_return: number; volatility: number }
): number {
  const quickTrials = 500;
  let successCount = 0;
  for (let i = 0; i < quickTrials; i++) {
    const ltcEventAge = generateLtcEventAge(intake, intake.retirement_age, duration);
    const result = runTrial(intake, startingPortfolio, duration, allocationParams, ltcEventAge, false);
    if (result.success) successCount++;
  }
  let prob = (successCount / quickTrials) * 100;
  const adj = calculateScoringAdjustments(intake, duration);
  prob = Math.max(0, Math.min(100, prob + adj));
  return Math.round(prob * 10) / 10;
}

function generateWhatIfScenarios(
  intake: IntakeData,
  originalProbability: number,
  startingPortfolio: number,
  allocationParams: { mean_return: number; volatility: number }
): ResultsData['what_if_scenarios'] {
  const scenarios: ResultsData['what_if_scenarios'] = [];

  const delayYears = 2;
  const delayIntake = { ...intake, retirement_age: intake.retirement_age + delayYears };
  const delayDuration = calculateRetirementDuration(delayIntake);
  if (delayDuration > 0) {
    const growthFactor = Math.pow(1 + allocationParams.mean_return, delayYears);
    const delayPortfolio = Math.round(startingPortfolio * growthFactor);
    const prob = runQuickSimulation(delayIntake, delayPortfolio, delayDuration, allocationParams);
    scenarios.push({
      label: "Delay Retirement 2 Years",
      description: `Retire at ${intake.retirement_age + delayYears} with ~${formatDollarsShort(delayPortfolio)} (portfolio grows ${delayYears} more years)`,
      original_probability: originalProbability,
      scenario_probability: prob
    });
  }

  const reducedIntake = { ...intake, monthly_spending_ex_mortgage: Math.round(intake.monthly_spending_ex_mortgage * 0.9) };
  const reducedDuration = calculateRetirementDuration(reducedIntake);
  const probReduced = runQuickSimulation(reducedIntake, startingPortfolio, reducedDuration, allocationParams);
  scenarios.push({
    label: "Reduce Spending 10%",
    description: `Lower monthly spending from $${intake.monthly_spending_ex_mortgage.toLocaleString()} to $${reducedIntake.monthly_spending_ex_mortgage.toLocaleString()}`,
    original_probability: originalProbability,
    scenario_probability: probReduced
  });

  const ssClaimAge = intake.ss_not_sure ? ruleset.ss_defaults.default_claim_age : (intake.ss_claim_age || 67);
  if (ssClaimAge < 70) {
    const currentMonthly = intake.ss_not_sure
      ? (intake.planning_for === 'couple' ? ruleset.ss_defaults.couple_monthly : ruleset.ss_defaults.individual_monthly)
      : (intake.ss_monthly_household || 0);
    const yearsDelay = 70 - ssClaimAge;
    const boostedMonthly = Math.round(currentMonthly * (1 + 0.08 * yearsDelay));
    const delaySSIntake = {
      ...intake,
      ss_not_sure: false,
      ss_claim_age: 70 as number | null,
      ss_monthly_household: boostedMonthly as number | null
    };
    const ssDuration = calculateRetirementDuration(delaySSIntake);
    const probSS = runQuickSimulation(delaySSIntake, startingPortfolio, ssDuration, allocationParams);
    scenarios.push({
      label: "Delay SS to Age 70",
      description: `Wait until 70 for ~$${boostedMonthly.toLocaleString()}/mo instead of $${currentMonthly.toLocaleString()}/mo at ${ssClaimAge}`,
      original_probability: originalProbability,
      scenario_probability: probSS
    });
  }

  return scenarios;
}

function generateNarrativeSummary(
  intake: IntakeData,
  duration: number,
  successProbability: number,
  startingPortfolio: number,
  year1Spending: number,
  year1Income: number,
  ssAnnualIncome: number
): string {
  const planType = intake.planning_for === 'couple' ? 'you and your spouse' : 'you';
  const retAge = intake.retirement_age;
  const portfolioLabel = startingPortfolio >= 1000000
    ? `$${(startingPortfolio / 1000000).toFixed(1)}M`
    : `$${Math.round(startingPortfolio / 1000)}k`;

  let narrative = `Based on your inputs, ${planType} are planning a ${duration}-year retirement starting at age ${retAge} with ${portfolioLabel} in savings.`;

  const ssClaimAge = intake.ss_not_sure ? ruleset.ss_defaults.default_claim_age : (intake.ss_claim_age || null);
  if (ssClaimAge && ssClaimAge > retAge) {
    const gapYears = ssClaimAge - retAge;
    const annualWithdrawal = Math.max(0, year1Spending - (year1Income - (ssAnnualIncome > 0 && year1Income >= ssAnnualIncome ? ssAnnualIncome : 0)));
    const withdrawalLabel = annualWithdrawal >= 1000 ? `$${Math.round(annualWithdrawal / 1000)}k` : `$${Math.round(annualWithdrawal).toLocaleString()}`;
    narrative += ` Your biggest challenge is the ${gapYears}-year gap before Social Security begins at ${ssClaimAge}, during which you'll need to withdraw about ${withdrawalLabel}/year from your portfolio.`;
  }

  if (ssAnnualIncome > 0) {
    const coveragePct = Math.round((ssAnnualIncome / year1Spending) * 100);
    if (coveragePct > 0) {
      narrative += ` Once Social Security kicks in, it covers about ${coveragePct}% of your spending needs, significantly reducing portfolio strain.`;
    }
  }

  if (successProbability >= 85) {
    narrative += ` Overall, your plan shows strong resilience across most market scenarios.`;
  } else if (successProbability >= 70) {
    narrative += ` Your plan has a reasonable foundation but could benefit from targeted adjustments to improve confidence.`;
  } else {
    narrative += ` Your current plan faces meaningful headwinds — the levers below highlight the most impactful changes you can make.`;
  }

  return narrative;
}

export function runMonteCarloSimulation(intake: IntakeData): ResultsData {
  const { trials } = ruleset.monte_carlo;
  const startingPortfolio = getStartingPortfolio(intake.assets_bucket);
  const allocationParams = getAllocationAssumptions(intake.allocation_bucket);
  const duration = calculateRetirementDuration(intake);
  
  let successCount = 0;
  const endingPortfolios: number[] = [];
  const allYearlyBalances: number[][] = [];
  
  for (let i = 0; i < trials; i++) {
    const ltcEventAge = generateLtcEventAge(intake, intake.retirement_age, duration);
    const result = runTrial(intake, startingPortfolio, duration, allocationParams, ltcEventAge, true);
    
    if (result.success) {
      successCount++;
    }
    endingPortfolios.push(result.endingPortfolio);
    allYearlyBalances.push(result.yearlyBalances);
  }
  
  let successProbability = (successCount / trials) * 100;
  
  const adjustment = calculateScoringAdjustments(intake, duration);
  successProbability = Math.max(0, Math.min(100, successProbability + adjustment));
  
  if (duration >= 40 && successProbability >= 85) {
    const hasStrongIncome = (intake.ss_monthly_household || 0) > 4000 || 
                            (intake.pension_monthly || 0) > 2500;
    const hasHighFlexibility = intake.flexibility_score >= 8;
    
    if (!hasStrongIncome && !hasHighFlexibility) {
      successProbability = Math.min(successProbability, 82);
    }
  }
  
  const finalProbability = Math.round(successProbability * 10) / 10;

  endingPortfolios.sort((a, b) => a - b);
  const medianIndex = Math.floor(endingPortfolios.length / 2);
  const worstCaseIndex = Math.floor(endingPortfolios.length * 0.05);
  
  let verdict: 'on_track' | 'borderline' | 'at_risk';
  if (successProbability >= ruleset.verdict_thresholds.on_track) {
    verdict = 'on_track';
  } else if (successProbability >= ruleset.verdict_thresholds.borderline) {
    verdict = 'borderline';
  } else {
    verdict = 'at_risk';
  }
  
  const year1Spending = calculateAnnualSpending(intake, 0, intake.retirement_age, false, 0);
  const year1GuaranteedIncome = calculateGuaranteedIncome(intake, 0, intake.retirement_age);
  
  const ssAnnualIncome = intake.ss_not_sure
    ? (intake.planning_for === 'couple' ? ruleset.ss_defaults.couple_monthly : ruleset.ss_defaults.individual_monthly) * 12
    : (intake.ss_monthly_household ? intake.ss_monthly_household * 12 : 0);
  
  const nonSSIncome = getNonSSIncomeAtRetirement(intake);
  const ssClaimAge = intake.ss_not_sure ? ruleset.ss_defaults.default_claim_age : (intake.ss_claim_age || 99);
  const ssActiveAtRetirement = intake.retirement_age >= ssClaimAge;
  const year1IncomeWithoutSS = nonSSIncome;
  const year1IncomeWithSS = nonSSIncome + ssAnnualIncome;

  const preSSWithdrawalRate = startingPortfolio > 0 
    ? (Math.max(0, year1Spending - (ssActiveAtRetirement ? year1IncomeWithSS : year1IncomeWithoutSS)) / startingPortfolio) * 100 
    : 0;
  
  const postSSWithdrawalRate = startingPortfolio > 0 
    ? (Math.max(0, year1Spending - year1IncomeWithSS) / startingPortfolio) * 100 
    : 0;

  const incomeFloorCoveragePct = year1Spending > 0
    ? Math.round((year1GuaranteedIncome / year1Spending) * 100)
    : 0;

  const distributionData = generateDistributionData(endingPortfolios, trials);
  const trajectoryPercentiles = computeTrajectoryPercentiles(allYearlyBalances, duration, intake.retirement_age);
  const incomeSpendingTimeline = generateIncomeSpendingTimeline(intake, duration, intake.retirement_age);
  const spendingPhases = computeSpendingPhases(intake, duration, intake.retirement_age);
  const whatIfScenarios = generateWhatIfScenarios(intake, finalProbability, startingPortfolio, allocationParams);
  const narrativeSummary = generateNarrativeSummary(intake, duration, finalProbability, startingPortfolio, year1Spending, year1GuaranteedIncome, ssAnnualIncome);
  
  return {
    verdict,
    success_probability: finalProbability,
    narrative_summary: narrativeSummary,
    top_3_risks: generateTopRisks(intake, duration, successProbability),
    top_3_levers: generateTopLevers(intake, duration),
    what_matters_less: generateWhatMattersLess(intake),
    assumptions_and_limits: [
      `Returns modeled as real (inflation-adjusted) at ${(allocationParams.mean_return * 100).toFixed(1)}% mean with ${(allocationParams.volatility * 100).toFixed(0)}% volatility`,
      `An effective tax rate of ${(ruleset.monte_carlo.effective_tax_rate * 100).toFixed(0)}% is applied to portfolio withdrawals`,
      `Social Security income tracks full CPI inflation; pension income has no COLA adjustment`,
      intake.ss_not_sure
        ? `Social Security estimated at $${(intake.planning_for === 'couple' ? ruleset.ss_defaults.couple_monthly : ruleset.ss_defaults.individual_monthly).toLocaleString()}/month (default assumption)`
        : `Social Security assumed to pay stated benefits (no reduction modeled)`,
      `Long-term care costs estimated at $${(ruleset.ltc.cost_per_year / 1000).toFixed(0)}k/year (in today's dollars) for ${ruleset.ltc.years} years if needed`,
      `Results based on ${trials.toLocaleString()} Monte Carlo simulations`
    ],
    special_callouts: generateSpecialCallouts(intake, duration),
    what_if_scenarios: whatIfScenarios,
    trajectory_percentiles: trajectoryPercentiles,
    income_spending_timeline: incomeSpendingTimeline,
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
      income_floor_coverage_pct: incomeFloorCoveragePct,
      spending_phases: spendingPhases,
      distribution_data: distributionData
    }
  };
}
