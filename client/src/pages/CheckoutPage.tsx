import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Check, Shield, ArrowRight, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import advisorImage from "@assets/Financial_advisor_1771140630199.jpg";

const PRODUCT_NAME = "Retirement Readiness Assessment";

const features = [
  "Comprehensive intake questionnaire designed by a CFP®",
  "Monte Carlo simulation with 3,000+ scenarios",
  "Personalized Retirement Readiness Brief",
  "Top 3 risks and levers specific to your situation",
  "Permanent access to your results via secure link"
];

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const createAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/assessments', {});
      return await response.json() as { assessmentId: string };
    },
    onSuccess: (data) => {
      if (data.assessmentId) {
        setLocation(`/intake/${data.assessmentId}`);
      }
    },
    onError: (error: Error) => {
      console.error("Assessment creation failed:", error.message);
      if (error.message.includes("401")) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setLocation("/login");
      } else {
        toast({
          title: "Something went wrong",
          description: "Could not start the assessment. Please try again.",
          variant: "destructive",
        });
      }
    },
    retry: 1,
  });

  const handleStart = async () => {
    if (!user) {
      setLocation("/register");
      return;
    }
    createAssessmentMutation.mutate();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              A CFP®-designed retirement readiness assessment
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
                disabled={createAssessmentMutation.isPending}
                data-testid="button-start-assessment"
              >
                {createAssessmentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Assessment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>No payment required</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground mt-6 max-w-sm mx-auto leading-relaxed">
            This assessment is for educational purposes only and does not provide personalized financial advice.
            Using this tool does not create an advisory relationship.
          </p>

          {!user && (
            <div className="text-center mt-4">
              <a href="/login" className="text-sm text-primary hover:underline" data-testid="link-login">
                Already have an account? Log in
              </a>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
