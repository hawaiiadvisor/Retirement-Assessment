import { z } from "zod";

export type AssessmentStatus = 'draft' | 'submitted';

export const planningForSchema = z.enum(['self', 'couple']);
export const retireSameTimeSchema = z.enum(['same', 'spouse_longer', 'spouse_earlier', 'not_sure']);
export const lifeExpectancySchema = z.enum(['early_80s', 'mid_80s', 'late_80s', '90_plus', 'not_sure']);
export const ltcExpectationSchema = z.enum(['none', 'one_may_need', 'both_may_need', 'not_sure']);
export const ltcInsuranceSchema = z.enum(['comprehensive', 'partial', 'none', 'not_sure']);
export const earlySpendingPatternSchema = z.enum(['higher', 'same', 'lower', 'one_time_purchases', 'not_sure']);
export const survivorBenefitSchema = z.enum(['full', 'partial', 'none', 'not_sure']);
export const incomeReliabilitySchema = z.enum(['stable', 'variable', 'uncertain']);
export const assetsBucketSchema = z.enum(['less_500k', '500k_1m', '1m_2m', '2m_3m', '3m_plus', 'not_sure']);
export const allocationBucketSchema = z.enum(['mostly_stocks', 'balanced', 'conservative', 'concentrated', 'not_sure']);
export const bridgeYearsSchema = z.enum(['0_2', '3_5', '6_10', '10_plus', 'not_sure']);
export const marketStressResponseSchema = z.enum(['cash_1_2_years', 'reduce_spending', 'return_to_work', 'high_stress', 'not_sure']);
export const pre65HealthcareSchema = z.enum(['no', 'yes', 'not_sure']);
export const yesNoNotSureSchema = z.enum(['yes', 'no', 'not_sure']);

export const intakeSchema = z.object({
  planning_for: planningForSchema,
  user_age: z.number().min(18).max(100),
  spouse_age: z.number().min(18).max(100).optional(),
  retirement_age: z.number().min(50).max(85),
  flexibility_score: z.number().min(0).max(10).default(5),
  retire_same_time: retireSameTimeSchema.optional(),
  
  user_life_expectancy: lifeExpectancySchema,
  spouse_life_expectancy: lifeExpectancySchema.optional(),
  ltc_expectation: ltcExpectationSchema,
  ltc_insurance: ltcInsuranceSchema,
  
  monthly_spending_ex_mortgage: z.number().min(0),
  has_mortgage: z.boolean().default(false),
  mortgage_monthly: z.number().min(0).optional(),
  mortgage_payoff_year: z.number().min(2024).max(2080).optional(),
  pre65_healthcare: pre65HealthcareSchema,
  pre65_healthcare_monthly: z.number().min(0).optional(),
  pre65_healthcare_years: z.number().min(0).max(20).optional(),
  spouse_employer_health: yesNoNotSureSchema.optional(),
  spending_confidence: z.number().min(0).max(10).default(5),
  early_spending_pattern: earlySpendingPatternSchema,
  
  ss_claim_age: z.number().min(62).max(70).nullable().default(null),
  ss_monthly_household: z.number().min(0).nullable().default(null),
  ss_not_sure: z.boolean().default(false),
  has_pension: z.boolean().default(false),
  pension_monthly: z.number().min(0).optional(),
  pension_start_age: z.number().min(50).max(85).optional(),
  pension_survivor: survivorBenefitSchema.optional(),
  has_rental_business_income: z.boolean().default(false),
  rental_annual_amount: z.number().min(0).optional(),
  rental_start_age: z.number().min(50).max(85).optional(),
  rental_end_age: z.union([z.number().min(50).max(100), z.literal('ongoing')]).optional(),
  rental_reliability: incomeReliabilitySchema.optional(),
  
  assets_bucket: assetsBucketSchema,
  allocation_bucket: allocationBucketSchema,
  diversification_confidence: z.number().min(0).max(10).default(5),
  
  bridge_years: bridgeYearsSchema,
  market_stress_response: marketStressResponseSchema,
  
  worries_free_text: z.string().max(2000).optional(),
  regret_tradeoff: z.string().max(2000).optional(),
  readiness_feel: z.number().min(0).max(10).default(5),
  acknowledgment_checkbox: z.boolean().refine(val => val === true, {
    message: "You must acknowledge the terms to continue"
  })
});

export type IntakeData = z.infer<typeof intakeSchema>;

export const resultsSchema = z.object({
  verdict: z.enum(['on_track', 'borderline', 'at_risk']),
  success_probability: z.number().min(0).max(100),
  top_3_risks: z.array(z.object({
    title: z.string(),
    description: z.string(),
    severity: z.enum(['high', 'medium', 'low'])
  })),
  top_3_levers: z.array(z.object({
    title: z.string(),
    description: z.string(),
    impact: z.enum(['high', 'medium', 'low'])
  })),
  what_matters_less: z.array(z.string()),
  assumptions_and_limits: z.array(z.string()),
  special_callouts: z.array(z.object({
    type: z.string(),
    message: z.string()
  })),
  simulation_details: z.object({
    trials: z.number(),
    median_ending_portfolio: z.number(),
    worst_case_portfolio: z.number(),
    retirement_duration_years: z.number(),
    annual_spending_year1: z.number(),
    guaranteed_income_at_start: z.number(),
    starting_portfolio: z.number(),
    ss_annual_income: z.number(),
    pre_ss_withdrawal_rate: z.number(),
    post_ss_withdrawal_rate: z.number(),
    distribution_data: z.array(z.object({
      range: z.string(),
      count: z.number(),
      percentage: z.number()
    })).optional()
  })
});

export type ResultsData = z.infer<typeof resultsSchema>;
