import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroupField } from "../RadioGroupField";
import { SliderField } from "../SliderField";
import type { IntakeData } from "@shared/schema";

interface Step5Props {
  data: Partial<IntakeData>;
  onChange: (updates: Partial<IntakeData>) => void;
  errors?: Record<string, string>;
}

export function Step5Portfolio({ data, onChange, errors = {} }: Step5Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Your Portfolio</h2>
        <p className="text-muted-foreground mt-2">
          Understanding your investment assets helps us project how they may grow and support your retirement.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Total Investable Assets</CardTitle>
          <CardDescription>
            Include all retirement accounts (401k, IRA), brokerage accounts, and savings. 
            Exclude your primary residence and any real estate counted as rental income.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroupField
            label="What is your approximate total?"
            value={data.assets_bucket || ''}
            onChange={(val) => onChange({ assets_bucket: val as any })}
            options={[
              { value: 'less_500k', label: 'Less than $500,000' },
              { value: '500k_1m', label: '$500,000 - $1 million' },
              { value: '1m_2m', label: '$1 million - $2 million' },
              { value: '2m_3m', label: '$2 million - $3 million' },
              { value: '3m_plus', label: '$3 million or more' },
              { value: 'not_sure', label: "I'm not sure", description: "We'll use a moderate estimate" }
            ]}
            required
            error={errors.assets_bucket}
            testId="radio-assets-bucket"
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Asset Allocation</CardTitle>
          <CardDescription>
            How are your investments currently allocated between stocks and bonds/cash?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroupField
            label="Current allocation"
            value={data.allocation_bucket || ''}
            onChange={(val) => onChange({ allocation_bucket: val as any })}
            options={[
              { value: 'mostly_stocks', label: 'Mostly stocks (70%+ equities)', description: 'Higher growth potential, higher volatility' },
              { value: 'balanced', label: 'Balanced (40-70% equities)', description: 'Mix of growth and stability' },
              { value: 'conservative', label: 'Conservative (under 40% equities)', description: 'Focus on capital preservation' },
              { value: 'concentrated', label: 'Concentrated in a few positions', description: 'Heavy in individual stocks or one sector' },
              { value: 'not_sure', label: "I'm not sure" }
            ]}
            required
            error={errors.allocation_bucket}
            testId="radio-allocation-bucket"
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diversification</CardTitle>
          <CardDescription>
            How well-diversified is your portfolio across different asset classes, sectors, and geographies?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SliderField
            label="Diversification confidence"
            helperText="Consider: Are you spread across different types of investments? Do you have international exposure? Are you over-concentrated in any one area?"
            value={data.diversification_confidence ?? 5}
            onChange={(val) => onChange({ diversification_confidence: val })}
            leftLabel="Not diversified"
            rightLabel="Well diversified"
            required
            error={errors.diversification_confidence}
            testId="slider-diversification"
          />
        </CardContent>
      </Card>
    </div>
  );
}
