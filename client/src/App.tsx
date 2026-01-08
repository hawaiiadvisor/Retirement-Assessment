import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import CheckoutPage from "@/pages/CheckoutPage";
import CheckoutSuccessPage from "@/pages/CheckoutSuccessPage";
import IntakePage from "@/pages/IntakePage";
import ResultsPage from "@/pages/ResultsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CheckoutPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/intake/:id" component={IntakePage} />
      <Route path="/results/:id" component={ResultsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
