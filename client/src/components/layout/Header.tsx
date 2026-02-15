import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { LogOut } from "lucide-react";

interface HeaderProps {
  currentStep?: number;
  totalSteps?: number;
  showProgress?: boolean;
}

export function Header({ currentStep, totalSteps = 7, showProgress = false }: HeaderProps) {
  const progressValue = currentStep ? (currentStep / totalSteps) * 100 : 0;
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };
  
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6 max-w-6xl mx-auto gap-4">
        <div className="flex items-center gap-2">
          <a href="/" className="font-serif text-lg font-semibold tracking-tight" data-testid="text-logo">
            Ready to Retire?
          </a>
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
        
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block" data-testid="text-user-email">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/login")}
              data-testid="button-header-login"
            >
              Log in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
