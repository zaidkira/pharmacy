import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Stethoscope, 
  User, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle,
  Search,
  Filter,
  ShieldCheck,
  Star
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";

export function PatientConsultations() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [bookingData, setBookingData] = useState({ date: "", time: "", reason: "" });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const allUsers = await apiClient("/auth/users");
      const doctorList = allUsers.filter((u: any) => u.role === "DOCTOR");
      setDoctors(doctorList);
      
      const appts = await apiClient("/appointments/patient");
      setAppointments(appts);
    } catch (error: any) {
      toast.error(error.message || "Failed to load consultations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    try {
      await apiClient("/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          ...bookingData
        }),
      });
      toast.success("Appointment booked successfully!");
      setIsBookModalOpen(false);
      setBookingData({ date: "", time: "", reason: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to book appointment");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0F766E] mb-2 tracking-tight">Tele-Consultations</h1>
          <p className="text-xl text-gray-500">Book appointments with certified healthcare professionals.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Doctor Listing */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center gap-4 bg-teal-50/50 p-2 rounded-2xl border border-teal-100">
              <div className="flex-1 relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F766E]/50" />
                 <Input 
                   placeholder="Search by name or specialization..." 
                   className="pl-12 h-14 bg-white border-none rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                 />
              </div>
              <Button variant="outline" className="h-14 w-14 rounded-xl border-teal-100 bg-white">
                 <Filter className="w-6 h-6 text-[#0F766E]" />
              </Button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                [1,2,3,4].map(i => <Card key={i} className="h-64 bg-gray-100 animate-pulse rounded-[2rem]" />)
              ) : doctors.length === 0 ? (
                <div className="col-span-2 py-20 text-center">
                   <Stethoscope className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                   <p className="text-gray-400 font-bold">No doctors available at the moment.</p>
                </div>
              ) : (
                doctors.map((doc) => (
                  <Card key={doc._id} className="p-8 rounded-[2rem] border-2 border-[#B7D1CC]/30 hover:border-[#0F766E] transition-all group hover:shadow-xl hover:shadow-teal-900/5 bg-white">
                    <div className="flex items-start gap-6 mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-[#B7D1CC]/20 flex items-center justify-center relative">
                        <User className="w-10 h-10 text-[#0F766E]" />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#0F766E] rounded-xl flex items-center justify-center border-4 border-white shadow-lg">
                           <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <h3 className="text-xl font-bold text-gray-800 truncate">Dr. {doc.name}</h3>
                        </div>
                        <Badge variant="outline" className="text-[#0F766E] border-[#B7D1CC] rounded-full px-3">
                           {doc.specialization || 'General Practitioner'}
                        </Badge>
                        <div className="flex items-center gap-1 mt-2 text-orange-500">
                           <Star className="w-3 h-3 fill-current" />
                           <Star className="w-3 h-3 fill-current" />
                           <Star className="w-3 h-3 fill-current" />
                           <Star className="w-3 h-3 fill-current" />
                           <Star className="w-3 h-3 fill-current" />
                           <span className="text-xs text-gray-400 font-bold ml-1">5.0 (120 reviews)</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-4 rounded-2xl">
                          <div className="flex flex-col">
                             <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">License</span>
                             <span className="font-bold text-gray-700">{doc.licenseNumber || 'LIC-VERIFIED'}</span>
                          </div>
                          <div className="flex flex-col text-right">
                             <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Next Slot</span>
                             <span className="font-bold text-teal-600">Today, 4:00 PM</span>
                          </div>
                       </div>

                       <Dialog open={isBookModalOpen && selectedDoctor?._id === doc._id} onOpenChange={(open) => {
                          if (open) setSelectedDoctor(doc);
                          setIsBookModalOpen(open);
                       }}>
                          <DialogTrigger asChild>
                             <Button className="w-full bg-[#0F766E] hover:bg-[#0d6560] h-14 rounded-2xl font-bold text-lg shadow-lg shadow-teal-900/10">
                                Book Consultation
                             </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[450px] rounded-[2rem]">
                             <DialogHeader>
                                <DialogTitle className="text-2xl text-[#0F766E]">Schedule Appointment</DialogTitle>
                             </DialogHeader>
                             <form onSubmit={handleBookAppointment} className="space-y-6 py-4">
                                <div className="space-y-2">
                                   <Label>Select Date</Label>
                                   <Input 
                                     type="date" 
                                     required 
                                     value={bookingData.date}
                                     onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                                     className="rounded-xl h-12"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <Label>Select Time</Label>
                                   <Input 
                                     type="time" 
                                     required 
                                     value={bookingData.time}
                                     onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                                     className="rounded-xl h-12"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <Label>Reason for Visit</Label>
                                   <textarea 
                                     className="w-full min-h-[100px] p-4 rounded-xl border-2 border-gray-100 focus:border-[#0F766E] outline-none transition-all"
                                     placeholder="Symptoms, follow-up, etc."
                                     required
                                     value={bookingData.reason}
                                     onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}
                                   />
                                </div>
                                <DialogFooter>
                                   <Button type="submit" className="w-full bg-[#0F766E] h-14 rounded-xl text-lg font-bold shadow-lg">
                                      Confirm Booking
                                   </Button>
                                </DialogFooter>
                             </form>
                          </DialogContent>
                       </Dialog>
                    </div>
                  </Card>
                ))
              )}
           </div>
        </div>

        {/* My Appointments Sidebar */}
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">My Schedule</h2>
              <Badge className="bg-[#B7D1CC] text-[#0F766E] border-none font-bold">{appointments.length}</Badge>
           </div>

           <Card className="p-8 rounded-[2rem] border-none shadow-xl shadow-teal-900/5 bg-white space-y-6">
              {appointments.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                   <Calendar className="w-12 h-12 text-gray-100 mx-auto" />
                   <p className="text-gray-400 text-sm italic">No upcoming appointments.</p>
                </div>
              ) : (
                appointments.map((apt) => (
                  <div key={apt._id} className="relative pl-6 border-l-4 border-[#0F766E]/20 hover:border-[#0F766E] transition-colors pb-6 last:pb-0">
                     <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-[#0F766E] border-4 border-white shadow-sm" />
                     <p className="text-xs font-black text-[#0F766E] uppercase tracking-widest mb-1">{new Date(apt.date).toLocaleDateString()} • {apt.time}</p>
                     <p className="font-bold text-gray-800">Dr. {apt.doctorId?.name || "Unknown Doctor"}</p>
                     <p className="text-xs text-gray-500 mb-3">{apt.reason || 'General Checkup'}</p>
                     <Badge className={`rounded-full px-2 py-0.5 text-[10px] ${
                        apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'
                     }`}>
                        {apt.status}
                     </Badge>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full rounded-xl border-[#B7D1CC] text-[#0F766E] font-bold h-12 mt-4">
                 View History
              </Button>
           </Card>

           <Card className="p-8 rounded-[2rem] bg-[#0F766E] text-white shadow-2xl shadow-teal-900/20 relative overflow-hidden">
              <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-2">Emergency?</h3>
                 <p className="text-teal-50/70 text-sm mb-6">If you are experiencing a life-threatening situation, please call emergency services immediately.</p>
                 <Button className="w-full bg-white text-[#0F766E] hover:bg-teal-50 font-black h-12 rounded-xl">
                    Call 911 / 15
                 </Button>
              </div>
              <Activity className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-10" />
           </Card>
        </div>
      </div>
    </div>
  );
}

import { Activity } from "lucide-react";
