import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Mail, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function AccessPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const requestLinkMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/access/request', { email });
      return await response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    }
  });
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 w-full">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Access Your Assessment</CardTitle>
              <CardDescription>
                Enter your email to receive a link to your assessment
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {!submitted ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (email) {
                      requestLinkMutation.mutate(email);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={requestLinkMutation.isPending || !email}
                    data-testid="button-request-link"
                  >
                    {requestLinkMutation.isPending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Access Link
                      </>
                    )}
                  </Button>
                  
                  {requestLinkMutation.isError && (
                    <p className="text-sm text-destructive text-center">
                      Something went wrong. Please try again.
                    </p>
                  )}
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                  <div>
                    <p className="font-medium">Check your email</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      If an assessment exists for this email, we've sent you an access link.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                    }}
                    data-testid="button-try-again"
                  >
                    Try another email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an assessment yet?{" "}
              <Link href="/checkout" className="text-primary hover:underline">
                Start here
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
