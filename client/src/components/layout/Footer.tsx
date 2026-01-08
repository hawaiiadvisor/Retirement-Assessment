export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-8 mt-auto">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            This tool is for educational purposes only and does not provide personalized financial advice. 
            Using this tool does not create an advisory or fiduciary relationship. 
            Monte Carlo results are illustrative and not guarantees of future performance. 
            Results depend on user inputs and assumptions that may differ materially from actual outcomes.
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Ready to Retire? All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
