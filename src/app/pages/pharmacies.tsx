import { useState, useEffect } from "react";
import { Link } from "react-router";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { MapPin, Navigation, Phone, Clock, Search, Map as MapIcon } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
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

export function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const data = await apiClient("/pharmacies");
        setPharmacies(data);
      } catch (error: any) {
        toast.error("Failed to load pharmacies");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPharmacies();
  }, []);

  const filteredPharmacies = pharmacies.filter((pharmacy) =>
    pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#0F766E' }}>Nearby Pharmacies</h1>
        <p className="text-xl text-gray-600">Find pharmacies near you with real-time availability</p>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg border-2 focus:border-[#0F766E] rounded-xl"
          />
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            onClick={() => setViewMode("list")}
            className={`rounded-lg ${viewMode === "list" ? "bg-[#0F766E] text-white shadow-md" : "text-gray-600 hover:text-[#0F766E]"}`}
          >
            List View
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "ghost"}
            onClick={() => setViewMode("map")}
            className={`rounded-lg ${viewMode === "map" ? "bg-[#0F766E] text-white shadow-md" : "text-gray-600 hover:text-[#0F766E]"}`}
          >
            <MapIcon className="w-5 h-5 mr-2" />
            Map View
          </Button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === "map" && (
        <Card className="p-4 rounded-2xl overflow-hidden shadow-xl border-2 border-[#B7D1CC]/30">
          <div className="h-[600px] w-full rounded-xl overflow-hidden relative z-0">
             <MapContainer 
              center={[36.7538, 3.0588]} 
              zoom={13} 
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredPharmacies.map((pharmacy) => (
                pharmacy.location && pharmacy.location.coordinates && pharmacy.location.coordinates[0] !== undefined && pharmacy.location.coordinates[1] !== undefined && (
                  <Marker 
                    key={pharmacy._id} 
                    position={[pharmacy.location.coordinates[1], pharmacy.location.coordinates[0]]}
                  >
                    <Popup className="rounded-xl overflow-hidden shadow-2xl">
                      <div className="p-3 space-y-3 min-w-[200px]">
                        <div>
                           <h4 className="font-bold text-[#0F766E] text-lg">{pharmacy.name}</h4>
                           <p className="text-sm text-gray-500 leading-tight">{pharmacy.address}</p>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-teal-50">
                          <Button 
                            size="sm" 
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.location.coordinates[1]},${pharmacy.location.coordinates[0]}`, '_blank')}
                            className="bg-[#0F766E] text-white flex-1 h-10 rounded-xl font-bold shadow-lg shadow-teal-900/10"
                          >
                             <Navigation className="w-4 h-4 mr-2" />
                             Go
                          </Button>
                          <Button 
                             size="sm" 
                             variant="outline" 
                             onClick={() => window.location.href = `tel:${pharmacy.phone}`}
                             className="h-10 w-10 p-0 rounded-xl border-2 border-teal-100 text-[#0F766E] hover:bg-teal-50"
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-96 rounded-2xl bg-gray-50 animate-pulse" />
            ))
          ) : filteredPharmacies.length === 0 ? (
            <Card className="col-span-full p-20 text-center rounded-2xl border-2 border-dashed border-[#B7D1CC]/50">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-2xl mb-2 text-gray-600">No pharmacies found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </Card>
          ) : (
            filteredPharmacies.map((pharmacy) => (
              <Card key={pharmacy.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 rounded-2xl group border-[#B7D1CC]/30 hover:border-[#0F766E]/50">
                <div className="h-48 overflow-hidden relative">
                  <ImageWithFallback
                    src={pharmacy.image}
                    alt={pharmacy.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {!pharmacy.isApproved && (
                    <div className="absolute top-4 right-4 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      Pending Verification
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-4 bg-white">
                  <div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: '#0F766E' }}>{pharmacy.name}</h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {pharmacy.address}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" /> {pharmacy.phone || "No phone listed"}
                    </p>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> {pharmacy.openingTime && pharmacy.closingTime ? `${pharmacy.openingTime} - ${pharmacy.closingTime}` : "Hours not specified"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge className={`${pharmacy.openingTime ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"} border-none px-3 py-1 rounded-full text-xs`}>
                      {pharmacy.openingTime ? "Open Now" : "Unknown Status"}
                    </Badge>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter italic">License: {pharmacy.licenseNumber || "Pending"}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link to={`/dashboard/medicines?pharmacyId=${pharmacy._id}`} className="flex-1">
                      <Button 
                        className="w-full bg-[#0F766E] hover:bg-[#0d6560] text-white rounded-xl h-11"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Visit Store
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="border-2 rounded-xl h-11 w-11 hover:bg-teal-50"
                      style={{ borderColor: '#0F766E', color: '#0F766E' }}
                    >
                      <Phone className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
