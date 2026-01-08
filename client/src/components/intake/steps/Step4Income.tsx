import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormFieldWrapper } from "../FormField";
import { RadioGroupField } from "../RadioGroupField";
import { Checkbox } from "@/components/ui/checkbox";
import type { IntakeData } from "@shared/schema";

interface Step4Props {
  data: Partial<IntakeData>;
  onChange: (updates: Partial<IntakeData>) => void;
  errors?: Record<string, string>;
}

export function Step4Income({ data, onChange, errors = {} }: Step4Props) {
  const hasPension = data.has_pension === true;
  const hasRentalIncome = data.has_rental_business_income === true;
  const ssNotSure = data.ss_not_sure === true;
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Guaranteed Income</h2>
        <p className="text-muted-foreground mt-2">
          Reliable income sources reduce how much you need to withdraw from savings.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Social Security</CardTitle>
          <CardDescription>
            Your expected Social Security benefits based on your earnings history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={data.ss_not_sure || false}
              onCheckedChange={(checked) => onChange({ 
                ss_not_sure: !!checked,
                ss_claim_age: checked ? null : data.ss_claim_age,
                ss_monthly_household: checked ? null : data.ss_monthly_household
              })}
              id="ss-not-sure"
              data-testid="checkbox-ss-not-sure"
            />
            <label htmlFor="ss-not-sure" className="text-sm text-muted-foreground cursor-pointer">
              I'm not sure about my Social Security benefits yet
            </label>
          </div>
          
          {!ssNotSure && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldWrapper
                label="Planned claim age"
                helperText="When you plan to start receiving benefits (62-70)"
                error={errors.ss_claim_age}
              >
                <Input
                  type="number"
                  min={62}
                  max={70}
                  value={data.ss_claim_age || ''}
                  onChange={(e) => onChange({ ss_claim_age: parseInt(e.target.value) || null })}
                  placeholder="e.g., 67"
                  className="max-w-[120px]"
                  data-testid="input-ss-claim-age"
                />
              </FormFieldWrapper>
              
              <FormFieldWrapper
                label="Monthly household benefit"
                helperText="Combined benefit for you and spouse if applicable"
                error={errors.ss_monthly_household}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min={0}
                    value={data.ss_monthly_household || ''}
                    onChange={(e) => onChange({ ss_monthly_household: parseInt(e.target.value) || null })}
                    placeholder="e.g., 4000"
                    className="max-w-[150px]"
                    data-testid="input-ss-monthly"
                  />
                </div>
              </FormFieldWrapper>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pension or Annuity</CardTitle>
          <CardDescription>
            Do you have a defined benefit pension or annuity?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <FormFieldWrapper
              label="Do you have a pension or annuity?"
            >
              <div />
            </FormFieldWrapper>
            <Switch
              checked={data.has_pension || false}
              onCheckedChange={(checked) => onChange({ 
                has_pension: checked,
                pension_monthly: checked ? data.pension_monthly : undefined,
                pension_start_age: checked ? data.pension_start_age : undefined,
                pension_survivor: checked ? data.pension_survivor : undefined
              })}
              data-testid="switch-has-pension"
            />
          </div>
          
          {hasPension && (
            <div className="space-y-6 pl-4 border-l-2 border-primary/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormFieldWrapper
                  label="Monthly pension amount"
                  error={errors.pension_monthly}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      value={data.pension_monthly || ''}
                      onChange={(e) => onChange({ pension_monthly: parseInt(e.target.value) || undefined })}
                      placeholder="e.g., 2500"
                      className="max-w-[150px]"
                      data-testid="input-pension-monthly"
                    />
                  </div>
                </FormFieldWrapper>
                
                <FormFieldWrapper
                  label="Start age"
                  error={errors.pension_start_age}
                >
                  <Input
                    type="number"
                    min={50}
                    max={85}
                    value={data.pension_start_age || ''}
                    onChange={(e) => onChange({ pension_start_age: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 62"
                    className="max-w-[120px]"
                    data-testid="input-pension-start"
                  />
                </FormFieldWrapper>
              </div>
              
              {data.planning_for === 'couple' && (
                <RadioGroupField
                  label="Survivor benefit"
                  helperText="What happens to the pension if you pass away first?"
                  value={data.pension_survivor || ''}
                  onChange={(val) => onChange({ pension_survivor: val as any })}
                  options={[
                    { value: 'full', label: 'Full benefit continues', description: 'Spouse receives 100%' },
                    { value: 'partial', label: 'Reduced benefit', description: 'Spouse receives 50-75%' },
                    { value: 'none', label: 'No survivor benefit', description: 'Benefit ends' },
                    { value: 'not_sure', label: "I'm not sure" }
                  ]}
                  error={errors.pension_survivor}
                  testId="radio-pension-survivor"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rental or Business Income</CardTitle>
          <CardDescription>
            Other sources of reliable income in retirement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <FormFieldWrapper
              label="Do you have rental property or business income?"
            >
              <div />
            </FormFieldWrapper>
            <Switch
              checked={data.has_rental_business_income || false}
              onCheckedChange={(checked) => onChange({ 
                has_rental_business_income: checked,
                rental_annual_amount: checked ? data.rental_annual_amount : undefined,
                rental_start_age: checked ? data.rental_start_age : undefined,
                rental_end_age: checked ? data.rental_end_age : undefined,
                rental_reliability: checked ? data.rental_reliability : undefined
              })}
              data-testid="switch-has-rental"
            />
          </div>
          
          {hasRentalIncome && (
            <div className="space-y-6 pl-4 border-l-2 border-primary/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormFieldWrapper
                  label="Annual net income"
                  helperText="After expenses"
                  error={errors.rental_annual_amount}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      value={data.rental_annual_amount || ''}
                      onChange={(e) => onChange({ rental_annual_amount: parseInt(e.target.value) || undefined })}
                      placeholder="e.g., 24000"
                      className="max-w-[150px]"
                      data-testid="input-rental-amount"
                    />
                    <span className="text-muted-foreground">/ year</span>
                  </div>
                </FormFieldWrapper>
                
                <FormFieldWrapper
                  label="Starting age"
                  error={errors.rental_start_age}
                >
                  <Input
                    type="number"
                    min={50}
                    max={85}
                    value={data.rental_start_age || ''}
                    onChange={(e) => onChange({ rental_start_age: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 65"
                    className="max-w-[120px]"
                    data-testid="input-rental-start"
                  />
                </FormFieldWrapper>
              </div>
              
              <RadioGroupField
                label="How reliable is this income?"
                value={data.rental_reliability || ''}
                onChange={(val) => onChange({ rental_reliability: val as any })}
                options={[
                  { value: 'stable', label: 'Stable', description: 'Long-term tenants, established business' },
                  { value: 'variable', label: 'Variable', description: 'Some fluctuation year to year' },
                  { value: 'uncertain', label: 'Uncertain', description: 'New or unpredictable income' }
                ]}
                error={errors.rental_reliability}
                testId="radio-rental-reliability"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
