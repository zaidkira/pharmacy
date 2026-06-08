import { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Users, ShoppingBag, Pill, TrendingUp, DollarSign, MapPin } from "lucide-react";
import { Link } from "react-router";
import { apiClient } from "../../api/client";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;


export function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await apiClient("/auth/stats");
        setData(result);
      } catch (error: any) {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  const iconMap: any = {
    Users,
    ShoppingBag,
    Pill,
    TrendingUp,
    DollarSign,
    MapPin
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#0F766E' }}>Admin Dashboard</h1>
        <p className="text-xl text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.stats?.map((stat: any) => {
          const Icon = iconMap[stat.icon] || TrendingUp;
          return (
            <Card key={stat.title} className="p-6 rounded-2xl hover:shadow-xl transition-all duration-300 border-[#B7D1CC]/30 border-2">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: stat.color }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  stat.trend === "up" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-500 font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold" style={{ color: '#0F766E' }}>{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Admin Map View */}
      <Card className="p-6 rounded-2xl border-2 border-[#B7D1CC]/30">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#0F766E' }}>
          <MapPin className="w-6 h-6" />
          Pharmacy Network Map
        </h2>
        <div className="h-[400px] w-full rounded-xl overflow-hidden relative z-0 border border-teal-100">
           <MapContainer 
            center={[40.7128, -74.0060]} 
            zoom={12} 
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {data?.pharmacies?.map((pharmacy: any) => (
              pharmacy.location && pharmacy.location.coordinates && pharmacy.location.coordinates[0] !== undefined && pharmacy.location.coordinates[1] !== undefined && (
                <Marker 
                  key={pharmacy._id} 
                  position={[pharmacy.location.coordinates[1], pharmacy.location.coordinates[0]]}
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold text-[#0F766E]">{pharmacy.name}</p>
                      <p className="text-xs text-gray-500">{pharmacy.address}</p>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </Card>


      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="p-6 rounded-2xl border-[#B7D1CC]/30 border-2 shadow-sm">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0F766E' }}>Recent Orders</h2>
          <div className="space-y-4">
            {data?.recentOrders?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent orders found.</p>
            ) : (
              data?.recentOrders?.map((order: any) => (
                <div key={order._id} className="flex items-center justify-between p-4 rounded-xl hover:bg-teal-50/50 transition-colors border border-transparent hover:border-teal-100">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-400">#{order._id.slice(-6).toUpperCase()}</p>
                    <p className="font-semibold" style={{ color: '#0F766E' }}>{order.userId?.name || "Anonymous"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: '#0F766E' }}>${order.totalAmount?.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="ml-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === "Completed" 
                        ? "bg-green-100 text-green-800"
                        : order.status === "Processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-orange-100 text-orange-800"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-8 rounded-3xl shadow-2xl border-none relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #2F8F7E 100%)' }}>
             <div className="relative z-10 space-y-6">
                <div>
                   <h2 className="text-3xl font-black text-white mb-2 leading-tight">System Controls</h2>
                   <p className="text-teal-50 opacity-80 text-lg">Centralized oversight for the entire pharmaceutical network.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/admin/users" className="p-6 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all text-center flex flex-col items-center gap-4 backdrop-blur-md border border-white/20 group">
                    <Users className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm uppercase tracking-widest">Accounts</span>
                  </Link>
                  <Link to="/admin/pharmacies" className="p-6 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all text-center flex flex-col items-center gap-4 backdrop-blur-md border border-white/20 group">
                    <MapPin className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm uppercase tracking-widest">Pharmacies</span>
                  </Link>
                  <Link to="/admin/medicines" className="p-6 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all text-center flex flex-col items-center gap-4 backdrop-blur-md border border-white/20 group">
                    <Pill className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm uppercase tracking-widest">Inventory</span>
                  </Link>
                  <Link to="/admin/orders" className="p-6 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all text-center flex flex-col items-center gap-4 backdrop-blur-md border border-white/20 group">
                    <ShoppingBag className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm uppercase tracking-widest">Orders</span>
                  </Link>
                </div>
             </div>
             {/* Decorative circles */}
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
             <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          </Card>

          <Card className="p-6 rounded-2xl border-[#B7D1CC]/30 border-2">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100">
                  <TrendingUp className="w-6 h-6 text-[#0F766E]" />
                </div>
                <div>
                   <h4 className="font-bold text-gray-800">Growth Tracking</h4>
                   <p className="text-sm text-gray-500">Daily active sessions increased by 14% today.</p>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
