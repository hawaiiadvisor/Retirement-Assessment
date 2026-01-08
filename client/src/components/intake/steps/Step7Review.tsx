import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormFieldWrapper } from "../FormField";
import { SliderField } from "../SliderField";
import { AlertCircle } from "lucide-react";
import type { IntakeData } from "@shared/schema";

interface Step7Props {
  data: Partial<IntakeData>;
  onChange: (updates: Partial<IntakeData>) => void;
  errors?: Record<string, string>;
}

export function Step7Review({ data, onChange, errors = {} }: Step7Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Final Thoughts</h2>
        <p className="text-muted-foreground mt-2">
          A few more questions to help us understand what matters most to you.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Concerns</CardTitle>
          <CardDescription>
            What worries you most about retirement?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormFieldWrapper
            label="What are your biggest retirement worries?"
            helperText="This helps us understand what matters most to you (optional)"
          >
            <Textarea
              value={data.worries_free_text || ''}
              onChange={(e) => onChange({ worries_free_text: e.target.value })}
              placeholder="For example: Running out of money, healthcare costs, leaving inheritance, market volatility..."
              className="min-h-[120px] resize-none"
              data-testid="textarea-worries"
            />
          </FormFieldWrapper>
          
          <FormFieldWrapper
            label="What trade-offs are you willing to make?"
            helperText="Would you prefer to retire earlier with less spending, or work longer to have more? (optional)"
          >
            <Textarea
              value={data.regret_tradeoff || ''}
              onChange={(e) => onChange({ regret_tradeoff: e.target.value })}
              placeholder="For example: I'd rather work two more years than cut spending. Or: I value time over money and would reduce lifestyle to retire sooner..."
              className="min-h-[120px] resize-none"
              data-testid="textarea-regret"
            />
          </FormFieldWrapper>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Readiness Feeling</CardTitle>
        </CardHeader>
        <CardContent>
          <SliderField
            label="How ready do you feel for retirement right now?"
            helperText="Set aside the numbers - how do you feel emotionally about retiring?"
            value={data.readiness_feel ?? 5}
            onChange={(val) => onChange({ readiness_feel: val })}
            leftLabel="Not ready at all"
            rightLabel="Completely ready"
            required
            error={errors.readiness_feel}
            testId="slider-readiness"
          />
        </CardContent>
      </Card>
      
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Important Acknowledgment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              By checking the box below, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>This assessment is for <strong>educational purposes only</strong> and does not constitute personalized financial advice.</li>
              <li>Using this tool does not create an advisory or fiduciary relationship.</li>
              <li>Monte Carlo simulation results are <strong>illustrative</strong> and not guarantees of future performance.</li>
              <li>Your results depend on the inputs you provide and assumptions that may differ materially from actual outcomes.</li>
              <li>Long-term care costs, taxes, market returns, and longevity may differ from projections.</li>
              <li>Your data will be stored long-term to allow you to access your results in the future.</li>
            </ul>
          </div>
          
          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              checked={data.acknowledgment_checkbox || false}
              onCheckedChange={(checked) => onChange({ acknowledgment_checkbox: !!checked })}
              id="acknowledgment"
              className="mt-1"
              data-testid="checkbox-acknowledgment"
            />
            <label 
              htmlFor="acknowledgment" 
              className="text-sm font-medium cursor-pointer leading-relaxed"
            >
              I understand and acknowledge these terms. I am ready to receive my Retirement Readiness Brief.
            </label>
          </div>
          {errors.acknowledgment_checkbox && (
            <p className="text-sm text-destructive" role="alert">
              {errors.acknowledgment_checkbox}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
