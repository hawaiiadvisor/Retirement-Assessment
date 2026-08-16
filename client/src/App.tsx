import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AssessmentProvider } from "@/hooks/use-assessment";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import IntakePage from "@/pages/IntakePage";
import ResultsPage from "@/pages/ResultsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/assessment" component={IntakePage} />
      <Route path="/results" component={ResultsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <AssessmentProvider>
        <Toaster />
        <Router />
      </AssessmentProvider>
    </TooltipProvider>
  );
}

export default App;
