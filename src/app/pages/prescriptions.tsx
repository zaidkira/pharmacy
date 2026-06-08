import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Clipboard, 
  User, 
  Calendar, 
  MapPin, 
  Send, 
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  Upload
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
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prescData, pharmData] = await Promise.all([
        apiClient("/prescriptions/patient"),
        apiClient("/pharmacies")
      ]);
      setPrescriptions(prescData);
      setPharmacies(pharmData);
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendToPharmacy = async (pharmacyId: string) => {
    try {
      await apiClient("/prescriptions/send-to-pharmacy", {
        method: "POST",
        body: JSON.stringify({
          prescriptionId: selectedPrescription._id,
          pharmacyId
        }),
      });
      toast.success("Prescription sent to pharmacy!");
      setIsSendModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to send prescription");
    }
  };

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [customFileUrl, setCustomFileUrl] = useState("");
  const [customFileUploading, setCustomFileUploading] = useState(false);
  const [customDiagnosis, setCustomDiagnosis] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("");

  const handleCustomFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("prescription", file);

    setCustomFileUploading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

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
      setCustomFileUrl(data.url);
      toast.success("Document uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "File upload failed");
    } finally {
      setCustomFileUploading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFileUrl) {
      toast.error("Please upload a scan/file first");
      return;
    }
    if (!selectedPharmacyId) {
      toast.error("Please select a pharmacy");
      return;
    }

    try {
      await apiClient("/prescriptions/patient/upload-scan", {
        method: "POST",
        body: JSON.stringify({
          pharmacyId: selectedPharmacyId,
          fileUrl: customFileUrl,
          diagnosis: customDiagnosis,
          notes: customNotes
        }),
      });
      toast.success("Scan shared with pharmacy successfully!");
      setIsUploadModalOpen(false);
      setCustomFileUrl("");
      setCustomDiagnosis("");
      setCustomNotes("");
      setSelectedPharmacyId("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to share document");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-[#0F766E]">My Prescriptions</h1>
          <p className="text-xl text-gray-600">Digital prescriptions from your doctors</p>
        </div>
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0F766E] hover:bg-[#0d6560] text-white h-12 rounded-2xl px-6 shadow-lg">
              <Upload className="w-5 h-5 mr-2" />
              Upload Scan to Pharmacy
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[#0F766E] flex items-center gap-2">
                <Upload className="w-6 h-6" />
                Send Scan to Pharmacy
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCustomSubmit} className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">Select Pharmacy</Label>
                <select
                  className="w-full h-12 rounded-xl border-2 border-gray-200 px-4 focus:border-[#0F766E] outline-none"
                  value={selectedPharmacyId}
                  onChange={(e) => setSelectedPharmacyId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a pharmacy --</option>
                  {pharmacies.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name} — {p.address}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">Upload File (PDF, JPG, PNG)</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCustomFileUpload}
                  className="rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-[#0F766E] hover:file:bg-teal-100 cursor-pointer"
                  required
                />
                {customFileUploading && <span className="text-xs text-teal-600 animate-pulse font-semibold">Uploading...</span>}
                {customFileUrl && <p className="text-xs text-emerald-600 font-semibold">✓ File uploaded</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">Description (optional)</Label>
                <Input
                  placeholder="e.g. Dental X-ray, Blood Test Results"
                  value={customDiagnosis}
                  onChange={(e) => setCustomDiagnosis(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">Notes for Pharmacist (optional)</Label>
                <textarea
                  className="w-full min-h-[80px] p-4 rounded-2xl border-2 border-gray-100 focus:border-[#0F766E] outline-none transition-all resize-none"
                  placeholder="Any special instructions..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={!customFileUrl || !selectedPharmacyId}
                className="w-full bg-[#0F766E] hover:bg-[#0d6560] h-14 rounded-2xl text-lg shadow-lg disabled:opacity-50"
              >
                <Send className="w-5 h-5 mr-2" />
                Send to Pharmacy
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
           <div className="w-12 h-12 border-4 border-[#B7D1CC] border-t-[#0F766E] rounded-full animate-spin"></div>
           <p className="text-gray-500 font-medium">Fetching your medical records...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <Card className="p-16 text-center border-2 border-dashed border-[#B7D1CC] rounded-[2rem]">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clipboard className="w-10 h-10 text-gray-300" />
           </div>
           <h3 className="text-2xl font-bold text-gray-800 mb-2">No Prescriptions Yet</h3>
           <p className="text-gray-500 max-w-sm mx-auto">Your digital prescriptions will appear here once your doctor sends them to you.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {prescriptions.map((presc) => (
            <Card key={presc._id} className="p-0 overflow-hidden rounded-[2rem] border-2 border-[#B7D1CC]/30 shadow-sm hover:shadow-md transition-all">
               <div className="flex flex-col md:flex-row">
                  <div className="p-8 flex-1 space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E]">
                              <User className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Doctor</p>
                              <p className="text-xl font-bold text-[#0F766E]">Dr. {presc.doctorId.name}</p>
                           </div>
                        </div>
                        <Badge className={`rounded-full px-4 py-1 ${
                           presc.status === 'SENT_TO_PHARMACY' 
                           ? 'bg-blue-100 text-blue-700 border-blue-200' 
                           : presc.status === 'COMPLETED'
                           ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                           : 'bg-[#B7D1CC]/30 text-[#0F766E] border-[#B7D1CC]'
                        }`}>
                           {presc.status.replace(/_/g, ' ')}
                        </Badge>
                     </div>

                     <div className="space-y-4">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                           <Info className="w-4 h-4 text-[#2F8F7E]" />
                           Medications
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {presc.medications.map((med: any, i: number) => (
                              <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                 <p className="font-bold text-[#0F766E]">{med.name}</p>
                                 <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                                 <p className="text-xs text-gray-400 mt-1">Duration: {med.duration}</p>
                              </div>
                           ))}
                        </div>
                     </div>

                     {presc.fileUrl && (
                        <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-between">
                           <span className="text-xs text-teal-700 font-semibold flex items-center gap-1">
                              📎 Attached Lab Scan / Medical File
                           </span>
                           <a 
                              href={presc.fileUrl.startsWith("http") ? presc.fileUrl : `${window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1") ? "http://localhost:5000" : window.location.origin}${presc.fileUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1"
                           >
                              <ExternalLink className="w-3.5 h-3.5" /> View File
                           </a>
                        </div>
                     )}

                     <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                           <Calendar className="w-4 h-4" />
                           {new Date(presc.date).toLocaleDateString()}
                        </div>
                        {presc.pharmacyId && (
                           <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                              <MapPin className="w-4 h-4" />
                              Sent to {presc.pharmacyId.name}
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="bg-[#F8FBFA] p-8 md:w-72 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center gap-4">
                     {presc.status === 'ACTIVE' ? (
                        <Dialog open={isSendModalOpen && selectedPrescription?._id === presc._id} onOpenChange={(open) => {
                           if (open) setSelectedPrescription(presc);
                           setIsSendModalOpen(open);
                        }}>
                           <DialogTrigger asChild>
                              <Button className="w-full bg-[#0F766E] hover:bg-[#0d6560] h-14 rounded-2xl shadow-lg flex items-center justify-center gap-2">
                                 <Send className="w-5 h-5" />
                                 Send to Pharmacy
                              </Button>
                           </DialogTrigger>
                           <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
                              <DialogHeader>
                                 <DialogTitle className="text-2xl text-[#0F766E]">Choose a Pharmacy</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto pr-2">
                                 {pharmacies.map((pharmacy) => (
                                    <div 
                                       key={pharmacy._id} 
                                       className="p-4 rounded-2xl border-2 border-[#B7D1CC]/30 hover:border-[#0F766E] hover:bg-teal-50/50 cursor-pointer transition-all group"
                                       onClick={() => handleSendToPharmacy(pharmacy._id)}
                                    >
                                       <div className="flex items-center justify-between">
                                          <div>
                                             <p className="font-bold text-gray-800 group-hover:text-[#0F766E]">{pharmacy.name}</p>
                                             <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {pharmacy.address}
                                             </p>
                                          </div>
                                          <ChevronRight className="w-5 h-5 text-[#B7D1CC] group-hover:text-[#0F766E]" />
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </DialogContent>
                        </Dialog>
                     ) : (
                        <Button disabled className="w-full bg-gray-100 text-gray-400 h-14 rounded-2xl border-none">
                           <CheckCircle className="w-5 h-5 mr-2" />
                           Sent Successfully
                        </Button>
                     )}
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          const printWindow = window.open("", "_blank");
                          if (!printWindow) return;
                          printWindow.document.write(`
                            <html>
                            <head>
                              <title>Prescription - PharmaSmart</title>
                              <style>
                                body { font-family: sans-serif; padding: 40px; color: #333; }
                                .header { border-bottom: 2px solid #0F766E; padding-bottom: 20px; margin-bottom: 25px; }
                                .logo { font-size: 24px; font-weight: bold; color: #0F766E; }
                                .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
                                .doctor-info { text-align: right; }
                                .meds-table { w-full; border-collapse: collapse; margin-top: 25px; }
                                .meds-table th, .meds-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                .meds-table th { background: #f2f2f2; }
                                .notes { margin-top: 30px; font-style: italic; }
                              </style>
                            </head>
                            <body onload="window.print()">
                              <div class="header">
                                <div class="logo">PharmaSmart Digital Prescription</div>
                                <p>Date: ${new Date(presc.date).toLocaleDateString()}</p>
                              </div>
                              <div class="details">
                                <div>
                                  <h3>Patient</h3>
                                  <p>Registered Account User</p>
                                </div>
                                <div class="doctor-info">
                                  <h3>Doctor Details</h3>
                                  <p><strong>Dr. ${presc.doctorId.name}</strong></p>
                                  <p>Specialty: ${presc.doctorId.specialization || "General Medicine"}</p>
                                </div>
                              </div>
                              <h3>Medications</h3>
                              <table class="meds-table" style="width: 100%">
                                <thead>
                                  <tr>
                                    <th>Medicine Name</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Duration</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${presc.medications.map((m: any) => `
                                    <tr>
                                      <td>${m.name}</td>
                                      <td>${m.dosage}</td>
                                      <td>${m.frequency}</td>
                                      <td>${m.duration}</td>
                                    </tr>
                                  `).join("")}
                                </tbody>
                              </table>
                              ${presc.notes ? `<div class="notes"><strong>Notes:</strong> ${presc.notes}</div>` : ""}
                            </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }}
                        className="w-full h-12 rounded-2xl border-2 border-[#B7D1CC] text-[#0F766E] font-bold"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                  </div>
               </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
