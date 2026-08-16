import { useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, BarChart3, FileText, Clock } from "lucide-react";
import hawaiiImg from "@assets/hawaii-3603379_1920_1775627205276.jpg";
import danielImg from "@assets/IMG_1794_1775632438451.jpg";

const WHO_ITS_FOR = [
  "You're within 5 years of your target retirement date",
  "You have savings, a pension, or Social Security to work with",
  "You want an honest, numbers-based read on where you stand",
  "You're wondering if your current plan will actually hold up",
];

const HOW_IT_WORKS = [
  {
    icon: Clock,
    title: "7 short sections",
    description: "Answer questions about your household, spending, income, and portfolio — takes about 5 minutes.",
  },
  {
    icon: BarChart3,
    title: "Monte Carlo analysis",
    description: "We run thousands of market scenarios to stress-test your plan across good years and bad.",
  },
  {
    icon: FileText,
    title: "Retirement Readiness Brief",
    description: "Top 3 Risks and levers specific to your situation.",
  },
];

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="relative py-20 px-6 text-center overflow-hidden bg-background">
          <img
            src={hawaiiImg}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none"
          />
          <div className="relative max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
              Free for a limited time · No login required
            </div>
            <h1
              className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-tight"
              data-testid="text-hero-headline"
            >
              Are you actually ready to retire?
            </h1>
            <p
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
              data-testid="text-hero-subtitle"
            >
              Built by a CFP® specializing in retirement income planning, this assessment helps you determine whether you're on track to retire within the next five years.
            </p>
            <div className="pt-2">
              <Button
                size="lg"
                onClick={() => setLocation("/assessment")}
                className="text-base px-8 py-6 h-auto"
                data-testid="button-start-assessment-hero"
              >
                Start Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-muted/30 border-y">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex flex-col items-center text-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight" data-testid="text-who-headline">
                  Who this is for
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  This tool helps you determine whether you're on track to retire within the next five years.
                </p>
                <ul className="space-y-3">
                  {WHO_ITS_FOR.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/assessment")}
                  data-testid="button-start-assessment-who"
                >
                  Take the Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div
                  className="relative w-full rounded-xl overflow-hidden border bg-muted/30"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/vmCfvs6lv_U"
                    title="Retirement Readiness Assessment Overview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    data-testid="video-overview"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Watch: How the Retirement Readiness Assessment works
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-muted/30 border-t">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="rounded-xl overflow-hidden">
                <img
                  src={danielImg}
                  alt="Daniel Masuda Lehrman, CFP®"
                  className="w-full h-auto object-cover"
                  data-testid="img-about-daniel"
                />
              </div>
              <div className="space-y-5">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight" data-testid="text-about-headline">
                  About Daniel
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  I'm Daniel Masuda Lehrman, CFP®, a fee-only fiduciary and Founder of <a href="https://www.masudalehrman.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80" data-testid="link-masuda-lehrman">Masuda Lehrman Wealth LLC</a>, serving clients in Honolulu, Hawaii and virtually nationwide. I created this Retirement Readiness Assessment to give you a clear, data-driven starting point for evaluating whether you're on track to retire.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This assessment is built using the same planning philosophy I use with clients: thoughtful assumptions, stress-testing across different market conditions, and a focus on turning uncertainty into a clear "yes, if" retirement strategy.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
