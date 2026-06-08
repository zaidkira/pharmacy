import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { 
  User, Mail, Phone, MapPin, Calendar, CreditCard, 
  Package, Heart, Shield, Edit, Save, X, Plus, Trash2,
  Clock, Star, ExternalLink, Loader2
} from "lucide-react";
import { apiClient } from "../api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface HealthProfile {
  conditions: string[];
  allergies: string[];
  medications: string[];
  bloodType: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

interface Pharmacy {
  _id: string;
  name: string;
  address: string;
  phone: string;
  licenseNumber: string;
  isApproved: boolean;
  location: {
    type: string;
    coordinates: [number, number];
  };
  openingHours: {
    open: string;
    close: string;
  };
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: "CUSTOMER" | "PHARMACY_OWNER" | "ADMIN";
  createdAt: string;
  healthProfile: HealthProfile;
}



export function AccountPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isAddingMedicine, setIsAddingMedicine] = useState(false);
  const [editingMed, setEditingMed] = useState<any>(null);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    category: '',
    price: '',
    stockQuantity: '',
    description: '',
    requiresPrescription: false,
    imageUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [isEditingPharmacy, setIsEditingPharmacy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: "", phone: "", address: "" });
  const [healthForm, setHealthForm] = useState<HealthProfile | null>(null);
  const [pharmacyForm, setPharmacyForm] = useState({ 
    name: "", address: "", phone: "", licenseNumber: "", 
    open: "08:00", close: "22:00", 
    lat: 36.7538, lng: 3.0588 // Algiers coordinates
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchPharmacyData = async () => {
      if (user?.role === 'PHARMACY_OWNER') {
        try {
          const data = await apiClient("/pharmacies/my-pharmacy");
          setPharmacy(data);
          
          const [medicinesData, ordersData] = await Promise.all([
            apiClient(`/medicines/pharmacy/${data._id}`),
            apiClient(`/orders/pharmacy/${data._id}`)
          ]);
          setMedicines(medicinesData);
          setOrders(ordersData);
        } catch (error) {
          console.error("No pharmacy found or error fetching data");
        }
      }
    };
    fetchPharmacyData();
  }, [user]);

  const handleAddMedicine = async () => {
    setIsSaving(true);
    try {
      const isEditing = !!editingMed;
      const endpoint = isEditing ? `/medicines/${editingMed._id}` : "/medicines";
      const method = isEditing ? "PUT" : "POST";

      const data = await apiClient(endpoint, {
        method,
        body: JSON.stringify({ 
          ...newMedicine, 
          pharmacyId: pharmacy._id 
        })
      });

      if (isEditing) {
        setMedicines(medicines.map(m => m._id === data._id ? data : m));
        toast.success("Medicine updated successfully.");
      } else {
        setMedicines([...medicines, data]);
        toast.success("Medicine added successfully.");
      }

      setIsAddingMedicine(false);
      setEditingMed(null);
      setNewMedicine({ 
        name: '', category: '', price: '', stockQuantity: '', 
        description: '', requiresPrescription: false, imageUrl: '' 
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to save medicine.");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await apiClient("/auth/profile");
      setUser(data);
      setProfileForm({
        name: data.name,
        phone: data.phone || "",
        address: data.address || ""
      });
      setHealthForm(data.healthProfile || {
        conditions: [],
        allergies: [],
        medications: [],
        bloodType: "",
        emergencyContact: { name: "", relationship: "", phone: "" }
      });
      
      if (data.role === "PHARMACY_OWNER") {
        fetchPharmacy();
      } else {
        const ordersData = await apiClient("/orders/myorders");
        setOrders(ordersData);
      }
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      if (user?.role !== "PHARMACY_OWNER") setLoading(false);
    }
  };

  const fetchPharmacy = async () => {
    try {
      const data = await apiClient("/pharmacies/my-pharmacy");
      setPharmacy(data);
      setPharmacyForm({
        name: data.name,
        address: data.address,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        open: data.openingHours?.open || "08:00",
        close: data.openingHours?.close || "22:00",
        lat: data.location?.coordinates?.[1] || 36.7538,
        lng: data.location?.coordinates?.[0] || 3.0588
      });
    } catch (error: any) {
      // It's okay if they don't have one yet
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await apiClient("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profileForm)
      });
      setUser({ ...user!, ...updated });
      setIsEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateHealth = async () => {
    setIsSaving(true);
    try {
      const updated = await apiClient("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ healthProfile: healthForm })
      });
      setUser({ ...user!, healthProfile: updated.healthProfile });
      setIsEditingHealth(false);
      toast.success("Health profile updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePharmacy = async () => {
    setIsSaving(true);
    try {
      const isNew = !pharmacy;
      const endpoint = isNew ? "/pharmacies" : "/pharmacies/my-pharmacy";
      const method = isNew ? "POST" : "PUT";
      
      const body = {
        name: pharmacyForm.name,
        address: pharmacyForm.address,
        phone: pharmacyForm.phone,
        licenseNumber: pharmacyForm.licenseNumber,
        openingHours: {
          open: pharmacyForm.open,
          close: pharmacyForm.close
        },
        location: {
          type: "Point",
          coordinates: [pharmacyForm.lng, pharmacyForm.lat]
        }
      };

      const data = await apiClient(endpoint, {
        method,
        body: JSON.stringify(body)
      });
      
      setPharmacy(data);
      setIsEditingPharmacy(false);
      toast.success(isNew ? "Pharmacy registered successfully" : "Pharmacy details updated");
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiClient(`/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      setOrders(orders.map((o: any) => o._id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order set to ${newStatus}`);
    } catch (error: any) {
      toast.error("Status update failed");
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[60vh] text-[#0F766E] font-medium">Loading your profile...</div>;
  if (!user) return <div className="text-center p-12 text-red-600">User not found. Please log in again.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#0F766E' }}>Account Settings</h1>
          <p className="text-xl text-gray-500">Manage your personal information, security, and health records.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card className="p-8 rounded-[2rem] border-none shadow-xl shadow-teal-900/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F0FDFA] rounded-full -mr-16 -mt-16 z-0" />
            <div className="relative z-10 text-center space-y-6">
              <div className="w-28 h-28 rounded-3xl mx-auto flex items-center justify-center shadow-lg transform -rotate-3" style={{ backgroundColor: '#0F766E' }}>
                <User className="w-14 h-14 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#0F766E' }}>{user.name}</h2>
                <span className="px-3 py-1 bg-teal-50 text-[#0F766E] text-xs font-bold rounded-full uppercase tracking-wider">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <Separator className="bg-gray-100" />
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Email Address</p>
                    <p className="text-sm font-medium text-gray-700 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Phone Number</p>
                    <p className="text-sm font-medium text-gray-700">{user.phone || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Primary Address</p>
                    <p className="text-sm font-medium text-gray-700 truncate">{user.address || "Not set"}</p>
                  </div>
                </div>
              </div>
              <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                <DialogTrigger asChild>
                  <Button className="w-full py-6 bg-[#0F766E] hover:bg-[#0d6560] text-white rounded-2xl shadow-lg shadow-teal-900/20 transition-all hover:scale-[1.02]">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white rounded-3xl sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#0F766E]">Update Personal Info</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-gray-500">Full Name</Label>
                      <Input id="name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone" className="text-gray-500">Phone</Label>
                      <Input id="phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address" className="text-gray-500">Address</Label>
                      <Input id="address" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className="rounded-xl" />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => setIsEditingProfile(false)} className="rounded-xl">Discard</Button>
                    <Button onClick={handleUpdateProfile} style={{ backgroundColor: '#0F766E' }} className="text-white rounded-xl px-8">Save Profile</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
          {user.role === "CUSTOMER" ? (
            <>
              <Card className="p-8 rounded-[2rem] border-none shadow-xl shadow-teal-900/5 bg-white relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: '#0F766E' }}>
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#0F766E]">Health Profile</h2>
                      <p className="text-sm text-gray-400">Keep your records updated for better care.</p>
                    </div>
                  </div>
                  <Dialog open={isEditingHealth} onOpenChange={setIsEditingHealth}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-xl border-2 px-6 font-bold" style={{ borderColor: '#0F766E', color: '#0F766E' }}>
                        Edit Info
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-white rounded-3xl overflow-y-auto max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-[#0F766E]">Update Health Profile</DialogTitle>
                      </DialogHeader>
                      <div className="grid md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="font-bold text-gray-600">Medical Conditions</Label>
                            <div className="flex flex-wrap gap-2">
                              {healthForm?.conditions.map((c, i) => (
                                <span key={i} className="flex items-center gap-1 px-3 py-1 bg-teal-50 text-[#0F766E] rounded-full text-xs font-medium border border-teal-100">
                                  {c}
                                  <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => {
                                    const next = [...healthForm.conditions];
                                    next.splice(i, 1);
                                    setHealthForm({ ...healthForm, conditions: next });
                                  }} />
                                </span>
                              ))}
                            </div>
                            <Input id="new-condition" placeholder="Add condition..." className="rounded-xl" onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (val) {
                                  setHealthForm({ ...healthForm!, conditions: [...healthForm!.conditions, val] });
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }
                            }} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold text-gray-600">Allergies</Label>
                            <div className="flex flex-wrap gap-2">
                              {healthForm?.allergies.map((a, i) => (
                                <span key={i} className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100">
                                  {a}
                                  <X className="w-3 h-3 cursor-pointer hover:text-red-800" onClick={() => {
                                    const next = [...healthForm.allergies];
                                    next.splice(i, 1);
                                    setHealthForm({ ...healthForm, allergies: next });
                                  }} />
                                </span>
                              ))}
                            </div>
                            <Input id="new-allergy" placeholder="Add allergy..." className="rounded-xl" onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (val) {
                                  setHealthForm({ ...healthForm!, allergies: [...healthForm!.allergies, val] });
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }
                            }} />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="font-bold text-gray-600">Current Medications</Label>
                            <div className="flex flex-wrap gap-2">
                              {healthForm?.medications.map((m, i) => (
                                <span key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                                  {m}
                                  <X className="w-3 h-3 cursor-pointer" onClick={() => {
                                    const next = [...healthForm.medications];
                                    next.splice(i, 1);
                                    setHealthForm({ ...healthForm, medications: next });
                                  }} />
                                </span>
                              ))}
                            </div>
                            <Input id="new-med" placeholder="Add medication..." className="rounded-xl" onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (val) {
                                  setHealthForm({ ...healthForm!, medications: [...healthForm!.medications, val] });
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }
                            }} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold text-gray-600">Blood Type</Label>
                            <select 
                              className="w-full h-10 px-3 rounded-xl border border-input bg-background"
                              value={healthForm?.bloodType || ""}
                              onChange={(e) => setHealthForm({...healthForm!, bloodType: e.target.value})}
                            >
                              <option value="">Select Blood Type</option>
                              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(v => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-span-full pt-4 border-t">
                          <p className="font-bold text-gray-800 mb-4">Emergency Contact</p>
                          <div className="grid sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input value={healthForm?.emergencyContact.name || ""} onChange={(e) => setHealthForm({...healthForm!, emergencyContact: {...healthForm!.emergencyContact, name: e.target.value}})} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label>Relationship</Label>
                              <Input value={healthForm?.emergencyContact.relationship || ""} onChange={(e) => setHealthForm({...healthForm!, emergencyContact: {...healthForm!.emergencyContact, relationship: e.target.value}})} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label>Phone</Label>
                              <Input value={healthForm?.emergencyContact.phone || ""} onChange={(e) => setHealthForm({...healthForm!, emergencyContact: {...healthForm!.emergencyContact, phone: e.target.value}})} className="rounded-xl" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button variant="ghost" onClick={() => setIsEditingHealth(false)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleUpdateHealth} style={{ backgroundColor: '#0F766E' }} className="text-white rounded-xl px-10">Record Updates</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-3">
                    <p className="text-[10px] tracking-widest uppercase font-bold text-gray-400">Medical History</p>
                    <div className="flex flex-wrap gap-2">
                      {user.healthProfile.conditions.length > 0 ? user.healthProfile.conditions.map((c, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#F0FDFA] text-[#0F766E] rounded-xl text-sm font-semibold border border-teal-100">
                          {c}
                        </span>
                      )) : <p className="text-sm text-gray-400 italic">No conditions recorded</p>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] tracking-widest uppercase font-bold text-gray-400">Allergies</p>
                    <div className="flex flex-wrap gap-2">
                      {user.healthProfile.allergies.length > 0 ? user.healthProfile.allergies.map((a, i) => (
                        <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">
                          {a}
                        </span>
                      )) : <p className="text-sm text-gray-400 italic">No allergies recorded</p>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] tracking-widest uppercase font-bold text-gray-400">Medications</p>
                    <div className="flex flex-col gap-2">
                      {user.healthProfile.medications.length > 0 ? user.healthProfile.medications.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          {m}
                        </div>
                      )) : <p className="text-sm text-gray-400 italic">No medications recorded</p>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] tracking-widest uppercase font-bold text-gray-400">Biological Markers</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#0F766E]">{user.healthProfile.bloodType || "N/A"}</span>
                      <span className="text-sm font-bold text-gray-400 uppercase">Blood Group</span>
                    </div>
                  </div>
                </div>
                <div className="mt-10 p-5 rounded-2xl bg-teal-50/50 border border-teal-100/50">
                  <p className="text-[10px] tracking-widest uppercase font-bold text-[#0F766E] mb-4 flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Emergency Response
                  </p>
                  {user.healthProfile.emergencyContact.name ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800 text-lg">{user.healthProfile.emergencyContact.name}</p>
                        <p className="text-sm text-teal-700">{user.healthProfile.emergencyContact.relationship}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-mono font-bold text-[#0F766E]">{user.healthProfile.emergencyContact.phone}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Primary Contact</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Please add an emergency contact for your safety.</p>
                  )}
                </div>
              </Card>
              <Card className="p-8 rounded-[2rem] border-none shadow-xl shadow-teal-900/5 bg-white">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-[#0F766E]">Recent Activity</h2>
                  <Button variant="ghost" className="text-[#0F766E] font-bold">View History</Button>
                </div>
                <div className="space-y-4">
                  {orders.length > 0 ? orders.map((order) => (
                    <div key={order._id} className="group flex items-center justify-between p-5 rounded-3xl hover:bg-[#F0FDFA] transition-all border border-gray-100/50 cursor-pointer">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:bg-[#0F766E] transition-colors">
                          <Clock className="w-6 h-6 text-[#0F766E] group-hover:text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-bold text-gray-800">#{order._id.slice(-6).toUpperCase()}</p>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-widest ${
                              order.status === "Completed" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-medium">
                            {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#0F766E]">${order.totalAmount?.toFixed(2)}</p>
                        <ExternalLink className="w-4 h-4 ml-auto text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500 italic">No recent activity found.</div>
                  )}
                </div>
              </Card>
            </>
          ) : user.role === "PHARMACY_OWNER" ? (
            <>
              <Card className="p-8 rounded-[2rem] border-none shadow-xl shadow-teal-900/5 bg-white relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: '#0F766E' }}>
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#0F766E]">Pharmacy Controls</h2>
                      <p className="text-sm text-gray-400">Manage your pharmacy location, hours and business info.</p>
                    </div>
                  </div>
                  <Dialog open={isEditingPharmacy} onOpenChange={setIsEditingPharmacy}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-xl border-2 px-6 font-bold" style={{ borderColor: '#0F766E', color: '#0F766E' }}>
                        {pharmacy ? "Edit Config" : "Setup Pharmacy"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl bg-white rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-[#0F766E]">{pharmacy ? "Update Pharmacy" : "Register Pharmacy"}</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Pharmacy Name</Label>
                            <Input value={pharmacyForm.name} onChange={(e) => setPharmacyForm({...pharmacyForm, name: e.target.value})} className="rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label>License Number</Label>
                            <Input value={pharmacyForm.licenseNumber} onChange={(e) => setPharmacyForm({...pharmacyForm, licenseNumber: e.target.value})} className="rounded-xl" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Business Phone</Label>
                          <Input value={pharmacyForm.phone} onChange={(e) => setPharmacyForm({...pharmacyForm, phone: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Street Address</Label>
                          <Input value={pharmacyForm.address} onChange={(e) => setPharmacyForm({...pharmacyForm, address: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Opening Time</Label>
                            <Input type="time" value={pharmacyForm.open} onChange={(e) => setPharmacyForm({...pharmacyForm, open: e.target.value})} className="rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label>Closing Time</Label>
                            <Input type="time" value={pharmacyForm.close} onChange={(e) => setPharmacyForm({...pharmacyForm, close: e.target.value})} className="rounded-xl" />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input type="number" step="0.000001" value={pharmacyForm.lat} onChange={(e) => setPharmacyForm({...pharmacyForm, lat: parseFloat(e.target.value)})} className="rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input type="number" step="0.000001" value={pharmacyForm.lng} onChange={(e) => setPharmacyForm({...pharmacyForm, lng: parseFloat(e.target.value)})} className="rounded-xl" />
                          </div>
                        </div>
                        <Button 
                          type="button"
                          variant="outline"
                          className="w-full mt-2 rounded-xl text-[#0F766E] border-teal-100 hover:bg-teal-50"
                          onClick={() => {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setPharmacyForm({
                                ...pharmacyForm,
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude
                              });
                              toast.success("Location captured");
                            }, () => {
                              toast.error("Could not access location");
                            });
                          }}
                        >
                          <MapPin size={14} className="mr-2" />
                          Get My Current GPS Location
                        </Button>
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditingPharmacy(false)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleUpdatePharmacy} style={{ backgroundColor: '#0F766E' }} className="text-white rounded-xl px-10">Save Configuration</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {pharmacy ? (<>
                  <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 mt-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#0F766E]">
                           <MapPin className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Business Address</p>
                           <p className="text-sm font-semibold text-gray-700">{pharmacy.address}</p>
                           <p className="text-xs text-gray-400 mt-1 font-mono">
                             [{pharmacy.location?.coordinates?.[1] !== undefined ? pharmacy.location.coordinates[1].toFixed(4) : "36.7538"}, {pharmacy.location?.coordinates?.[0] !== undefined ? pharmacy.location.coordinates[0].toFixed(4) : "3.0588"}]
                           </p>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#0F766E]">
                           <Clock className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Shop Hours</p>
                           <p className="text-sm font-semibold text-gray-700">
                             {pharmacy.openingHours?.open || "08:00"} — {pharmacy.openingHours?.close || "22:00"}
                           </p>
                           <span className="inline-block mt-2 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-green-100">Open Now</span>
                         </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#0F766E]">
                           <Shield className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">License & Status</p>
                           <p className="text-sm font-semibold text-gray-700">{pharmacy.licenseNumber}</p>
                           <p className={`text-xs font-bold mt-1 uppercase ${pharmacy.isApproved ? 'text-[#0F766E]' : 'text-orange-500'}`}>
                             {pharmacy.isApproved ? "✓ Verified Partner" : "! Pending Verification"}
                           </p>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#0F766E]">
                           <Phone className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Contact Phone</p>
                           <p className="text-sm font-semibold text-gray-700">{pharmacy.phone}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                    <div className="mt-8 h-48 rounded-2xl overflow-hidden border-2 border-teal-50 shadow-inner group relative">
                      {pharmacy.location?.coordinates && pharmacy.location.coordinates[0] !== undefined && pharmacy.location.coordinates[1] !== undefined ? (
                        <MapContainer 
                          center={[pharmacy.location.coordinates[1], pharmacy.location.coordinates[0]]} 
                          zoom={15} 
                          style={{ height: "100%", width: "100%" }}
                          zoomControl={false}
                          scrollWheelZoom={false}
                          dragging={false}
                          touchZoom={false}
                          doubleClickZoom={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[pharmacy.location.coordinates[1], pharmacy.location.coordinates[0]]}>
                             <Popup>{pharmacy.name}</Popup>
                          </Marker>
                        </MapContainer>
                      ) : (
                        <div className="h-full w-full bg-gray-50 flex items-center justify-center text-gray-400 text-sm font-medium">
                          Location coordinates not configured
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform bg-white/80 backdrop-blur-md">
                         <p className="text-[10px] text-teal-800 font-bold text-center">Location verified via GPS coordinates</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center border-2 border-dashed border-teal-100 rounded-[2rem] bg-teal-50/20">
                    <Package className="w-12 h-12 text-teal-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-[#0F766E] mb-2">No Pharmacy Connected</h3>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">Register your pharmacy to start managing inventory and receiving client orders.</p>
                  </div>
                )}
              </Card>

              {/* Order Management Section */}
              <Card className="p-8 rounded-[2rem] border-none shadow-xl shadow-teal-900/5 bg-white">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: '#0F766E' }}>
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#0F766E]">Client Orders</h2>
                    <p className="text-sm text-gray-400">Incoming prescriptions and medicine requests</p>
                  </div>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div key={order._id} className="p-6 border border-gray-100 rounded-3xl hover:border-teal-100 transition-colors bg-gray-50/20">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-xl border border-gray-100 font-mono text-[10px] font-bold text-gray-400">
                              #{order._id.slice(-6).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{order.userId?.name || "Anonymous Patient"}</p>
                              <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <select 
                               className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none appearance-none cursor-pointer focus:ring-0 ${
                                 order.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 
                                 order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-600' :
                                 order.status === 'READY' ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'
                               }`}
                               value={order.status}
                               onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                             >
                               <option value="PENDING">PENDING</option>
                               <option value="ACCEPTED">ACCEPTED</option>
                               <option value="READY">READY</option>
                               <option value="DELIVERED">DELIVERED</option>
                               <option value="CANCELLED">CANCELLED</option>
                             </select>
                             {order.prescriptionUrl && (
                               <Button variant="ghost" size="sm" className="h-8 px-2 text-teal-600 bg-teal-50 rounded-lg" asChild>
                                 <a href={order.prescriptionUrl} target="_blank" rel="noopener noreferrer">
                                   <ExternalLink className="w-3 h-3 mr-1" />
                                   RX
                                 </a>
                               </Button>
                             )}
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{item.name} <span className="text-gray-300 ml-1">x{item.quantity}</span></span>
                              <span className="font-bold text-gray-800">{(item.price * item.quantity).toFixed(2)} DZ</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Value</span>
                          <span className="text-lg font-bold text-[#0F766E]">{order.totalAmount.toFixed(2)} DZ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-16 text-center border border-gray-100 rounded-3xl bg-gray-50/30">
                    <p className="text-gray-400 font-medium italic">No client orders yet. They will appear here once customers place them.</p>
                  </div>
                )}
              </Card>

              {/* Inventory Management Section */}
              <Card className="p-8 rounded-[2rem] border-none shadow-xl shadow-teal-900/5 bg-white">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: '#0F766E' }}>
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#0F766E]">Inventory Management</h2>
                      <p className="text-sm text-gray-400">Manage your pharmacy's stock and pricing</p>
                    </div>
                  </div>
                  <Dialog open={isAddingMedicine} onOpenChange={(v) => {
                     setIsAddingMedicine(v);
                     if (!v) {
                       setEditingMed(null);
                       setNewMedicine({ name: '', category: '', price: '', stockQuantity: '', description: '', requiresPrescription: false, imageUrl: '' });
                     }
                   }}>
                     <DialogTrigger asChild>
                       <Button style={{ backgroundColor: '#0F766E' }} className="text-white rounded-xl px-6 font-bold shadow-lg shadow-teal-900/10">
                         <Plus className="w-4 h-4 mr-2" />
                         Add Product
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="bg-white rounded-3xl sm:max-w-md">
                       <DialogHeader>
                         <DialogTitle className="text-2xl font-bold text-[#0F766E]">
                           {editingMed ? "Edit Medicine" : "Add New Medicine"}
                         </DialogTitle>
                       </DialogHeader>
                       <div className="grid gap-4 py-4">
                         <div className="grid gap-2">
                           <Label className="text-gray-500">Medicine Name</Label>
                           <Input value={newMedicine.name} onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})} className="rounded-xl" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="grid gap-2">
                             <Label className="text-gray-500">Category</Label>
                             <Input value={newMedicine.category} onChange={(e) => setNewMedicine({...newMedicine, category: e.target.value})} className="rounded-xl" />
                           </div>
                           <div className="grid gap-2">
                             <Label className="text-gray-500">Price ($)</Label>
                             <Input type="number" value={newMedicine.price} onChange={(e) => setNewMedicine({...newMedicine, price: e.target.value})} className="rounded-xl" />
                           </div>
                         </div>
                         <div className="grid gap-2">
                           <Label className="text-gray-500">Stock Quantity</Label>
                           <Input type="number" value={newMedicine.stockQuantity} onChange={(e) => setNewMedicine({...newMedicine, stockQuantity: e.target.value})} className="rounded-xl" />
                         </div>
                         <div className="flex items-center gap-3 p-3 bg-teal-50/50 rounded-xl">
                            <input 
                              type="checkbox" 
                              id="rx-req"
                              checked={newMedicine.requiresPrescription}
                              onChange={(e) => setNewMedicine({...newMedicine, requiresPrescription: e.target.checked})}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="rx-req" className="text-sm font-bold text-teal-800 cursor-pointer">Requires Prescription (R𝗑 Only)</Label>
                         </div>
                         <div className="grid gap-2">
                           <Label className="text-gray-500">Image URL (Optional)</Label>
                           <Input value={newMedicine.imageUrl} onChange={(e) => setNewMedicine({...newMedicine, imageUrl: e.target.value})} className="rounded-xl" placeholder="https://..." />
                         </div>
                         <div className="grid gap-2">
                           <Label className="text-gray-500">Description</Label>
                           <Input value={newMedicine.description} onChange={(e) => setNewMedicine({...newMedicine, description: e.target.value})} className="rounded-xl" />
                         </div>
                       </div>
                       <DialogFooter>
                         <Button variant="ghost" onClick={() => setIsAddingMedicine(false)} className="rounded-xl">Cancel</Button>
                         <Button onClick={handleAddMedicine} style={{ backgroundColor: '#0F766E' }} className="text-white rounded-xl px-10">
                           {editingMed ? "Save Changes" : "Add to Stock"}
                         </Button>
                       </DialogFooter>
                     </DialogContent>
                   </Dialog>
                </div>

                {medicines.length > 0 ? (
                  <div className="overflow-hidden border border-gray-100 rounded-3xl">
                    <table className="w-full text-left">
                      <thead className="bg-[#F0FDFA] text-[#0F766E] uppercase text-[10px] font-bold tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Medicine</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4">Stock</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {medicines.map((med: any) => (
                          <tr key={med._id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4 font-bold text-gray-800">{med.name}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] font-bold uppercase">{med.category}</span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-[#0F766E]">${med.price.toFixed(2)}</td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-2">
                                 <span className={`w-2 h-2 rounded-full ${med.stockQuantity < 10 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                                 <span className={`font-bold ${med.stockQuantity < 10 ? 'text-red-500' : 'text-gray-700'}`}>{med.stockQuantity} units</span>
                               </div>
                             </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button 
                                   variant="ghost" 
                                   className="h-8 w-8 p-0 text-gray-400 hover:text-[#0F766E]"
                                   onClick={() => {
                                     setEditingMed(med);
                                     setNewMedicine({
                                       name: med.name,
                                       category: med.category,
                                       price: med.price.toString(),
                                       stockQuantity: med.stockQuantity.toString(),
                                       description: med.description || '',
                                       requiresPrescription: med.requiresPrescription || false,
                                       imageUrl: med.imageUrl || ''
                                     });
                                     setIsAddingMedicine(true);
                                   }}
                                 >
                                   <Edit size={14} />
                                 </Button>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                  onClick={async () => {
                                    if (confirm("Delete this medicine?")) {
                                      try {
                                        await apiClient(`/medicines/${med._id}`, {
                                          method: "DELETE"
                                        });
                                        setMedicines(medicines.filter((m: any) => m._id !== med._id));
                                        toast.success("Product removed");
                                      } catch (error) {
                                        toast.error("Failed to delete");
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-16 text-center border border-gray-100 rounded-3xl bg-gray-50/30">
                    <p className="text-gray-400 font-medium italic">No medicines in stock. Click "Add Product" to begin.</p>
                  </div>
                )}
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
