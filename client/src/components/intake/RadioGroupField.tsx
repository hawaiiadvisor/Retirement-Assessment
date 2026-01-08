import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormFieldWrapper } from "./FormField";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupFieldProps {
  label: string;
  helperText?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  required?: boolean;
  className?: string;
  error?: string;
  testId?: string;
}

export function RadioGroupField({
  label,
  helperText,
  value,
  onChange,
  options,
  required,
  className,
  error,
  testId
}: RadioGroupFieldProps) {
  return (
    <FormFieldWrapper 
      label={label} 
      helperText={helperText}
      required={required}
      error={error}
      className={className}
    >
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="space-y-2 pt-2"
        data-testid={testId || `radio-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
              value === option.value 
                ? "border-primary bg-primary/5" 
                : "border-border hover-elevate"
            )}
            data-testid={`radio-option-${option.value}`}
          >
            <RadioGroupItem 
              value={option.value} 
              id={option.value}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground">
                {option.label}
              </span>
              {option.description && (
                <span className="block text-sm text-muted-foreground mt-0.5">
                  {option.description}
                </span>
              )}
            </div>
          </label>
        ))}
      </RadioGroup>
    </FormFieldWrapper>
  );
}
