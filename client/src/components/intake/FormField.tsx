import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldWrapperProps {
  label: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  error?: string;
}

export function FormFieldWrapper({ 
  label, 
  helperText, 
  required = false, 
  children, 
  className,
  error 
}: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block">
        <span className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </span>
        {helperText && (
          <span className="block text-sm text-muted-foreground mt-1">
            {helperText}
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}
    </div>
  );
}
