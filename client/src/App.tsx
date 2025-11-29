import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { LogOut, HelpCircle } from "lucide-react";
import { useState } from "react";

import ConnectWallet from "@/pages/connect-wallet";
import BorrowerDashboard from "@/pages/borrower-dashboard";
import SubmitData from "@/pages/submit-data";
import Loans from "@/pages/loans";
import LenderDashboard from "@/pages/lender-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

interface AppLayoutProps {
  children: React.ReactNode;
  userRole?: string;
  walletAddress?: string;
  onDisconnect: () => void;
  onShowHelp: () => void;
}

function AppLayout({ children, userRole, walletAddress, onDisconnect, onShowHelp }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full">
      <AppSidebar userRole={userRole} />
      <SidebarInset className="flex flex-col flex-1">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-xs font-mono">
                {userRole === "lender" ? "Lender Mode" : userRole === "admin" ? "Admin Mode" : "Borrower Mode"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : "0x..."}
            </Badge>
            <Button size="icon" variant="ghost" onClick={onShowHelp} data-testid="button-show-help">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <Button size="icon" variant="ghost" onClick={onDisconnect} data-testid="button-disconnect">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}

function Router() {
  const { user, isLoading, disconnectWallet } = useAuth();
  const [, setLocation] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleDisconnect = () => {
    disconnectWallet();
    setLocation("/");
  };

  const handleShowHelp = () => {
    localStorage.removeItem("hasSeenOnboarding");
    setShowOnboarding(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-foreground">Loading...</div>
    </div>;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={ConnectWallet} />
        <Route component={ConnectWallet} />
      </Switch>
    );
  }

  const userRole = user.role;

  // Get the default dashboard based on role
  const DefaultDashboard = () => {
    if (userRole === "lender") return <LenderDashboard />;
    if (userRole === "admin") return <AdminDashboard />;
    return <BorrowerDashboard />;
  };

  return (
    <>
      <OnboardingGuide userRole={userRole} onComplete={() => setShowOnboarding(false)} />
      <Switch>
        {/* Redirect connect-wallet to dashboard for authenticated users */}
        <Route path="/connect-wallet">
          {() => {
            const target = userRole === "lender" ? "/lender" : userRole === "admin" ? "/admin" : "/";
            setLocation(target);
            return null;
          }}
        </Route>

        {/* Default Route - shows dashboard based on role */}
        <Route path="/">
          <AppLayout userRole={userRole} walletAddress={user.walletAddress} onDisconnect={handleDisconnect} onShowHelp={handleShowHelp}>
            <DefaultDashboard />
          </AppLayout>
        </Route>

        {/* Borrower Routes */}
        <Route path="/submit-data">
          <AppLayout userRole={userRole} walletAddress={user.walletAddress} onDisconnect={handleDisconnect} onShowHelp={handleShowHelp}>
            <SubmitData />
          </AppLayout>
        </Route>
        <Route path="/loans">
          <AppLayout userRole={userRole} walletAddress={user.walletAddress} onDisconnect={handleDisconnect} onShowHelp={handleShowHelp}>
            <Loans />
          </AppLayout>
        </Route>

        {/* Lender Routes */}
        <Route path="/lender">
          <AppLayout userRole={userRole} walletAddress={user.walletAddress} onDisconnect={handleDisconnect} onShowHelp={handleShowHelp}>
            <LenderDashboard />
          </AppLayout>
        </Route>

        {/* Admin Routes */}
        <Route path="/admin">
          <AppLayout userRole={userRole} walletAddress={user.walletAddress} onDisconnect={handleDisconnect} onShowHelp={handleShowHelp}>
            <AdminDashboard />
          </AppLayout>
        </Route>

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle}>
            <Router />
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
