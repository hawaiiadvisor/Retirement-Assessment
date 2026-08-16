import { useLocation } from "wouter";
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
  AlertCircle,
  ChevronLeft,
  Shield,
  DollarSign,
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid, Legend,
  ComposedChart, Line
} from "recharts";
import type { ResultsData } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useAssessment } from "@/hooks/use-assessment";

function formatDollars(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function getWithdrawalRateColor(rate: number): { text: string; bg: string; label: string } {
  if (rate <= 4) {
    return {
      text: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/50",
      label: "Safe"
    };
  } else if (rate <= 5) {
    return {
      text: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-900/50",
      label: "Caution"
    };
  } else {
    return {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/50",
      label: "High Risk"
    };
  }
}

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

function NarrativeSummary({ narrative }: { narrative: string }) {
  return (
    <Card className="bg-muted/20 border-dashed">
      <CardContent className="pt-6 pb-6">
        <p className="text-sm leading-relaxed text-foreground/90" data-testid="text-narrative">
          {narrative}
        </p>
      </CardContent>
    </Card>
  );
}

function KeyMetricsRow({ details }: { details: ResultsData['simulation_details'] }) {
  const preSSColor = getWithdrawalRateColor(details.pre_ss_withdrawal_rate);
  const postSSColor = getWithdrawalRateColor(details.post_ss_withdrawal_rate);
  const floorPct = details.income_floor_coverage_pct ?? 0;
  const floorColor = floorPct >= 60 ? "text-green-600 dark:text-green-400" 
    : floorPct >= 30 ? "text-yellow-600 dark:text-yellow-400" 
    : "text-red-600 dark:text-red-400";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
          <p className="text-2xl font-semibold" data-testid="text-duration">{details.retirement_duration_years} yrs</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Starting Portfolio</p>
          </div>
          <p className="text-2xl font-semibold" data-testid="text-portfolio">{formatDollars(details.starting_portfolio)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Year 1 Withdrawal</p>
          </div>
          <p className={cn("text-2xl font-semibold", preSSColor.text)} data-testid="text-pre-ss-withdrawal-rate">
            {details.pre_ss_withdrawal_rate.toFixed(1)}%
          </p>
          <Badge variant="secondary" className={cn("text-xs mt-1", preSSColor.text)}>{preSSColor.label}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">With SS</p>
          </div>
          <p className={cn("text-2xl font-semibold", postSSColor.text)} data-testid="text-post-ss-withdrawal-rate">
            {details.post_ss_withdrawal_rate.toFixed(1)}%
          </p>
          <Badge variant="secondary" className={cn("text-xs mt-1", postSSColor.text)}>{postSSColor.label}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Income Floor</p>
          </div>
          <p className={cn("text-2xl font-semibold", floorColor)} data-testid="text-income-floor">
            {floorPct}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">of spending covered</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TrajectoryChart({ data }: { data: ResultsData['trajectory_percentiles'] }) {
  if (!data || data.length === 0) return null;

  const bandData = data.map(d => ({
    age: d.age,
    p10: d.p10,
    band_10_25: Math.max(0, d.p25 - d.p10),
    band_25_50: Math.max(0, d.p50 - d.p25),
    band_50_75: Math.max(0, d.p75 - d.p50),
    band_75_90: Math.max(0, d.p90 - d.p75),
    p50: d.p50
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Portfolio Trajectory</CardTitle>
        <CardDescription>
          How your portfolio could perform across {data.length > 0 ? data.length - 1 : 0} years of retirement (percentile bands)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72" data-testid="chart-trajectory">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bandData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="age" 
                tick={{ fontSize: 11 }}
                label={{ value: 'Age', position: 'insideBottom', offset: -5, fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={(v) => formatDollars(v)}
                tick={{ fontSize: 11 }}
                width={55}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (!active || !payload || !label) return null;
                  const d = data.find(p => p.age === label);
                  if (!d) return null;
                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-md text-xs">
                      <p className="font-medium mb-1">Age {label}</p>
                      <p>90th: {formatDollars(d.p90)}</p>
                      <p>75th: {formatDollars(d.p75)}</p>
                      <p className="font-medium">Median: {formatDollars(d.p50)}</p>
                      <p>25th: {formatDollars(d.p25)}</p>
                      <p>10th: {formatDollars(d.p10)}</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="p10" stackId="bands" stroke="none" fill="transparent" name="base" />
              <Area type="monotone" dataKey="band_10_25" stackId="bands" stroke="none" fill="hsl(var(--destructive))" fillOpacity={0.12} name="10th-25th" />
              <Area type="monotone" dataKey="band_25_50" stackId="bands" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.15} name="25th-50th" />
              <Area type="monotone" dataKey="band_50_75" stackId="bands" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.15} name="50th-75th" />
              <Area type="monotone" dataKey="band_75_90" stackId="bands" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.08} name="75th-90th" />
              <Line type="monotone" dataKey="p50" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Median" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(var(--primary))', opacity: 0.7 }} />
            <span>Median path</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(var(--primary))', opacity: 0.2 }} />
            <span>25th–75th pctile</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(var(--destructive))', opacity: 0.2 }} />
            <span>10th–25th pctile</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IncomeSpendingChart({ data }: { data: ResultsData['income_spending_timeline'] }) {
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Income vs. Spending</CardTitle>
        <CardDescription>
          The gap between spending and guaranteed income is what your portfolio must cover each year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72" data-testid="chart-income-spending">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="age" 
                tick={{ fontSize: 11 }}
                label={{ value: 'Age', position: 'insideBottom', offset: -5, fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={(v) => formatDollars(v)}
                tick={{ fontSize: 11 }}
                width={55}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [formatDollars(value), name]}
                labelFormatter={(label) => `Age ${label}`}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="ss_income" stackId="income" fill="#22c55e" fillOpacity={0.4} stroke="#22c55e" name="Social Security" />
              <Area type="monotone" dataKey="pension_income" stackId="income" fill="#3b82f6" fillOpacity={0.4} stroke="#3b82f6" name="Pension" />
              <Area type="monotone" dataKey="other_income" stackId="income" fill="#8b5cf6" fillOpacity={0.4} stroke="#8b5cf6" name="Other Income" />
              <Area type="monotone" dataKey="portfolio_withdrawal" stackId="income" fill="#f97316" fillOpacity={0.3} stroke="#f97316" name="Portfolio Withdrawal" />
              <Line type="monotone" dataKey="total_spending" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Total Spending" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function WhatIfScenarios({ scenarios }: { scenarios: ResultsData['what_if_scenarios'] }) {
  if (!scenarios || scenarios.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">What If…?</CardTitle>
        </div>
        <CardDescription>
          See how specific changes could impact your success probability
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scenario, index) => {
            const diff = scenario.scenario_probability - scenario.original_probability;
            const isPositive = diff > 0;
            const isNeutral = Math.abs(diff) < 1;
            const DiffIcon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;
            const diffColor = isNeutral ? "text-muted-foreground" : isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

            return (
              <div key={index} className="p-4 bg-muted/30 rounded-lg border" data-testid={`card-whatif-${index}`}>
                <p className="text-sm font-medium mb-1">{scenario.label}</p>
                <p className="text-xs text-muted-foreground mb-3">{scenario.description}</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{scenario.scenario_probability.toFixed(0)}%</span>
                  <div className={cn("flex items-center text-sm font-medium mb-0.5", diffColor)}>
                    <DiffIcon className="h-4 w-4" />
                    <span>{isNeutral ? "~0" : (isPositive ? "+" : "") + diff.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function RiskCard({ risk, index }: { risk: ResultsData['top_3_risks'][0]; index: number }) {
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
        {risk.impact_estimate && (
          <p className="text-xs text-destructive/80 mt-2 font-medium" data-testid={`text-risk-impact-${index}`}>
            {risk.impact_estimate}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function LeverCard({ lever, index }: { lever: ResultsData['top_3_levers'][0]; index: number }) {
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

function SpendingPhasesCard({ phases, duration }: { phases?: ResultsData['simulation_details']['spending_phases']; duration: number }) {
  if (!phases) return null;
  const maxSpending = Math.max(phases.early, phases.mid, phases.late);
  const items = [
    { label: "Early (Years 1–10)", value: phases.early, years: Math.min(10, duration) },
    { label: "Mid (Years 11–20)", value: phases.mid, years: Math.min(10, Math.max(0, duration - 10)) },
    { label: "Late (Years 21+)", value: phases.late, years: Math.max(0, duration - 20) }
  ].filter(item => item.years > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Spending by Phase</CardTitle>
        <CardDescription>Average annual spending across different retirement phases</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} data-testid={`spending-phase-${idx}`}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{formatDollars(item.value)}/yr</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all"
                  style={{ width: `${maxSpending > 0 ? (item.value / maxSpending) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { results } = useAssessment();
  
  if (!results) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-6">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold">Results Not Available</h2>
              <p className="text-muted-foreground mt-2">
                Please complete the assessment first to see your results.
              </p>
              <Button
                className="mt-4"
                onClick={() => setLocation("/")}
                data-testid="button-go-to-intake"
              >
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
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

          {results.narrative_summary && (
            <NarrativeSummary narrative={results.narrative_summary} />
          )}
          
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              data-testid="button-modify-responses"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Modify My Responses
            </Button>
          </div>

          <KeyMetricsRow details={results.simulation_details} />

          <TrajectoryChart data={results.trajectory_percentiles} />

          <IncomeSpendingChart data={results.income_spending_timeline} />

          <WhatIfScenarios scenarios={results.what_if_scenarios} />
          
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

          <SpendingPhasesCard phases={results.simulation_details.spending_phases} duration={results.simulation_details.retirement_duration_years} />
          
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
                <div className="space-y-6 pt-2">
                  {results.simulation_details.distribution_data && results.simulation_details.distribution_data.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-4 text-center">Monte Carlo Outcome Distribution</h4>
                      <p className="text-xs text-muted-foreground text-center mb-4">
                        Distribution of ending portfolio values across {results.simulation_details.trials.toLocaleString()} simulated scenarios
                      </p>
                      <div className="h-64" data-testid="chart-monte-carlo">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={results.simulation_details.distribution_data} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                            <XAxis 
                              dataKey="range" 
                              tick={{ fontSize: 11 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                              interval={0}
                            />
                            <YAxis 
                              tickFormatter={(value) => `${value}%`}
                              tick={{ fontSize: 11 }}
                              width={45}
                            />
                            <Tooltip 
                              formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, 'Scenarios']}
                              labelFormatter={(label) => `Ending Portfolio: ${label}`}
                              contentStyle={{ fontSize: 12 }}
                            />
                            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                              {results.simulation_details.distribution_data.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`}
                                  fill={entry.range === "Failed" 
                                    ? "hsl(var(--destructive))" 
                                    : "hsl(var(--primary))"
                                  }
                                  fillOpacity={entry.range === "Failed" ? 1 : 0.7 + (index * 0.04)}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Scenarios Run</p>
                      <p className="text-2xl font-semibold">{results.simulation_details.trials.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Year 1 Spending</p>
                      <p className="text-2xl font-semibold">{formatDollars(results.simulation_details.annual_spending_year1)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Guaranteed Income</p>
                      <p className="text-2xl font-semibold">{formatDollars(results.simulation_details.guaranteed_income_at_start)}/yr</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Median Ending Portfolio</p>
                      <p className="text-2xl font-semibold">{formatDollars(results.simulation_details.median_ending_portfolio)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Worst Case (5th pctile)</p>
                      <p className="text-2xl font-semibold">{formatDollars(results.simulation_details.worst_case_portfolio)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Year 1 Spending</p>
                      <p className="text-2xl font-semibold">{formatDollars(results.simulation_details.annual_spending_year1)}/yr</p>
                    </div>
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
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Learn More</CardTitle>
              <CardDescription>
                Watch this video to better understand your retirement readiness results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full" data-testid="video-youtube-embed">
                <iframe
                  className="w-full h-full rounded-lg"
                  src="https://www.youtube.com/embed/OBRxpqbi3yo"
                  title="Retirement Readiness"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
          
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
