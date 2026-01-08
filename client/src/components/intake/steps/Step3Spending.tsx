import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormFieldWrapper } from "../FormField";
import { RadioGroupField } from "../RadioGroupField";
import { SliderField } from "../SliderField";
import type { IntakeData } from "@shared/schema";

interface Step3Props {
  data: Partial<IntakeData>;
  onChange: (updates: Partial<IntakeData>) => void;
  errors?: Record<string, string>;
}

export function Step3Spending({ data, onChange, errors = {} }: Step3Props) {
  const isCouple = data.planning_for === 'couple';
  const showHealthcareDetails = data.pre65_healthcare === 'yes';
  const showMortgageDetails = data.has_mortgage === true;
  const showSpouseHealthcare = data.retire_same_time === 'spouse_longer';
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Spending in Retirement</h2>
        <p className="text-muted-foreground mt-2">
          Understanding your expenses helps us calculate how much you'll need to withdraw from savings.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Living Expenses</CardTitle>
          <CardDescription>
            Your core monthly spending excluding housing payment (if you have a mortgage)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormFieldWrapper
            label="Monthly spending (excluding mortgage)"
            helperText="Include rent if you're renting. Exclude mortgage payment if you own with a mortgage."
            required
            error={errors.monthly_spending_ex_mortgage}
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                min={0}
                value={data.monthly_spending_ex_mortgage || ''}
                onChange={(e) => onChange({ monthly_spending_ex_mortgage: parseInt(e.target.value) || undefined })}
                placeholder="e.g., 5000"
                className="max-w-[180px]"
                data-testid="input-monthly-spending"
              />
              <span className="text-muted-foreground">/ month</span>
            </div>
          </FormFieldWrapper>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormFieldWrapper
                label="Do you have a mortgage?"
                helperText="Include any housing debt you're still paying"
              >
                <div />
              </FormFieldWrapper>
              <Switch
                checked={data.has_mortgage || false}
                onCheckedChange={(checked) => onChange({ 
                  has_mortgage: checked,
                  mortgage_monthly: checked ? data.mortgage_monthly : undefined,
                  mortgage_payoff_year: checked ? data.mortgage_payoff_year : undefined
                })}
                data-testid="switch-has-mortgage"
              />
            </div>
            
            {showMortgageDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                <FormFieldWrapper
                  label="Monthly mortgage payment"
                  error={errors.mortgage_monthly}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      value={data.mortgage_monthly || ''}
                      onChange={(e) => onChange({ mortgage_monthly: parseInt(e.target.value) || undefined })}
                      placeholder="e.g., 2000"
                      className="max-w-[150px]"
                      data-testid="input-mortgage-monthly"
                    />
                  </div>
                </FormFieldWrapper>
                
                <FormFieldWrapper
                  label="Payoff year"
                  error={errors.mortgage_payoff_year}
                >
                  <Input
                    type="number"
                    min={2024}
                    max={2080}
                    value={data.mortgage_payoff_year || ''}
                    onChange={(e) => onChange({ mortgage_payoff_year: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 2035"
                    className="max-w-[120px]"
                    data-testid="input-mortgage-payoff"
                  />
                </FormFieldWrapper>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pre-65 Healthcare</CardTitle>
          <CardDescription>
            Healthcare before Medicare eligibility can be a significant expense
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroupField
            label="Will you need to purchase healthcare before age 65?"
            helperText="This applies if retiring before Medicare eligibility"
            value={data.pre65_healthcare || ''}
            onChange={(val) => onChange({ 
              pre65_healthcare: val as any,
              pre65_healthcare_monthly: val === 'yes' ? data.pre65_healthcare_monthly : undefined,
              pre65_healthcare_years: val === 'yes' ? data.pre65_healthcare_years : undefined
            })}
            options={[
              { value: 'no', label: 'No', description: 'Will have coverage through employer or other source' },
              { value: 'yes', label: 'Yes', description: 'Will need to purchase private coverage' },
              { value: 'not_sure', label: "I'm not sure", description: "We'll estimate based on your timeline" }
            ]}
            required
            error={errors.pre65_healthcare}
            testId="radio-pre65-healthcare"
          />
          
          {showHealthcareDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
              <FormFieldWrapper
                label="Monthly healthcare cost"
                error={errors.pre65_healthcare_monthly}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min={0}
                    value={data.pre65_healthcare_monthly || ''}
                    onChange={(e) => onChange({ pre65_healthcare_monthly: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 1500"
                    className="max-w-[150px]"
                    data-testid="input-healthcare-monthly"
                  />
                </div>
              </FormFieldWrapper>
              
              <FormFieldWrapper
                label="Years of pre-65 coverage needed"
                error={errors.pre65_healthcare_years}
              >
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={data.pre65_healthcare_years || ''}
                  onChange={(e) => onChange({ pre65_healthcare_years: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 5"
                  className="max-w-[100px]"
                  data-testid="input-healthcare-years"
                />
              </FormFieldWrapper>
            </div>
          )}
          
          {showSpouseHealthcare && (
            <RadioGroupField
              label="Will your spouse's employer provide healthcare?"
              helperText="Since your spouse will continue working"
              value={data.spouse_employer_health || ''}
              onChange={(val) => onChange({ spouse_employer_health: val as any })}
              options={[
                { value: 'yes', label: 'Yes', description: "I'll be covered by spouse's employer" },
                { value: 'no', label: 'No', description: 'Will need my own coverage' },
                { value: 'not_sure', label: "I'm not sure" }
              ]}
              error={errors.spouse_employer_health}
              testId="radio-spouse-employer-health"
            />
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spending Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SliderField
            label="How confident are you in your spending estimate?"
            helperText="Have you tracked expenses or is this an educated guess?"
            value={data.spending_confidence ?? 5}
            onChange={(val) => onChange({ spending_confidence: val })}
            leftLabel="Rough guess"
            rightLabel="Very confident"
            required
            error={errors.spending_confidence}
            testId="slider-spending-confidence"
          />
          
          <RadioGroupField
            label="How do you expect spending to change in early retirement?"
            helperText="Many retirees spend more in their early, active years"
            value={data.early_spending_pattern || ''}
            onChange={(val) => onChange({ early_spending_pattern: val as any })}
            options={[
              { value: 'higher', label: 'Higher than later years', description: 'More travel, hobbies, activities' },
              { value: 'same', label: 'About the same throughout', description: 'Steady spending pattern' },
              { value: 'lower', label: 'Lower than later years', description: 'Expect to spend less initially' },
              { value: 'one_time_purchases', label: 'Some large one-time purchases', description: 'New car, home renovations, etc.' },
              { value: 'not_sure', label: "I'm not sure" }
            ]}
            required
            error={errors.early_spending_pattern}
            testId="radio-early-spending"
          />
        </CardContent>
      </Card>
    </div>
  );
}
