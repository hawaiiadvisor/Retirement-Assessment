import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StepIndicator } from "@/components/intake/StepIndicator";
import { INTAKE_STEPS } from "@/components/intake/intakeSteps";
import { Step1Household } from "@/components/intake/steps/Step1Household";
import { Step2LifeExpectancy } from "@/components/intake/steps/Step2LifeExpectancy";
import { Step3Spending } from "@/components/intake/steps/Step3Spending";
import { Step4Income } from "@/components/intake/steps/Step4Income";
import { Step5Portfolio } from "@/components/intake/steps/Step5Portfolio";
import { Step6Behavior } from "@/components/intake/steps/Step6Behavior";
import { Step7Review } from "@/components/intake/steps/Step7Review";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { IntakeData } from "@shared/schema";
import { intakeSchema } from "@shared/schema";
import { runMonteCarloSimulation } from "@shared/simulation";
import { useAssessment } from "@/hooks/use-assessment";
import { useToast } from "@/hooks/use-toast";

const TOTAL_STEPS = 7;

export default function IntakePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { intakeData, setIntakeData, currentStep, setCurrentStep, setResults } = useAssessment();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");

  const handleChange = (updates: Partial<IntakeData>) => {
    setIntakeData({ ...intakeData, ...updates });
    setErrors({});
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!intakeData.planning_for) newErrors.planning_for = "Please select who you're planning for";
        if (!intakeData.user_age) newErrors.user_age = "Please enter your age";
        if (intakeData.planning_for === "couple" && !intakeData.spouse_age) {
          newErrors.spouse_age = "Please enter your spouse's age";
        }
        if (!intakeData.retirement_age) newErrors.retirement_age = "Please enter your target retirement age";
        break;
      case 2:
        if (!intakeData.user_life_expectancy) newErrors.user_life_expectancy = "Please select your expected life expectancy";
        if (!intakeData.ltc_expectation) newErrors.ltc_expectation = "Please select your long-term care expectation";
        if (!intakeData.ltc_insurance) newErrors.ltc_insurance = "Please select your insurance coverage";
        break;
      case 3:
        if (!intakeData.monthly_spending_ex_mortgage) newErrors.monthly_spending_ex_mortgage = "Please enter your monthly spending";
        if (!intakeData.pre65_healthcare) newErrors.pre65_healthcare = "Please answer the healthcare question";
        if (!intakeData.early_spending_pattern) newErrors.early_spending_pattern = "Please select your spending pattern";
        break;
      case 4:
        break;
      case 5:
        if (!intakeData.assets_bucket) newErrors.assets_bucket = "Please select your asset range";
        if (!intakeData.allocation_bucket) newErrors.allocation_bucket = "Please select your allocation";
        break;
      case 6:
        if (!intakeData.bridge_years) newErrors.bridge_years = "Please select your cash reserves";
        if (!intakeData.market_stress_response) newErrors.market_stress_response = "Please select how you'd respond";
        break;
      case 7:
        if (!intakeData.acknowledgment_checkbox) {
          newErrors.acknowledgment_checkbox = "You must acknowledge the terms to continue";
        }
        if (!firstName.trim()) {
          newErrors.firstName = "Please enter your first name";
        }
        if (!email.trim()) {
          newErrors.email = "Please enter your email address";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          newErrors.email = "Please enter a valid email address";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep < TOTAL_STEPS) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setIsProcessing(true);
      try {
        const validatedIntake = intakeSchema.parse(intakeData);
        const simulationResults = runMonteCarloSimulation(validatedIntake);

        setResults(simulationResults);

        fetch("/api/log-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            email: email.trim(),
            results: simulationResults,
            intake: {
              userAge: validatedIntake.user_age,
              retirementAge: validatedIntake.retirement_age,
              planningFor: validatedIntake.planning_for,
              assetsBucket: validatedIntake.assets_bucket,
              monthlySpending: validatedIntake.monthly_spending_ex_mortgage,
            },
          }),
        }).catch((err) => {
          console.error("Lead logging failed (non-blocking):", err);
        });

        setLocation("/results");
      } catch (error: any) {
        toast({
          title: "Something went wrong",
          description: error.message || "Please check your answers and try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Household data={intakeData} onChange={handleChange} errors={errors} />;
      case 2:
        return <Step2LifeExpectancy data={intakeData} onChange={handleChange} errors={errors} />;
      case 3:
        return <Step3Spending data={intakeData} onChange={handleChange} errors={errors} />;
      case 4:
        return <Step4Income data={intakeData} onChange={handleChange} errors={errors} />;
      case 5:
        return <Step5Portfolio data={intakeData} onChange={handleChange} errors={errors} />;
      case 6:
        return <Step6Behavior data={intakeData} onChange={handleChange} errors={errors} />;
      case 7:
        return <Step7Review data={intakeData} onChange={handleChange} errors={errors} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header currentStep={currentStep} totalSteps={TOTAL_STEPS} showProgress />

      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-8">
            <StepIndicator
              steps={INTAKE_STEPS}
              currentStep={currentStep}
              onStepClick={(step) => {
                if (step <= currentStep) setCurrentStep(step);
              }}
            />

            <div className="flex-1 max-w-2xl">
              {renderStep()}

              {currentStep === TOTAL_STEPS ? (
                <div className="mt-8 pt-6 border-t space-y-2">
                  <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={isProcessing}
                      className="shrink-0"
                      data-testid="button-back"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>

                    <div className="flex-1 min-w-[120px]">
                      <Input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (errors.firstName) setErrors((prev) => { const n = { ...prev }; delete n.firstName; return n; });
                        }}
                        disabled={isProcessing}
                        data-testid="input-first-name"
                        className={errors.firstName ? "border-destructive" : ""}
                      />
                    </div>

                    <div className="flex-[2] min-w-[160px]">
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => { const n = { ...prev }; delete n.email; return n; });
                        }}
                        disabled={isProcessing}
                        data-testid="input-email"
                        className={errors.email ? "border-destructive" : ""}
                      />
                    </div>

                    <Button
                      onClick={handleNext}
                      disabled={isProcessing}
                      className="shrink-0"
                      data-testid="button-next"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Get My Results"
                      )}
                    </Button>
                  </div>

                  {(errors.firstName || errors.email) && (
                    <div className="flex gap-2 flex-wrap">
                      {errors.firstName && (
                        <p className="text-xs text-destructive flex-1 min-w-[120px]" role="alert">{errors.firstName}</p>
                      )}
                      {errors.email && (
                        <p className="text-xs text-destructive flex-[2] min-w-[160px]" role="alert">{errors.email}</p>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Your personalized Retirement Readiness Brief will be shown instantly on the next page.
                    By submitting, you consent to receive occasional emails from Masuda Lehrman Wealth LLC. Unsubscribe anytime.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-8 pt-6 border-t gap-4">
                  <div className="flex items-center gap-2">
                    {currentStep > 1 && (
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        data-testid="button-back"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={isProcessing}
                    data-testid="button-next"
                  >
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
