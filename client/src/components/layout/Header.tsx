import { Progress } from "@/components/ui/progress";

interface HeaderProps {
  currentStep?: number;
  totalSteps?: number;
  showProgress?: boolean;
}

export function Header({ currentStep, totalSteps = 7, showProgress = false }: HeaderProps) {
  const progressValue = currentStep ? (currentStep / totalSteps) * 100 : 0;
  
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6 max-w-6xl mx-auto gap-4">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-semibold tracking-tight" data-testid="text-logo">
            Ready to Retire?
          </span>
        </div>
        
        {showProgress && currentStep && (
          <div className="flex-1 max-w-md hidden md:block">
            <div className="flex items-center gap-3">
              <Progress value={progressValue} className="h-2" data-testid="progress-bar" />
              <span className="text-sm text-muted-foreground whitespace-nowrap" data-testid="text-progress">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
          </div>
        )}
        
        {showProgress && currentStep && (
          <div className="md:hidden">
            <span className="text-sm font-medium" data-testid="text-progress-mobile">
              {currentStep}/{totalSteps}
            </span>
          </div>
        )}
        
        <div className="w-24" />
      </div>
    </header>
  );
}
