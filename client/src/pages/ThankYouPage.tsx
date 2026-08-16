import { useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, RefreshCw } from "lucide-react";
import { useAssessment } from "@/hooks/use-assessment";

export default function ThankYouPage() {
  const [, setLocation] = useLocation();
  const { resetAssessment } = useAssessment();

  const handleStartNew = () => {
    resetAssessment();
    setLocation("/assessment");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-12 w-12 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-thank-you-title">
              Thank You!
            </h1>
            <p className="text-xl text-muted-foreground" data-testid="text-thank-you-subtitle">
              Your Retirement Readiness Brief is on its way.
            </p>
          </div>

          <div className="bg-muted/40 rounded-xl p-6 text-left space-y-3 border">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Check your inbox</span> — we've sent your personalized Retirement Readiness Brief to the email address you provided.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Open the PDF attachment</span> — it includes your verdict, top risks, top levers, and key simulation statistics.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Check your spam folder</span> if the email doesn't arrive within a few minutes.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Want to run through the assessment again with different numbers?
            </p>
            <Button
              variant="outline"
              onClick={handleStartNew}
              data-testid="button-restart-assessment"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Start a New Assessment
            </Button>
          </div>

          <div className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto border-t pt-6">
            This assessment is for educational purposes only and does not constitute
            personalized financial advice. Consult with a qualified financial
            professional before making retirement decisions.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
