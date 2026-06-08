import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus, Package, CheckCircle, Loader2, FileUp, Clipboard, MapPin, User as UserIcon, Calendar, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { PharmacyPrescriptionsTab } from "../components/PharmacyPrescriptionsTab";

export function OrdersPage() {
  const { user } = useAuth();
  const { cartItems, removeFromCart, updateQuantity, clearCart, subtotal } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [digitalPrescriptions, setDigitalPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [prescriptionUrl, setPrescriptionUrl] = useState<string | null>(null);

  const requiresPrescription = cartItems.some(item => item.requiresPrescription);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("prescription", file);

    setIsUploading(true);
    try {
      const data = await apiClient("/upload", {
        method: "POST",
        body: formData
      });
      setPrescriptionUrl(data.url);
      toast.success("Prescription uploaded securely!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload prescription");
    } finally {
      setIsUploading(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const orderEndpoint = user?.role === "PHARMACY_OWNER" ? "/orders/incoming" : "/orders/myorders";
      const prescriptionEndpoint = user?.role === "PHARMACY_OWNER" ? "/prescriptions/pharmacy" : "/prescriptions/patient";
      
      const [orderData, prescData] = await Promise.all([
        apiClient(orderEndpoint),
        apiClient(prescriptionEndpoint)
      ]);
      
      setOrders(orderData);
      setDigitalPrescriptions(prescData);
    } catch (error: any) {
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    // Check if any item requires a prescription
    if (requiresPrescription && !prescriptionUrl) {
      toast.error("One or more items in your cart require a valid prescription. Please upload it below before checking out.", {
        duration: 5000,
      });
      return;
    }

    setIsCheckingOut(true);
    try {
      // Group items by pharmacyId
      const groupedByPharmacy: { [key: string]: any[] } = {};
      cartItems.forEach(item => {
        const pId = typeof item.pharmacyId === 'object' ? item.pharmacyId._id : item.pharmacyId;
        if (!groupedByPharmacy[pId]) {
          groupedByPharmacy[pId] = [];
        }
        groupedByPharmacy[pId].push(item);
      });

      // Create an order for each pharmacy
      const orderPromises = Object.entries(groupedByPharmacy).map(([pharmacyId, items]) => {
        const pharmacySubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const pharmacyShipping = pharmacySubtotal > 50 ? 0 : 5.99;
        
        const orderData = {
          pharmacyId,
          items: items.map(item => ({
            medicineId: item._id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: pharmacySubtotal + pharmacyShipping,
          prescriptionUrl: prescriptionUrl || undefined
        };

        return apiClient("/orders", {
          method: "POST",
          body: JSON.stringify(orderData)
        });
      });

      await Promise.all(orderPromises);

      toast.success(Object.keys(groupedByPharmacy).length > 1 
        ? "Orders placed successfully for all pharmacies!" 
        : "Order placed successfully!");
      
      clearCart();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Checkout failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 5.99;
  const total = subtotal + shipping;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#0F766E' }}>{user?.role === "PHARMACY_OWNER" ? "Client Orders" : "Orders & Cart"}</h1>
        <p className="text-xl text-gray-600">Manage your shopping cart and order history</p>
      </div>

      <Tabs defaultValue={user?.role === "PHARMACY_OWNER" ? "history" : "cart"} className="space-y-6">
        {(user?.role === "CUSTOMER" || user?.role === "PHARMACY_OWNER") && (
          <TabsList className={`grid w-full max-w-2xl ${user?.role === "PHARMACY_OWNER" ? 'grid-cols-2' : 'grid-cols-3'} h-12 p-1 rounded-xl bg-teal-50 border border-teal-100`}>
            {user?.role === "CUSTOMER" && (
              <TabsTrigger value="cart" className="rounded-lg data-[state=active]:bg-[#0F766E] data-[state=active]:text-white">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart ({cartItems.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-[#0F766E] data-[state=active]:text-white">
              <Package className="w-5 h-5 mr-2" />
              {user?.role === "PHARMACY_OWNER" ? "Client Orders" : "History"}
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="rounded-lg data-[state=active]:bg-[#0F766E] data-[state=active]:text-white">
              <Clipboard className="w-5 h-5 mr-2" />
              Digital Prescriptions
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="cart" className="space-y-6">
          {cartItems.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border-2 border-dashed border-teal-100">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-2xl mb-2 text-gray-600">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Explore our medicine selection and start shopping.</p>
              <Button onClick={() => window.location.href='/medicines'} className="bg-[#0F766E] hover:bg-[#0d6560] text-white rounded-xl h-12 px-8">
                Go to Shop
              </Button>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item._id} className="p-6 rounded-2xl hover:border-teal-400 transition-colors border-2 border-transparent">
                    <div className="flex gap-6">
                      <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl bg-teal-50 border border-teal-100">
                        💊
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold" style={{ color: '#0F766E' }}>{item.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100">
                                {item.pharmacyName || "Standard Pharmacy"}
                              </span>
                              <p className="text-[10px] text-gray-400">ID: {item._id.slice(-6)}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item._id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-4 bg-gray-50 p-1 rounded-xl">
                            <Button variant="ghost" size="icon" onClick={() => updateQuantity(item._id, -1)} className="w-8 h-8 rounded-lg">
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-bold text-lg">{item.quantity}</span>
                            <Button variant="ghost" size="icon" onClick={() => updateQuantity(item._id, 1)} className="w-8 h-8 rounded-lg">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-2xl font-bold" style={{ color: '#0F766E' }}>{(item.price * item.quantity).toFixed(2)} DZ</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-1">
                <Card className="p-6 rounded-2xl border-2 border-teal-600/10 shadow-xl shadow-teal-900/5">
                  <h3 className="text-2xl font-bold mb-6" style={{ color: '#0F766E' }}>Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{subtotal.toFixed(2)} DZ</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span>{shipping === 0 ? 'FREE' : `${shipping.toFixed(2)} DZ`}</span>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between text-2xl font-bold" style={{ color: '#0F766E' }}>
                      <span>Total</span>
                      <span>{total.toFixed(2)} DZ</span>
                    </div>
                  </div>

                  {requiresPrescription && (
                    <div className="mt-6 p-4 rounded-xl bg-orange-50 border border-orange-100">
                      <p className="text-sm font-bold text-orange-800 mb-2">Prescription Required</p>
                      <p className="text-xs text-orange-600 mb-3">Some items in your cart require a doctor's prescription. Please upload it here to proceed.</p>
                      
                      {!prescriptionUrl ? (
                        <div className="relative">
                          <input 
                            type="file" 
                            accept=".pdf,image/*"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                          />
                          <Button variant="outline" className="w-full bg-white border-orange-200 text-orange-700 pointer-events-none">
                            {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : <><FileUp className="w-4 h-4 mr-2" /> Select File</>}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                          <CheckCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="text-xs font-bold truncate">Uploaded successfully</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button 
                    onClick={handleCheckout} 
                    disabled={isCheckingOut || isUploading || (requiresPrescription && !prescriptionUrl) || user?.role !== "CUSTOMER"}
                    className="w-full h-14 text-lg bg-[#0F766E] hover:bg-[#0d6560] text-white rounded-xl mt-8 shadow-lg shadow-teal-900/20"
                  >
                    {isCheckingOut ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</> : "Complete Checkout"}
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">Loading your history...</div>
          ) : orders.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border-2 border-dashed border-gray-100">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <h3 className="text-2xl mb-2 text-gray-600">
                {user?.role === "PHARMACY_OWNER" ? "No incoming orders yet" : "No past orders"}
              </h3>
              <p className="text-gray-500">
                {user?.role === "PHARMACY_OWNER" 
                  ? "Orders from clients will appear here automatically." 
                  : "Your order history will appear here once you make a purchase."}
              </p>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order._id} className="p-6 rounded-2xl hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-50 rounded-xl">
                      <Package className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-teal-900 text-lg">Order #{order._id.slice(-8).toUpperCase()}</h3>
                      <p className="text-xs text-gray-400">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {user?.role === "PHARMACY_OWNER" ? "Client" : "Pharmacy"}
                      </p>
                      <p className="font-bold text-teal-700">
                        {user?.role === "PHARMACY_OWNER" 
                          ? order.userId?.name 
                          : (order.pharmacyId?.name || "Marketplace")}
                      </p>
                      {user?.role === "PHARMACY_OWNER" && (
                        <p className="text-[10px] text-gray-400 font-mono">{order.userId?.email || order.userId?.phone}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                        order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                        order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {order.status}
                      </span>
                      <p className="text-xl font-black mt-1" style={{ color: '#0F766E' }}>{order.totalAmount?.toFixed(2)} DZ</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 mt-2 pt-3 border-t border-gray-50">
                  <p>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                  {user?.role === "PHARMACY_OWNER" ? (
                    <div className="flex gap-2">
                      {order.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-8 px-4 text-xs font-bold"
                            onClick={async () => {
                              try {
                                await apiClient(`/orders/${order._id}/status`, { method: "PUT", body: JSON.stringify({ status: "PROCESSING" }) });
                                setOrders(prev => prev.map((o: any) => o._id === order._id ? { ...o, status: "PROCESSING" } : o));
                                toast.success("Order confirmed!");
                              } catch { toast.error("Failed to update order"); }
                            }}
                          >
                            ✓ Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-8 px-4 text-xs font-bold"
                            onClick={async () => {
                              try {
                                await apiClient(`/orders/${order._id}/status`, { method: "PUT", body: JSON.stringify({ status: "CANCELLED" }) });
                                setOrders(prev => prev.map((o: any) => o._id === order._id ? { ...o, status: "CANCELLED" } : o));
                                toast.info("Order cancelled.");
                              } catch { toast.error("Failed to update order"); }
                            }}
                          >
                            ✕ Cancel
                          </Button>
                        </>
                      )}
                      {order.status === "PROCESSING" && (
                        <Button
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-8 px-4 text-xs font-bold"
                          onClick={async () => {
                            try {
                              await apiClient(`/orders/${order._id}/status`, { method: "PUT", body: JSON.stringify({ status: "DELIVERED" }) });
                              setOrders(prev => prev.map((o: any) => o._id === order._id ? { ...o, status: "DELIVERED" } : o));
                              toast.success("Order marked as delivered!");
                            } catch { toast.error("Failed to update order"); }
                          }}
                        >
                          🚚 Mark Delivered
                        </Button>
                      )}
                      {(order.status === "DELIVERED" || order.status === "CANCELLED") && (
                        <span className="text-xs text-gray-400 italic">No further actions</span>
                      )}
                    </div>
                  ) : (
                    <Button variant="link" className="text-teal-600 p-0 h-4">View Invoice</Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          {user?.role === "PHARMACY_OWNER" ? (
            <PharmacyPrescriptionsTab />
          ) : isLoading ? (
            <div className="p-12 text-center text-gray-400">Loading prescriptions...</div>
          ) : digitalPrescriptions.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border-2 border-dashed border-gray-100">
              <Clipboard className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <h3 className="text-2xl mb-2 text-gray-600">No digital prescriptions</h3>
              <p className="text-gray-500 font-medium">Your digital prescriptions will appear here.</p>
            </Card>
          ) : (
            digitalPrescriptions.map((presc) => (
              <Card key={presc._id} className="p-6 rounded-2xl hover:shadow-md transition-shadow border-2 border-[#B7D1CC]/30">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E]">
                          <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Doctor</p>
                          <p className="text-lg font-bold text-[#0F766E]">Dr. {presc.doctorId?.name || "Unknown Doctor"}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full">
                         Digital Prescription
                      </Badge>
                    </div>

                    <div className="space-y-2">
                       <h4 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
                          <Info className="w-4 h-4 text-[#2F8F7E]" />
                          Medications
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {presc.medications.map((med: any, i: number) => (
                             <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="font-bold text-sm text-[#0F766E]">{med.name}</p>
                                <p className="text-xs text-gray-600">{med.dosage} • {med.frequency}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
                       <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(presc.date).toLocaleDateString()}
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                     <Button variant="outline" className="w-full h-12 rounded-xl border-2 border-[#B7D1CC] text-[#0F766E]">
                        View Details
                     </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
