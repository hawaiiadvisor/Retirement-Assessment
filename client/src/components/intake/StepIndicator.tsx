import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Step } from "./intakeSteps";

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="hidden lg:block w-64 shrink-0">
      <nav aria-label="Progress" className="sticky top-24">
        <ol className="space-y-1">
          {steps.map((step) => {
            const isComplete = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            const isClickable = (isComplete || isCurrent) && !!onStepClick;

            return (
              <li key={step.number}>
                <div
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onClick={() => isClickable && onStepClick(step.number)}
                  onKeyDown={(e) => {
                    if (isClickable && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onStepClick(step.number);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isCurrent && "bg-primary/10",
                    isComplete && "hover:bg-muted cursor-pointer",
                    !isCurrent && !isComplete && "opacity-50 cursor-default"
                  )}
                  data-testid={`step-indicator-${step.number}`}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      isComplete && "bg-primary text-primary-foreground",
                      isCurrent && "bg-primary text-primary-foreground",
                      !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isCurrent ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
