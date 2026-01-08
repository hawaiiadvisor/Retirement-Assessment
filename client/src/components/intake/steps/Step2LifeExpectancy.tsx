import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroupField } from "../RadioGroupField";
import type { IntakeData } from "@shared/schema";

interface Step2Props {
  data: Partial<IntakeData>;
  onChange: (updates: Partial<IntakeData>) => void;
  errors?: Record<string, string>;
}

export function Step2LifeExpectancy({ data, onChange, errors = {} }: Step2Props) {
  const isCouple = data.planning_for === 'couple';
  
  const lifeExpectancyOptions = [
    { value: 'early_80s', label: 'Early 80s', description: 'Based on family history or health factors' },
    { value: 'mid_80s', label: 'Mid 80s', description: 'Average life expectancy' },
    { value: 'late_80s', label: 'Late 80s', description: 'Longer than average' },
    { value: '90_plus', label: '90+', description: 'Plan for a long retirement' },
    { value: 'not_sure', label: "I'm not sure", description: "We'll use a conservative estimate" }
  ];
  
  const ltcExpectationOptions = [
    { value: 'none', label: 'Neither of us will likely need care', description: 'Based on family history and health' },
    { value: 'one_may_need', label: 'One person may need care', description: 'Some possibility of needing assistance' },
    { value: 'both_may_need', label: 'Both may need care', description: 'Higher likelihood based on circumstances' },
    { value: 'not_sure', label: "I'm not sure", description: "We'll plan conservatively for potential needs" }
  ];
  
  const ltcInsuranceOptions = [
    { value: 'comprehensive', label: 'Comprehensive coverage', description: 'Full long-term care insurance policy' },
    { value: 'partial', label: 'Partial coverage', description: 'Some coverage but may not cover full costs' },
    { value: 'none', label: 'No coverage', description: 'Will self-fund if needed' },
    { value: 'not_sure', label: "I'm not sure", description: 'Need to review current coverage' }
  ];
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Life Expectancy & Long-Term Care</h2>
        <p className="text-muted-foreground mt-2">
          Planning for how long your retirement may last helps us model your needs accurately.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Life Expectancy</CardTitle>
          <CardDescription>
            Consider your family health history, current health, and lifestyle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroupField
            label="Your expected life expectancy"
            value={data.user_life_expectancy || ''}
            onChange={(val) => onChange({ user_life_expectancy: val as any })}
            options={lifeExpectancyOptions}
            required
            error={errors.user_life_expectancy}
            testId="radio-user-life-expectancy"
          />
          
          {isCouple && (
            <RadioGroupField
              label="Spouse/partner's expected life expectancy"
              value={data.spouse_life_expectancy || ''}
              onChange={(val) => onChange({ spouse_life_expectancy: val as any })}
              options={lifeExpectancyOptions}
              error={errors.spouse_life_expectancy}
              testId="radio-spouse-life-expectancy"
            />
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Long-Term Care Planning</CardTitle>
          <CardDescription>
            Long-term care costs can significantly impact retirement. Most people have a 50% chance of needing some form of care.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroupField
            label="Long-term care expectation"
            helperText={isCouple ? "Considering both of you, what's most likely?" : "Based on your health and family history"}
            value={data.ltc_expectation || ''}
            onChange={(val) => onChange({ ltc_expectation: val as any })}
            options={isCouple ? ltcExpectationOptions : ltcExpectationOptions.filter(o => o.value !== 'both_may_need')}
            required
            error={errors.ltc_expectation}
            testId="radio-ltc-expectation"
          />
          
          <RadioGroupField
            label="Long-term care insurance"
            helperText="Do you have insurance to help cover care costs?"
            value={data.ltc_insurance || ''}
            onChange={(val) => onChange({ ltc_insurance: val as any })}
            options={ltcInsuranceOptions}
            required
            error={errors.ltc_insurance}
            testId="radio-ltc-insurance"
          />
        </CardContent>
      </Card>
    </div>
  );
}
