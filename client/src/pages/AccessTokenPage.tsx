import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AccessTokenPage() {
  const params = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function verifyToken() {
      if (!params.token) {
        setError('Invalid link');
        setStatus('error');
        return;
      }
      
      try {
        const response = await fetch(`/api/access/${params.token}`);
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          // Redirect based on assessment status
          setTimeout(() => {
            if (data.hasResults) {
              setLocation(`/results/${data.assessmentId}`);
            } else {
              setLocation(`/intake/${data.assessmentId}`);
            }
          }, 1500);
        } else {
          setError(data.message || 'Invalid or expired link');
          setStatus('error');
        }
      } catch (err) {
        setError('Failed to verify link');
        setStatus('error');
      }
    }
    
    verifyToken();
  }, [params.token, setLocation]);
  
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
                  <CardTitle className="mt-4">Verifying Link</CardTitle>
                  <CardDescription>
                    Please wait while we verify your access link...
                  </CardDescription>
                </>
              )}
              
              {status === 'success' && (
                <>
                  <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                  <CardTitle className="mt-4">Access Verified</CardTitle>
                  <CardDescription>
                    Redirecting you to your assessment...
                  </CardDescription>
                </>
              )}
              
              {status === 'error' && (
                <>
                  <XCircle className="h-12 w-12 mx-auto text-destructive" />
                  <CardTitle className="mt-4">Access Denied</CardTitle>
                  <CardDescription>
                    {error || 'This link is invalid or has expired.'}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            
            {status === 'error' && (
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Request a new access link using your email address.
                </p>
                <Link href="/access">
                  <Button data-testid="button-request-new-link">
                    Request New Link
                  </Button>
                </Link>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
