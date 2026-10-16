import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { SubscriptionGate } from "@/components/subscription-gate";
import { AuthProvider } from "@/contexts/auth-context";
import { VisitorNotifications } from "@/components/notifications/visitor-notifications";
import { ReferralLinker } from "@/components/affiliate/referral-linker";

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="h-full flex">
          <Sidebar />
          <main className="flex-1 lg:ml-64 overflow-y-auto">
            <SubscriptionGate>{children}</SubscriptionGate>
          </main>
          <VisitorNotifications />
          <ReferralLinker />
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
