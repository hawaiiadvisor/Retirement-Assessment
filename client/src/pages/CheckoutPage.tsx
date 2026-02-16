import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Check, Shield, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import advisorImage from "@assets/Financial_advisor_1771140630199.jpg";

const PRODUCT_NAME = "Retirement Readiness Assessment";

const features = [
  "Comprehensive intake questionnaire designed by a CFP\u00AE",
  "Monte Carlo simulation with 3,000+ scenarios",
  "Personalized Retirement Readiness Brief",
  "Top 3 risks and levers specific to your situation",
  "Instant results - no account required"
];

export default function CheckoutPage() {
  const [, setLocation] = useLocation();

  const handleStart = () => {
    setLocation("/intake");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-md mx-auto px-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-semibold tracking-tight">
              Ready to Retire?
            </h1>
            <p className="text-muted-foreground mt-3 text-lg">
              A CFP\u00AE-designed retirement readiness assessment
            </p>
            <img
              src={advisorImage}
              alt="Financial advisor consulting with client"
              className="mt-6 rounded-md w-full object-cover max-h-56"
              data-testid="img-advisor"
            />
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
                <span className="text-3xl font-semibold tracking-tight text-primary">Free</span>
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
                onClick={handleStart}
                data-testid="button-start-assessment"
              >
                Start Assessment
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>No account or payment required</span>
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
