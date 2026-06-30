import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/contexts/sidebar-context";

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="h-full flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 overflow-y-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}
