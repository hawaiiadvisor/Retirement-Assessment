import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="hidden lg:block w-64 shrink-0">
      <nav aria-label="Progress" className="sticky top-24">
        <ol className="space-y-1">
          {steps.map((step) => {
            const isComplete = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            
            return (
              <li key={step.number}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isCurrent && "bg-primary/10",
                    !isCurrent && !isComplete && "opacity-50"
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
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}>
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

export const INTAKE_STEPS: Step[] = [
  { number: 1, title: "Household & Timing" },
  { number: 2, title: "Life Expectancy" },
  { number: 3, title: "Spending" },
  { number: 4, title: "Guaranteed Income" },
  { number: 5, title: "Portfolio" },
  { number: 6, title: "Stress & Behavior" },
  { number: 7, title: "Final Review" }
];
