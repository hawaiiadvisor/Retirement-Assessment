// CFP-designed ruleset configuration
// Owner-editable assumptions for Monte Carlo simulation and risk scoring

export const ruleset = {
  version: "1.0",
  
  // Long-term care assumptions
  ltc: {
    cost_per_year: 100000,
    years: 3,
    probability_one: 0.40,
    probability_both: 0.40,
    insurance_reduction: {
      comprehensive: { min: 0.8, max: 1.0 },
      partial: { min: 0.4, max: 0.6 },
      none: { min: 0.0, max: 0.2 },
      not_sure: { min: 0.0, max: 0.2 }
    }
  },
  
  // Healthcare assumptions
  healthcare: {
    default_pre65_per_person_monthly: 1000,
    medicare_start_age: 65
  },
  
  // Monte Carlo settings
  monte_carlo: {
    trials: 3000,
    inflation_rate: 0.025,
    
    // Return/volatility by allocation
    allocation_assumptions: {
      mostly_stocks: { mean_return: 0.08, volatility: 0.18 },
      balanced: { mean_return: 0.065, volatility: 0.12 },
      conservative: { mean_return: 0.05, volatility: 0.08 },
      concentrated: { mean_return: 0.09, volatility: 0.25 },
      not_sure: { mean_return: 0.06, volatility: 0.14 }
    }
  },
  
  // Asset bucket midpoints for simulation
  asset_midpoints: {
    less_500k: 350000,
    '500k_1m': 750000,
    '1m_2m': 1500000,
    '2m_3m': 2500000,
    '3m_plus': 4000000,
    not_sure: 1000000
  },
  
  // Life expectancy mapping to planning age
  life_expectancy_ages: {
    early_80s: 82,
    mid_80s: 85,
    late_80s: 88,
    '90_plus': 95,
    not_sure: 90
  },
  
  // Duration risk tiers
  duration_tiers: {
    normal: { max: 30, penalty: 0 },
    elevated: { max: 35, penalty: 5 },
    high: { max: 40, penalty: 10 },
    extreme: { min: 40, penalty: 20 }
  },
  
  // Success probability thresholds
  verdict_thresholds: {
    on_track: 85,
    borderline: 70,
    at_risk: 0
  },
  
  // Scoring adjustments
  scoring: {
    // Penalties (reduce success probability)
    penalties: {
      long_duration_per_year: -0.5,
      ltc_risk_one: -3,
      ltc_risk_both: -6,
      early_withdrawal_per_year: -0.3,
      low_diversification: -2,
      concentrated_portfolio: -5,
      high_stress_response: -3,
      low_spending_confidence: -2,
      no_cash_buffer: -2
    },
    // Offsets (improve success probability)
    offsets: {
      strong_cash_buffer: 3,
      high_flexibility: 4,
      mortgage_paid_at_retirement: 2,
      employer_healthcare_bridge: 2,
      strong_guaranteed_income: 5,
      pension_with_survivor: 3
    }
  },
  
  // Current year for calculations
  current_year: 2026
};

export type Ruleset = typeof ruleset;
