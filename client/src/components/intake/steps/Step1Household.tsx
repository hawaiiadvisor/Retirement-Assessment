import { Input } from "@/components/ui/input";
import { FormFieldWrapper } from "../FormField";
import { RadioGroupField } from "../RadioGroupField";
import { SliderField } from "../SliderField";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { IntakeData } from "@shared/schema";

interface Step1Props {
  data: Partial<IntakeData>;
  onChange: (updates: Partial<IntakeData>) => void;
  errors?: Record<string, string>;
}

export function Step1Household({ data, onChange, errors = {} }: Step1Props) {
  const isCouple = data.planning_for === 'couple';
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Household & Timing</h2>
        <p className="text-muted-foreground mt-2">
          Let's understand who you're planning for and when you'd like to retire.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Who are you planning for?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroupField
            label="Planning for"
            value={data.planning_for || ''}
            onChange={(val) => onChange({ planning_for: val as 'self' | 'couple' })}
            options={[
              { value: 'self', label: 'Just myself', description: 'Individual retirement planning' },
              { value: 'couple', label: 'My spouse/partner and me', description: 'Joint retirement planning for both of us' }
            ]}
            required
            error={errors.planning_for}
            testId="radio-planning-for"
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ages</CardTitle>
          <CardDescription>Your current ages help us calculate your retirement timeline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldWrapper 
              label="Your current age" 
              required
              error={errors.user_age}
            >
              <Input
                type="number"
                min={18}
                max={100}
                value={data.user_age || ''}
                onChange={(e) => onChange({ user_age: parseInt(e.target.value) || undefined })}
                placeholder="e.g., 55"
                className="max-w-[150px]"
                data-testid="input-user-age"
              />
            </FormFieldWrapper>
            
            {isCouple && (
              <FormFieldWrapper 
                label="Spouse/partner's current age"
                required={isCouple}
                error={errors.spouse_age}
              >
                <Input
                  type="number"
                  min={18}
                  max={100}
                  value={data.spouse_age || ''}
                  onChange={(e) => onChange({ spouse_age: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 53"
                  className="max-w-[150px]"
                  data-testid="input-spouse-age"
                />
              </FormFieldWrapper>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Retirement Timing</CardTitle>
          <CardDescription>When do you plan to stop working?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormFieldWrapper 
            label="Target retirement age"
            helperText={isCouple ? "Enter the age when the first person in your household plans to retire" : "The age when you plan to stop working"}
            required
            error={errors.retirement_age}
          >
            <Input
              type="number"
              min={50}
              max={85}
              value={data.retirement_age || ''}
              onChange={(e) => onChange({ retirement_age: parseInt(e.target.value) || undefined })}
              placeholder="e.g., 65"
              className="max-w-[150px]"
              data-testid="input-retirement-age"
            />
          </FormFieldWrapper>
          
          {isCouple && (
            <RadioGroupField
              label="Will you retire at the same time?"
              value={data.retire_same_time || ''}
              onChange={(val) => onChange({ retire_same_time: val as any })}
              options={[
                { value: 'same', label: 'Yes, at the same time' },
                { value: 'spouse_longer', label: 'My spouse/partner will work longer' },
                { value: 'spouse_earlier', label: 'My spouse/partner will retire earlier' },
                { value: 'not_sure', label: 'Not sure yet' }
              ]}
              error={errors.retire_same_time}
              testId="radio-retire-same-time"
            />
          )}
          
          <SliderField
            label="How flexible is your retirement date?"
            helperText="Could you delay retirement if needed for financial reasons?"
            value={data.flexibility_score ?? 5}
            onChange={(val) => onChange({ flexibility_score: val })}
            leftLabel="Not flexible"
            rightLabel="Very flexible"
            required
            error={errors.flexibility_score}
            testId="slider-flexibility"
          />
        </CardContent>
      </Card>
    </div>
  );
}
