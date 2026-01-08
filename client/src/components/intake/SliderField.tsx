import { Slider } from "@/components/ui/slider";
import { FormFieldWrapper } from "./FormField";
import { cn } from "@/lib/utils";

interface SliderFieldProps {
  label: string;
  helperText?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  leftLabel?: string;
  rightLabel?: string;
  showValue?: boolean;
  className?: string;
  required?: boolean;
  error?: string;
  testId?: string;
}

export function SliderField({
  label,
  helperText,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  leftLabel,
  rightLabel,
  showValue = true,
  className,
  required,
  error,
  testId
}: SliderFieldProps) {
  return (
    <FormFieldWrapper 
      label={label} 
      helperText={helperText} 
      required={required}
      error={error}
      className={className}
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-4">
          <Slider
            value={[value]}
            onValueChange={(vals) => onChange(vals[0])}
            min={min}
            max={max}
            step={step}
            className="flex-1"
            data-testid={testId || `slider-${label.toLowerCase().replace(/\s+/g, '-')}`}
          />
          {showValue && (
            <div className="w-12 h-10 flex items-center justify-center rounded-lg bg-muted text-sm font-medium">
              {value}
            </div>
          )}
        </div>
        {(leftLabel || rightLabel) && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
        )}
      </div>
    </FormFieldWrapper>
  );
}
