import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Lightbulb,
  Info,
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";
import type { Assessment, ResultsData } from "@shared/schema";
import { cn } from "@/lib/utils";

function VerdictDisplay({ verdict, probability }: { verdict: string; probability: number }) {
  const config = {
    on_track: {
      label: "On Track",
      description: "Your retirement plan appears well-positioned based on current inputs.",
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800"
    },
    borderline: {
      label: "Borderline",
      description: "Your plan has potential but may need adjustments to improve confidence.",
      icon: AlertTriangle,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      borderColor: "border-yellow-200 dark:border-yellow-800"
    },
    at_risk: {
      label: "At Risk",
      description: "Your current plan may face significant challenges. Consider reviewing key factors.",
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-800"
    }
  };
  
  const current = config[verdict as keyof typeof config] || config.borderline;
  const Icon = current.icon;
  
  return (
    <Card className={cn("border-2", current.borderColor, current.bgColor)}>
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center text-center gap-4">
          <Icon className={cn("h-16 w-16", current.color)} />
          <div>
            <h2 className={cn("text-3xl font-semibold", current.color)} data-testid="text-verdict">
              {current.label}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              {current.description}
            </p>
          </div>
          
          <div className="w-full max-w-sm mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Success Probability</span>
              <span className="font-medium" data-testid="text-probability">{probability.toFixed(0)}%</span>
            </div>
            <Progress value={probability} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>At Risk</span>
              <span>Borderline</span>
              <span>On Track</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskCard({ risk, index }: { risk: { title: string; description: string; severity: string }; index: number }) {
  const severityColors = {
    high: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
  };
  
  return (
    <Card className="hover-elevate" data-testid={`card-risk-${index}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive text-sm font-medium">
              {index + 1}
            </div>
            <CardTitle className="text-base">{risk.title}</CardTitle>
          </div>
          <Badge variant="secondary" className={cn("text-xs shrink-0", severityColors[risk.severity as keyof typeof severityColors])}>
            {risk.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{risk.description}</p>
      </CardContent>
    </Card>
  );
}

function LeverCard({ lever, index }: { lever: { title: string; description: string; impact: string }; index: number }) {
  const impactColors = {
    high: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    low: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300"
  };
  
  return (
    <Card className="hover-elevate" data-testid={`card-lever-${index}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
              {index + 1}
            </div>
            <CardTitle className="text-base">{lever.title}</CardTitle>
          </div>
          <Badge variant="secondary" className={cn("text-xs shrink-0", impactColors[lever.impact as keyof typeof impactColors])}>
            {lever.impact} impact
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{lever.description}</p>
      </CardContent>
    </Card>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: assessment, isLoading, error } = useQuery<Assessment>({
    queryKey: ['/api/assessments', id],
    enabled: !!id
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error || !assessment?.resultsJson) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-6">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold">Results Not Available</h2>
              <p className="text-muted-foreground mt-2">
                We couldn't find your results. This may be because the assessment hasn't been completed yet.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  const results = assessment.resultsJson as ResultsData;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight">
              Your Retirement Readiness Brief
            </h1>
            <p className="text-muted-foreground mt-3">
              Based on the information you provided, here's our assessment.
            </p>
          </div>
          
          <VerdictDisplay verdict={results.verdict} probability={results.success_probability} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <h3 className="text-lg font-semibold">Top Risks</h3>
              </div>
              {results.top_3_risks.map((risk, index) => (
                <RiskCard key={index} risk={risk} index={index} />
              ))}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Top Levers</h3>
              </div>
              {results.top_3_levers.map((lever, index) => (
                <LeverCard key={index} lever={lever} index={index} />
              ))}
            </div>
          </div>
          
          {results.special_callouts && results.special_callouts.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Special Considerations</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.special_callouts.map((callout, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-sm">{callout.type}: </span>
                      <span className="text-sm text-muted-foreground">{callout.message}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {results.what_matters_less && results.what_matters_less.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>What Matters Less</CardTitle>
                <CardDescription>
                  These factors are less critical to your specific situation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.what_matters_less.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-muted-foreground/50">-</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="simulation">
              <AccordionTrigger>Simulation Details</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Scenarios Run</p>
                    <p className="text-2xl font-semibold">{results.simulation_details.trials.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Retirement Duration</p>
                    <p className="text-2xl font-semibold">{results.simulation_details.retirement_duration_years} years</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Year 1 Spending</p>
                    <p className="text-2xl font-semibold">${(results.simulation_details.annual_spending_year1 / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Guaranteed Income</p>
                    <p className="text-2xl font-semibold">${(results.simulation_details.guaranteed_income_at_start / 1000).toFixed(0)}k/yr</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Median Ending Portfolio</p>
                    <p className="text-2xl font-semibold">${(results.simulation_details.median_ending_portfolio / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Worst Case</p>
                    <p className="text-2xl font-semibold">${(results.simulation_details.worst_case_portfolio / 1000).toFixed(0)}k</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="assumptions">
              <AccordionTrigger>Assumptions & Limitations</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 pt-2">
                  {results.assumptions_and_limits.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-muted-foreground">-</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Want to explore further?</CardTitle>
              <CardDescription>
                If you'd like help reviewing this in more depth with a CFP, you can schedule a consultation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <a 
                  href="https://hawaiiadvisor.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-testid="link-cfp-consultation"
                >
                  Visit hawaiiadvisor.com
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Using this tool does not create an advisory or fiduciary relationship. 
                Any consultation would be a separate engagement.
              </p>
            </CardContent>
          </Card>
          
          <div className="bg-muted/30 rounded-lg p-6 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              This assessment is for educational purposes only and does not constitute personalized financial advice. 
              Monte Carlo results are illustrative and not guarantees of future performance. 
              Results depend on the inputs you provided and assumptions that may differ materially from actual outcomes. 
              Consult with a qualified financial professional before making retirement decisions.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
