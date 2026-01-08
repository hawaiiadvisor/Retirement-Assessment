import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Loader2 } from "lucide-react";

export default function CheckoutSuccessPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function verifyPayment() {
      const params = new URLSearchParams(search);
      const sessionId = params.get('session_id');
      const assessmentId = params.get('assessment_id');
      
      if (!sessionId || !assessmentId) {
        setError('Missing payment information');
        setStatus('error');
        return;
      }
      
      try {
        const response = await fetch(`/api/checkout/verify?session_id=${sessionId}&assessment_id=${assessmentId}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setStatus('success');
          // Redirect to intake after short delay
          setTimeout(() => {
            setLocation(`/intake/${assessmentId}`);
          }, 2000);
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
  }, [search, setLocation]);
  
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
                    Thank you for your purchase. Starting your assessment...
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
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Redirecting you to the assessment...
                </p>
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
