import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import MonitorPage from "@/pages/MonitorPage";
import ViolationsPage from "@/pages/ViolationsPage";
import ChallansPage from "@/pages/ChallansPage";
import VehicleSearchPage from "@/pages/VehicleSearchPage";
import AadhaarLookupPage from "@/pages/AadhaarLookupPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

// Auto-assign admin role to first user
const useAutoAssignRole = () => {
  const { user, role, refreshRole } = useAuth();
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!user || role || assigning) return;

    const assignRole = async () => {
      setAssigning(true);
      try {
        // Check if any roles exist
        const { count } = await supabase.from("user_roles").select("*", { count: "exact", head: true });
        const newRole = (count ?? 0) === 0 ? "admin" : "officer";
        
        const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: newRole });
        if (!error) {
          await refreshRole();
        }
      } catch (err) {
        console.error("Error auto-assigning role:", err);
      } finally {
        setAssigning(false);
      }
    };

    assignRole();
  }, [user, role, assigning, refreshRole]);
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  useAutoAssignRole();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { role } = useAuth();
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/monitor" element={<MonitorPage />} />
              <Route path="/violations" element={<ViolationsPage />} />
              <Route path="/challans" element={<ChallansPage />} />
              <Route path="/vehicles" element={<VehicleSearchPage />} />
              <Route path="/aadhaar" element={<AdminRoute><AadhaarLookupPage /></AdminRoute>} />
              <Route path="/audit-logs" element={<AdminRoute><AuditLogsPage /></AdminRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
