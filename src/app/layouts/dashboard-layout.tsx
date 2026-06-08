import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Package, Home, MapPin, Pill, Heart, ShoppingCart, User, Bell, Menu, X, LogOut, Stethoscope, Clipboard } from "lucide-react";
import { Button } from "../components/ui/button";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "../api/client";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
       navigate("/");
       return;
    }

    // Role-based route protection
    // Role-based route protection
    const customerOnlyPaths = ["/dashboard/pharmacies", "/dashboard/medicines", "/dashboard/health-packs"];
    const doctorOnlyPaths = ["/dashboard/doctor"];
    
    if (user.role !== "CUSTOMER" && customerOnlyPaths.some(p => location.pathname.startsWith(p))) {
      navigate("/dashboard");
      toast.error("Account restricted to management view only.");
    }

    if (user.role !== "DOCTOR" && doctorOnlyPaths.some(p => location.pathname.startsWith(p))) {
      navigate("/dashboard");
      toast.error("Access restricted to healthcare professionals.");
    }
  }, [user, navigate, location.pathname, isLoading]);

  useEffect(() => {
    if (user?.role === "PHARMACY_OWNER") {
      apiClient("/pharmacies/my-pharmacy")
        .then((data: any) => {
          if (data && data._id) {
            // Retrieve base URL (strip /api if present)
            const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
            const socket = io(baseUrl);

            socket.on("connect", () => {
              socket.emit("join_pharmacy", data._id);
            });

            socket.on("new_order", (order: any) => {
              setNotifCount(prev => prev + 1);
              toast.success(`🚨 New Client Order! #${order._id.slice(-6).toUpperCase()}`, {
                duration: 12000,
                description: `From: ${order.userId?.name || "Client"} • $${order.totalAmount?.toFixed(2)}`,
                action: {
                  label: "View Orders",
                  onClick: () => { navigate("/dashboard/orders"); setNotifCount(0); }
                }
              });
            });

            return () => {
              socket.disconnect();
            };
          }
        })
        .catch(() => console.error("No pharmacy connected for socket notifications"));
    }
  }, [user]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#B7D1CC]">Loading...</div>;
  if (!user) return null;

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
  };

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    ...(user?.role === "DOCTOR" ? [
      { path: "/dashboard/doctor", icon: Stethoscope, label: "Doctor Dashboard" },
    ] : []),
    ...(user?.role === "CUSTOMER" ? [
      { path: "/dashboard/pharmacies", icon: MapPin, label: "Pharmacies" },
      { path: "/dashboard/medicines", icon: Pill, label: "Medicines" },
      { path: "/dashboard/health-packs", icon: Heart, label: "Health Packs" },
      { path: "/dashboard/consultations", icon: Stethoscope, label: "Consultations" },
      { path: "/dashboard/prescriptions", icon: Clipboard, label: "My Prescriptions" },
    ] : []),
    ...(user?.role !== "DOCTOR" ? [
      { path: "/dashboard/orders", icon: ShoppingCart, label: user?.role === "PHARMACY_OWNER" ? "Client Orders" : "Orders" },
    ] : []),
    { path: "/dashboard/account", icon: User, label: "Account" },
    ...(user?.role !== "PHARMACY_OWNER" ? [
      { path: "/dashboard/profile", icon: User, label: "Settings" },
    ] : []),
  ];


  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src="/logo.jpg" alt="PharmaSmart" className="w-10 h-10 object-contain rounded-lg bg-white" />
              <span className="text-xl hidden sm:inline" style={{ color: '#0F766E' }}>MediCare+</span>
            </Link>
          </div>


          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => { navigate("/dashboard/orders"); setNotifCount(0); }}
            >
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
              {notifCount === 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#0F766E' }}></span>
              )}
            </Button>
            <Link to="/dashboard/profile">
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" style={{ backgroundColor: '#B7D1CC' }}>
                <User className="w-5 h-5" style={{ color: '#0F766E' }} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside 
          className="hidden lg:block w-64 border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16"
          style={{ backgroundColor: '#B7D1CC' }}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      active
                        ? "text-white shadow-lg"
                        : "text-gray-700 hover:bg-[#8FB9B0]"
                    }`}
                    style={active ? { backgroundColor: '#0F766E' } : {}}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-lg">{item.label}</span>
                  </div>
                </Link>
              );
            })}
            <div className="pt-4 mt-4 border-t border-[#8FB9B0]">
              <div
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-700 hover:bg-[#8FB9B0] cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-lg">Logout</span>
              </div>
            </div>
          </nav>
        </aside>

        {/* Sidebar - Mobile */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <aside 
              className="fixed top-0 left-0 w-64 h-full shadow-xl"
              style={{ backgroundColor: '#B7D1CC' }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <img src="/logo.jpg" alt="PharmaSmart" className="w-10 h-10 object-contain rounded-lg bg-white shadow-sm" />
                    <span className="text-xl" style={{ color: '#0F766E' }}>MediCare+</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                        <div
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            active
                              ? "text-white shadow-lg"
                              : "text-gray-700 hover:bg-[#8FB9B0]"
                          }`}
                          style={active ? { backgroundColor: '#0F766E' } : {}}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-lg">{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                  <div className="pt-4 mt-4 border-t border-[#8FB9B0]">
                    <div
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-700 hover:bg-[#8FB9B0] cursor-pointer"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-lg">Logout</span>
                    </div>
                  </div>
                </nav>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}