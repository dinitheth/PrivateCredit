import { Home, FileText, Wallet, BarChart3, Shield, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

interface AppSidebarProps {
  userRole?: string;
}

export function AppSidebar({ userRole = "borrower" }: AppSidebarProps) {
  const [location] = useLocation();

  const borrowerItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Submit Data",
      url: "/submit-data",
      icon: FileText,
    },
    {
      title: "My Loans",
      url: "/loans",
      icon: Wallet,
    },
  ];

  const lenderItems = [
    {
      title: "Dashboard",
      url: "/lender",
      icon: Home,
    },
    {
      title: "Loan Requests",
      url: "/lender/requests",
      icon: BarChart3,
    },
    {
      title: "Portfolio",
      url: "/lender/portfolio",
      icon: Wallet,
    },
  ];

  const adminItems = [
    {
      title: "Admin Panel",
      url: "/admin",
      icon: Shield,
    },
    {
      title: "System Status",
      url: "/admin/status",
      icon: Settings,
    },
  ];

  const menuItems = userRole === "lender" ? lenderItems : userRole === "admin" ? adminItems : borrowerItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-sidebar-foreground">Private Credit</h2>
            <p className="text-xs text-muted-foreground">Powered by FHEVM</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="rounded-lg bg-card p-4 border border-card-border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-card-foreground">Privacy Shield</span>
          </div>
          <p className="text-xs text-muted-foreground">
            All data encrypted end-to-end using Zama FHEVM
          </p>
          <Badge variant="outline" className="mt-2 text-xs">
            Base Sepolia
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
