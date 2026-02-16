import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StepIndicator, INTAKE_STEPS } from "@/components/intake/StepIndicator";
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
  const { intakeData, setIntakeData, setResults, currentStep, setCurrentStep } = useAssessment();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
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
        if (intakeData.planning_for === 'couple' && !intakeData.spouse_age) {
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsProcessing(true);
      try {
        const validatedIntake = intakeSchema.parse(intakeData);
        const simulationResults = runMonteCarloSimulation(validatedIntake);
        setResults(simulationResults);
        setLocation("/results");
      } catch (error: any) {
        toast({
          title: "Submission failed",
          description: error.message || "Please check your answers and try again.",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <StepIndicator steps={INTAKE_STEPS} currentStep={currentStep} />
            
            <div className="flex-1 max-w-2xl">
              {renderStep()}
              
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
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : currentStep === TOTAL_STEPS ? (
                    "Get My Results"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
