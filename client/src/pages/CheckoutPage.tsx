import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Check, Shield, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const PRICE = 97;
const PRODUCT_NAME = "Retirement Readiness Assessment";

const features = [
  "Comprehensive intake questionnaire designed by a CFP",
  "Monte Carlo simulation with 3,000+ scenarios",
  "Personalized Retirement Readiness Brief",
  "Top 3 risks and levers specific to your situation",
  "Permanent access to your results via secure link"
];

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  
  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/checkout/create-session', {});
      return await response.json() as { assessmentId: string };
    },
    onSuccess: (data) => {
      setLocation(`/intake/${data.assessmentId}`);
    }
  });
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-md mx-auto px-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-semibold tracking-tight">
              Can I Retire Yet?
            </h1>
            <p className="text-muted-foreground mt-3 text-lg">
              A CFP-designed retirement readiness assessment
            </p>
          </div>
          
          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{PRODUCT_NAME}</CardTitle>
              <CardDescription>
                Get clarity on your retirement timeline
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center py-4">
                <span className="text-5xl font-semibold tracking-tight">${PRICE}</span>
                <span className="text-muted-foreground ml-2">one-time</span>
              </div>
              
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                size="lg"
                className="w-full"
                onClick={() => createCheckoutMutation.mutate()}
                disabled={createCheckoutMutation.isPending}
                data-testid="button-checkout"
              >
                {createCheckoutMutation.isPending ? "Starting..." : "Start Assessment"}
              </Button>
              
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>Data encrypted</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-xs text-center text-muted-foreground mt-6 max-w-sm mx-auto leading-relaxed">
            This assessment is for educational purposes only and does not provide personalized financial advice.
            Using this tool does not create an advisory relationship.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
