import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Loader2, Copy, Check, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutSuccessPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    async function verifyPayment() {
      const params = new URLSearchParams(search);
      const sessionId = params.get('session_id');
      const aId = params.get('assessment_id');
      
      if (!sessionId || !aId) {
        setError('Missing payment information');
        setStatus('error');
        return;
      }
      
      setAssessmentId(aId);
      
      try {
        const response = await fetch(`/api/checkout/verify?session_id=${sessionId}&assessment_id=${aId}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setStatus('success');
          if (data.magicLink) {
            setMagicLink(data.magicLink);
          }
        } else {
          setError(data.message || 'Payment verification failed');
          setStatus('error');
        }
      } catch (err) {
        setError('Failed to verify payment');
        setStatus('error');
      }
    }
    
    verifyPayment();
  }, [search]);
  
  const handleCopyLink = async () => {
    if (magicLink) {
      await navigator.clipboard.writeText(magicLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Save this link to return to your assessment anytime.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleStartAssessment = () => {
    if (assessmentId) {
      setLocation(`/intake/${assessmentId}`);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <Card>
            <CardHeader className="text-center">
              {status === 'verifying' && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                  <CardTitle className="mt-4">Verifying Payment</CardTitle>
                  <CardDescription>
                    Please wait while we confirm your payment...
                  </CardDescription>
                </>
              )}
              
              {status === 'success' && (
                <>
                  <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                  <CardTitle className="mt-4">Payment Successful!</CardTitle>
                  <CardDescription>
                    Thank you for your purchase. Save the link below to return to your assessment anytime.
                  </CardDescription>
                </>
              )}
              
              {status === 'error' && (
                <>
                  <CardTitle className="text-destructive">Payment Error</CardTitle>
                  <CardDescription>
                    {error || 'Something went wrong with your payment.'}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            
            {status === 'success' && (
              <CardContent className="space-y-4">
                {magicLink && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">Your access link:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background p-2 rounded border overflow-x-auto" data-testid="text-magic-link">
                        {magicLink}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyLink}
                        data-testid="button-copy-link"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Bookmark or save this link to return to your assessment anytime. It expires in 7 days.
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={handleStartAssessment}
                  className="w-full"
                  data-testid="button-start-assessment"
                >
                  Start My Assessment
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            )}
            
            {status === 'error' && (
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Please contact support if this issue persists.
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
