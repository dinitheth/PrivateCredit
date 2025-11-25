import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, CreditCard, CheckCircle, ArrowRight, Lock, Eye, Server } from "lucide-react";

interface OnboardingGuideProps {
  userRole: string;
  onComplete: () => void;
}

export function OnboardingGuide({ userRole, onComplete }: OnboardingGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
  };

  const borrowerSteps = [
    {
      icon: Shield,
      title: "Welcome to Private Credit dApp",
      description: "This application uses Fully Homomorphic Encryption (FHE) to keep your financial data completely private while still allowing lenders to assess your creditworthiness.",
      highlights: ["Your data is encrypted in your browser", "Credit scores computed on encrypted data", "Only you can see your actual score"],
    },
    {
      icon: FileText,
      title: "Submit Encrypted Financial Data",
      description: "Navigate to 'Submit Data' to enter your salary, debts, and expenses. All data is encrypted locally before being sent to the blockchain.",
      highlights: ["Enter your monthly income", "List your outstanding debts", "Add monthly expenses"],
    },
    {
      icon: Eye,
      title: "View Your Credit Score",
      description: "After submitting data, the Zama coprocessor computes your credit score on encrypted data. Only you can decrypt and view your actual score.",
      highlights: ["Scores range from 300-850", "Risk tier visible to lenders (Low/Medium/High)", "Decrypt to see your exact score"],
    },
    {
      icon: CreditCard,
      title: "Apply for Loans",
      description: "Browse available loan options and apply based on your credit profile. Lenders see only your encrypted risk tier, never your raw data.",
      highlights: ["Request loan amounts", "Interest rates based on risk tier", "Track loan status and repayments"],
    },
  ];

  const lenderSteps = [
    {
      icon: Shield,
      title: "Welcome Lender",
      description: "As a lender, you can review loan applications and assess borrower risk without ever seeing their raw financial data.",
      highlights: ["Privacy-preserving risk assessment", "Encrypted risk tier visibility", "Decentralized lending on Base L2"],
    },
    {
      icon: FileText,
      title: "Review Loan Requests",
      description: "View pending loan applications. Each request shows the encrypted risk tier computed by the FHE coprocessor.",
      highlights: ["See borrower's risk tier", "Review requested amounts", "Assess lending opportunities"],
    },
    {
      icon: CheckCircle,
      title: "Approve or Deny Loans",
      description: "Make informed lending decisions based on risk tiers. Approve loans to fund borrowers or deny high-risk applications.",
      highlights: ["One-click approval/denial", "Set interest rates", "Track your lending portfolio"],
    },
  ];

  const adminSteps = [
    {
      icon: Shield,
      title: "Welcome Admin",
      description: "As an administrator, you have full visibility into system health, user management, and audit logs.",
      highlights: ["Monitor coprocessor status", "View all system activity", "Manage user permissions"],
    },
    {
      icon: Server,
      title: "Monitor System Health",
      description: "Track the status of the Zama FHEVM coprocessor and Base L2 connectivity. Ensure all services are operational.",
      highlights: ["Coprocessor health status", "Network connectivity", "System performance metrics"],
    },
    {
      icon: Lock,
      title: "Security & Audit Logs",
      description: "Review comprehensive audit logs of all system activities. Monitor for suspicious behavior and ensure compliance.",
      highlights: ["Complete activity history", "User action tracking", "Security event monitoring"],
    },
  ];

  const steps = userRole === "lender" ? lenderSteps : userRole === "admin" ? adminSteps : borrowerSteps;
  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <currentStepData.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Badge variant="outline" className="mb-1">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base pt-2">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {currentStepData.highlights.map((highlight, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
              <span className="text-foreground">{highlight}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1 py-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" onClick={handleSkip} data-testid="button-skip-onboarding">
            Skip
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                data-testid="button-prev-step"
              >
                Back
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)} data-testid="button-next-step">
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} data-testid="button-complete-onboarding">
                Get Started
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
