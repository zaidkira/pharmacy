import { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { 
  Users, 
  Calendar, 
  Clipboard, 
  Clock, 
  Plus, 
  Send, 
  CheckCircle, 
  Search,
  Filter,
  MoreVertical,
  Stethoscope,
  Activity,
  User,
  Mail,
  Upload,
  FileText
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { apiClient } from "../../api/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../context/AuthContext";

export function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [medications, setMedications] = useState([{ name: "", dosage: "", frequency: "", duration: "" }]);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState({
    patientsToday: 0,
    completedConsultations: 0,
    pendingAppointments: 0,
    prescriptionsSent: 0
  });

  // Email prescription state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailPatient, setEmailPatient] = useState("");
  const [emailDiagnosis, setEmailDiagnosis] = useState("");
  const [emailNotes, setEmailNotes] = useState("");
  const [emailFileUrl, setEmailFileUrl] = useState("");
  const [emailFileUploading, setEmailFileUploading] = useState(false);
  const [emailMedications, setEmailMedications] = useState([{ name: "", dosage: "", frequency: "", duration: "" }]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient("/appointments/doctor/today");
      setAppointments(data);
      
      const statsData = await apiClient("/appointments/doctor/stats");
      setStats(statsData);
    } catch (error: any) {
      toast.error(error.message || "Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleAddMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "" }]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, field: string, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("prescription", file);

    setIsUploading(true);
    try {
      // Use raw fetch for FormData to set Content-Type correctly
      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Fetch base URL dynamically in production
      const baseApi = window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1")
        ? "http://localhost:5000/api"
        : `${window.location.origin}/api`;

      const res = await fetch(`${baseApi}/upload`, {
        method: "POST",
        headers,
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setFileUrl(data.url);
      toast.success("File uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      await apiClient("/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          patientId: selectedAppointment.patientId?._id,
          medications,
          diagnosis,
          notes,
          appointmentId: selectedAppointment._id,
          fileUrl
        }),
      });
      toast.success("Prescription sent successfully");
      setIsPrescriptionModalOpen(false);
      setMedications([{ name: "", dosage: "", frequency: "", duration: "" }]);
      setDiagnosis("");
      setNotes("");
      setFileUrl("");
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.message || "Failed to send prescription");
    }
  };

  const handleEmailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("prescription", file);
    setEmailFileUploading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const baseApi = window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1")
        ? "http://localhost:5000/api"
        : `${window.location.origin}/api`;
      const res = await fetch(`${baseApi}/upload`, { method: "POST", headers, body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setEmailFileUrl(data.url);
      toast.success("File uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "File upload failed");
    } finally {
      setEmailFileUploading(false);
    }
  };

  const handleSendByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailPatient) {
      toast.error("Please enter a patient email");
      return;
    }
    setIsSendingEmail(true);
    try {
      const result = await apiClient("/prescriptions/send-by-email", {
        method: "POST",
        body: JSON.stringify({
          patientEmail: emailPatient,
          medications: emailMedications.filter(m => m.name.trim()),
          diagnosis: emailDiagnosis,
          notes: emailNotes,
          fileUrl: emailFileUrl || undefined
        }),
      });
      toast.success(`Certificate sent to ${result.patientName || emailPatient}!`);
      setIsEmailModalOpen(false);
      setEmailPatient("");
      setEmailDiagnosis("");
      setEmailNotes("");
      setEmailFileUrl("");
      setEmailMedications([{ name: "", dosage: "", frequency: "", duration: "" }]);
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.message || "Failed to send certificate");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleEmailMedicationChange = (index: number, field: string, value: string) => {
    const updated = [...emailMedications];
    updated[index] = { ...updated[index], [field]: value };
    setEmailMedications(updated);
  };

  const handleCompleteAppointment = async (id: string) => {
     try {
       await apiClient(`/appointments/${id}/status`, {
         method: "PUT",
         body: JSON.stringify({ status: "COMPLETED" }),
       });
       toast.success("Appointment marked as completed");
       fetchAppointments();
     } catch (error: any) {
       toast.error(error.message || "Failed to update status");
     }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#0F766E] to-[#2F8F7E] p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Welcome back, Dr. {user?.name}</h1>
          <p className="text-xl text-teal-50 opacity-90">You have {appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'PENDING').length} patients waiting for you today.</p>
        </div>
        <div className="flex gap-4 relative z-10">
           <Card className="bg-white/20 backdrop-blur-md border-none p-4 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                 <Calendar className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-xs opacity-70">Today's Date</p>
                 <p className="font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
           </Card>
        </div>
        <Stethoscope className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-white opacity-5 rotate-12" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Today's Patients", value: stats.patientsToday.toString(), icon: Users, color: "#0F766E" },
          { title: "Completed Consultations", value: stats.completedConsultations.toString(), icon: CheckCircle, color: "#2F8F7E" },
          { title: "Pending Appointments", value: stats.pendingAppointments.toString(), icon: Clock, color: "#5FA79A" },
          { title: "Prescriptions Sent", value: stats.prescriptionsSent.toString(), icon: Clipboard, color: "#0F766E" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 rounded-2xl border-2 border-[#B7D1CC]/30 hover:border-[#0F766E]/50 transition-all group shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-[#B7D1CC]/20 group-hover:bg-[#0F766E]/10 transition-colors">
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#0F766E' }}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0F766E' }}>
              <Clock className="w-6 h-6" />
              Today's Schedule & Patient Queue
            </h2>
          </div>

          <Card className="rounded-[2rem] overflow-hidden border-2 border-[#B7D1CC]/30 shadow-sm">
            <div className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#B7D1CC]/10 border-b border-[#B7D1CC]/30">
                    <th className="text-left p-6 font-semibold" style={{ color: '#0F766E' }}>Patient</th>
                    <th className="text-left p-6 font-semibold" style={{ color: '#0F766E' }}>Time</th>
                    <th className="text-left p-6 font-semibold" style={{ color: '#0F766E' }}>Status</th>
                    <th className="text-right p-6 font-semibold" style={{ color: '#0F766E' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-12 text-center text-gray-400">Loading appointments...</td></tr>
                  ) : appointments.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-gray-400">No appointments for today.</td></tr>
                  ) : (
                    appointments.map((apt) => (
                      <tr key={apt._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E] font-bold">
                              {(apt.patientId?.name || "Patient").charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{apt.patientId?.name || "Unknown Patient"}</p>
                              <p className="text-xs text-gray-500">{apt.reason || 'General Checkup'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4 text-[#2F8F7E]" />
                              <span className="font-medium">{apt.time}</span>
                           </div>
                        </td>
                        <td className="p-6">
                          <Badge className={`rounded-full px-3 py-1 ${
                            apt.status === 'COMPLETED' 
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                              : apt.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}>
                            {apt.status}
                          </Badge>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {apt.status !== 'COMPLETED' && (
                                <Dialog open={isPrescriptionModalOpen && selectedAppointment?._id === apt._id} onOpenChange={(open) => {
                                  if (open) setSelectedAppointment(apt);
                                  setIsPrescriptionModalOpen(open);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button className="bg-[#0F766E] hover:bg-[#0d6560] text-white rounded-xl">
                                      <Plus className="w-4 h-4 mr-2" />
                                      Prescribe
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[600px] rounded-[2rem]">
                                    <DialogHeader>
                                      <DialogTitle className="text-2xl text-[#0F766E] flex items-center gap-2">
                                        <Clipboard className="w-6 h-6" />
                                        Create Prescription
                                      </DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSendPrescription} className="space-y-6 py-4">
                                      <div className="bg-teal-50 p-4 rounded-2xl flex items-center gap-4 border border-teal-100">
                                         <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                                            <User className="w-6 h-6 text-[#0F766E]" />
                                         </div>
                                          <div>
                                             <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider">Patient</p>
                                             <p className="font-bold text-[#0F766E]">{selectedAppointment?.patientId?.name || "Unknown Patient"}</p>
                                          </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="diagnosis" className="text-gray-700 font-semibold">Diagnosis</Label>
                                        <Input
                                          id="diagnosis"
                                          placeholder="e.g. Acute Migraine, Hypertension"
                                          value={diagnosis}
                                          onChange={(e) => setDiagnosis(e.target.value)}
                                          required
                                          className="rounded-xl"
                                        />
                                      </div>

                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                          <Label className="text-lg font-bold text-gray-700">Medications</Label>
                                          <Button type="button" onClick={handleAddMedication} variant="outline" size="sm" className="rounded-xl border-[#B7D1CC]">
                                            <Plus className="w-4 h-4 mr-1" /> Add
                                          </Button>
                                        </div>
                                        
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                          {medications.map((med, idx) => (
                                            <Card key={idx} className="p-4 rounded-2xl border-[#B7D1CC]/50 bg-gray-50/50">
                                              <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2 col-span-2">
                                                  <Label className="text-xs font-semibold text-gray-500">Medicine Name</Label>
                                                  <Input 
                                                    placeholder="Paracetamol 500mg" 
                                                    value={med.name}
                                                    onChange={(e) => handleMedicationChange(idx, 'name', e.target.value)}
                                                    required
                                                    className="rounded-xl"
                                                  />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-xs font-semibold text-gray-500">Dosage</Label>
                                                  <Input 
                                                    placeholder="1 tablet" 
                                                    value={med.dosage}
                                                    onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                                                    required
                                                    className="rounded-xl"
                                                  />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-xs font-semibold text-gray-500">Frequency</Label>
                                                  <Input 
                                                    placeholder="3 times a day" 
                                                    value={med.frequency}
                                                    onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                                                    required
                                                    className="rounded-xl"
                                                  />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-xs font-semibold text-gray-500">Duration</Label>
                                                  <Input 
                                                    placeholder="5 days" 
                                                    value={med.duration}
                                                    onChange={(e) => handleMedicationChange(idx, 'duration', e.target.value)}
                                                    required
                                                    className="rounded-xl"
                                                  />
                                                </div>
                                                {medications.length > 1 && (
                                                  <div className="flex items-end">
                                                    <Button type="button" onClick={() => handleRemoveMedication(idx)} variant="ghost" className="text-red-500 hover:bg-red-50 rounded-xl w-full">
                                                      Remove
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                            </Card>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-lg font-bold text-gray-700">Special Instructions</Label>
                                        <textarea 
                                          className="w-full min-h-[100px] p-4 rounded-2xl border-2 border-gray-100 focus:border-[#0F766E] outline-none transition-all resize-none"
                                          placeholder="Take after meals..."
                                          value={notes}
                                          onChange={(e) => setNotes(e.target.value)}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-lg font-bold text-gray-700">Attach Lab Scan / Medical File</Label>
                                        <div className="flex items-center gap-4">
                                          <Input 
                                            type="file" 
                                            accept=".pdf,.jpg,.jpeg,.png" 
                                            onChange={handleFileUpload} 
                                            className="rounded-xl border-[#B7D1CC] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-[#0F766E] hover:file:bg-teal-100 cursor-pointer"
                                          />
                                          {isUploading && <span className="text-xs text-teal-600 animate-pulse font-semibold">Uploading...</span>}
                                        </div>
                                        {fileUrl && (
                                          <p className="text-xs text-emerald-600 font-semibold mt-1">
                                            ✓ File attached successfully: <a href={fileUrl.startsWith("http") ? fileUrl : `${window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1") ? "http://localhost:5000" : window.location.origin}${fileUrl}`} target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#0F766E] hover:text-[#0d6560]">View File</a>
                                          </p>
                                        )}
                                      </div>

                                      <DialogFooter>
                                        <Button type="submit" className="w-full bg-[#0F766E] hover:bg-[#0d6560] h-14 rounded-2xl text-lg shadow-lg">
                                          <Send className="w-5 h-5 mr-2" />
                                          Finalize & Send Prescription
                                        </Button>
                                      </DialogFooter>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                             )}
                             <Button variant="ghost" size="icon" className="rounded-xl">
                                <MoreVertical className="w-5 h-5 text-gray-400" />
                             </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
           {/* Quick Actions */}
           <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                 <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
                    <DialogTrigger asChild>
                       <Button className="h-24 rounded-[1.5rem] bg-teal-50 border-2 border-teal-200 hover:bg-teal-100 flex flex-col gap-2 text-teal-700 font-bold transition-all shadow-sm">
                          <Mail className="w-6 h-6" />
                          <span className="text-xs leading-tight">Send Certificate<br/>by Email</span>
                       </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] rounded-[2rem] max-h-[90vh] overflow-y-auto">
                       <DialogHeader>
                          <DialogTitle className="text-2xl text-[#0F766E] flex items-center gap-2">
                             <Mail className="w-6 h-6" />
                             Send Certificate / Prescription by Email
                          </DialogTitle>
                       </DialogHeader>
                       <form onSubmit={handleSendByEmail} className="space-y-5 py-4">
                          {/* Patient Email */}
                          <div className="space-y-2">
                             <Label className="font-semibold text-gray-700 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[#0F766E]" />
                                Patient Email Address
                             </Label>
                             <Input
                                type="email"
                                placeholder="patient@example.com"
                                value={emailPatient}
                                onChange={(e) => setEmailPatient(e.target.value)}
                                required
                                className="rounded-xl h-12 text-lg"
                             />
                             <p className="text-xs text-gray-400">The patient must have a registered account</p>
                          </div>

                          {/* Diagnosis */}
                          <div className="space-y-2">
                             <Label className="font-semibold text-gray-700">Diagnosis / Certificate Title</Label>
                             <Input
                                placeholder="e.g. Medical Certificate, Flu Diagnosis"
                                value={emailDiagnosis}
                                onChange={(e) => setEmailDiagnosis(e.target.value)}
                                required
                                className="rounded-xl"
                             />
                          </div>

                          {/* Medications */}
                          <div className="space-y-3">
                             <div className="flex items-center justify-between">
                                <Label className="font-semibold text-gray-700">Medications (optional)</Label>
                                <Button type="button" onClick={() => setEmailMedications([...emailMedications, { name: "", dosage: "", frequency: "", duration: "" }])} variant="outline" size="sm" className="rounded-xl border-[#B7D1CC] text-xs">
                                   <Plus className="w-3 h-3 mr-1" /> Add
                                </Button>
                             </div>
                             <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                                {emailMedications.map((med, idx) => (
                                   <Card key={idx} className="p-3 rounded-xl border-[#B7D1CC]/50 bg-gray-50/50">
                                      <div className="grid grid-cols-2 gap-2">
                                         <div className="col-span-2">
                                            <Input placeholder="Medicine name" value={med.name} onChange={(e) => handleEmailMedicationChange(idx, 'name', e.target.value)} className="rounded-lg text-sm" />
                                         </div>
                                         <Input placeholder="Dosage" value={med.dosage} onChange={(e) => handleEmailMedicationChange(idx, 'dosage', e.target.value)} className="rounded-lg text-sm" />
                                         <Input placeholder="Frequency" value={med.frequency} onChange={(e) => handleEmailMedicationChange(idx, 'frequency', e.target.value)} className="rounded-lg text-sm" />
                                         <Input placeholder="Duration" value={med.duration} onChange={(e) => handleEmailMedicationChange(idx, 'duration', e.target.value)} className="rounded-lg text-sm" />
                                         {emailMedications.length > 1 && (
                                            <Button type="button" onClick={() => setEmailMedications(emailMedications.filter((_, i) => i !== idx))} variant="ghost" className="text-red-500 hover:bg-red-50 rounded-lg text-xs">
                                               Remove
                                            </Button>
                                         )}
                                      </div>
                                   </Card>
                                ))}
                             </div>
                          </div>

                          {/* File Upload */}
                          <div className="space-y-2">
                             <Label className="font-semibold text-gray-700 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-[#0F766E]" />
                                Attach File (PDF, JPG, PNG)
                             </Label>
                             <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleEmailFileUpload}
                                className="rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-[#0F766E] hover:file:bg-teal-100 cursor-pointer"
                             />
                             {emailFileUploading && <span className="text-xs text-teal-600 animate-pulse font-semibold">Uploading...</span>}
                             {emailFileUrl && <p className="text-xs text-emerald-600 font-semibold">✓ File attached successfully</p>}
                          </div>

                          {/* Notes */}
                          <div className="space-y-2">
                             <Label className="font-semibold text-gray-700">Notes / Instructions</Label>
                             <textarea
                                className="w-full min-h-[80px] p-4 rounded-2xl border-2 border-gray-100 focus:border-[#0F766E] outline-none transition-all resize-none text-sm"
                                placeholder="Special instructions, rest days, follow-up date..."
                                value={emailNotes}
                                onChange={(e) => setEmailNotes(e.target.value)}
                             />
                          </div>

                          <DialogFooter>
                             <Button
                                type="submit"
                                disabled={isSendingEmail || !emailPatient}
                                className="w-full bg-[#0F766E] hover:bg-[#0d6560] h-14 rounded-2xl text-lg shadow-lg disabled:opacity-50"
                             >
                                {isSendingEmail ? (
                                   <span className="animate-pulse">Sending...</span>
                                ) : (
                                   <><Send className="w-5 h-5 mr-2" /> Send to Patient</>  
                                )}
                             </Button>
                          </DialogFooter>
                       </form>
                    </DialogContent>
                 </Dialog>
                 <Button className="h-24 rounded-[1.5rem] bg-blue-50 border-2 border-blue-100 hover:bg-blue-100 flex flex-col gap-2 text-blue-700 font-bold transition-all shadow-sm">
                    <Clipboard className="w-6 h-6" />
                    <span>History</span>
                 </Button>
              </div>
           </div>

           {/* Patient Vitals/Highlights */}
           <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Upcoming This Week</h2>
              <Card className="p-6 rounded-[2rem] border-2 border-[#B7D1CC]/30 space-y-4">
                 {[
                   { name: "Sarah Johnson", time: "Tomorrow, 10:00 AM", type: "Follow-up" },
                   { name: "Michael Chen", time: "Thu, 2:30 PM", type: "First Visit" },
                   { name: "Emily Brown", time: "Fri, 9:15 AM", type: "Routine Check" },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E]">
                         <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="font-bold text-gray-800 truncate">{item.name}</p>
                         <p className="text-xs text-gray-500">{item.time}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">{item.type}</Badge>
                   </div>
                 ))}
                 <Button variant="link" className="w-full text-[#0F766E] font-bold">View Full Calendar</Button>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
}
