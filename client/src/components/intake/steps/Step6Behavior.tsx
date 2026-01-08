import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroupField } from "../RadioGroupField";
import type { IntakeData } from "@shared/schema";

interface Step6Props {
  data: Partial<IntakeData>;
  onChange: (updates: Partial<IntakeData>) => void;
  errors?: Record<string, string>;
}

export function Step6Behavior({ data, onChange, errors = {} }: Step6Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Stress & Behavior</h2>
        <p className="text-muted-foreground mt-2">
          How you respond to market volatility matters as much as your portfolio allocation.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cash Reserves</CardTitle>
          <CardDescription>
            Having cash available helps avoid selling investments during market downturns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroupField
            label="How many years of expenses do you have in cash or stable investments?"
            helperText="This is money you could access without selling volatile investments"
            value={data.bridge_years || ''}
            onChange={(val) => onChange({ bridge_years: val as any })}
            options={[
              { value: '0_2', label: '0-2 years', description: 'Limited cash buffer' },
              { value: '3_5', label: '3-5 years', description: 'Moderate cash buffer' },
              { value: '6_10', label: '6-10 years', description: 'Strong cash buffer' },
              { value: '10_plus', label: '10+ years', description: 'Very conservative position' },
              { value: 'not_sure', label: "I'm not sure" }
            ]}
            required
            error={errors.bridge_years}
            testId="radio-bridge-years"
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market Volatility Response</CardTitle>
          <CardDescription>
            Imagine markets drop 30% in your first year of retirement. What would you do?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroupField
            label="How would you handle a major market downturn?"
            value={data.market_stress_response || ''}
            onChange={(val) => onChange({ market_stress_response: val as any })}
            options={[
              { 
                value: 'cash_1_2_years', 
                label: 'Use my cash reserves', 
                description: 'Live on cash/bonds until markets recover' 
              },
              { 
                value: 'reduce_spending', 
                label: 'Reduce spending significantly', 
                description: 'Cut discretionary expenses until markets stabilize' 
              },
              { 
                value: 'return_to_work', 
                label: 'Return to work part-time', 
                description: 'Earn some income to reduce withdrawals' 
              },
              { 
                value: 'high_stress', 
                label: 'Feel very stressed and uncertain', 
                description: "I'd struggle with this scenario" 
              },
              { 
                value: 'not_sure', 
                label: "I'm not sure how I'd react" 
              }
            ]}
            required
            error={errors.market_stress_response}
            testId="radio-market-stress"
          />
        </CardContent>
      </Card>
    </div>
  );
}
