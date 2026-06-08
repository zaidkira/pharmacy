import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Package } from "lucide-react";

import { apiClient } from "../api/client";
import { toast } from "sonner";

export function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER",
    specialization: "",
    licenseNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          specialization: formData.role === "DOCTOR" ? formData.specialization : undefined,
          licenseNumber: formData.role === "DOCTOR" ? formData.licenseNumber : undefined,
        }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animate-fade-in" style={{ backgroundColor: '#B7D1CC' }}>
      <Card className="w-full max-w-md p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.jpg" alt="PharmaSmart" className="w-24 h-24 object-contain mb-2 rounded-2xl shadow-sm" />
          <h1 className="text-3xl font-bold" style={{ color: '#0F766E' }}>
            Create Account
          </h1>
          <p className="text-gray-600 mt-2 text-center">
            Join MediCare+ and start managing your health
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="h-12 text-lg border-2 focus:border-[#0F766E] rounded-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              className="h-12 text-lg border-2 focus:border-[#0F766E] rounded-lg"
              required
            />
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "CUSTOMER" })}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                formData.role === "CUSTOMER" 
                ? "bg-[#0F766E] text-white shadow-md" 
                : "text-gray-500 hover:text-[#0F766E]"
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "DOCTOR" })}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                formData.role === "DOCTOR" 
                ? "bg-[#0F766E] text-white shadow-md" 
                : "text-gray-500 hover:text-[#0F766E]"
              }`}
            >
              Doctor
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "PHARMACY_OWNER" })}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                formData.role === "PHARMACY_OWNER" 
                ? "bg-[#0F766E] text-white shadow-md" 
                : "text-gray-500 hover:text-[#0F766E]"
              }`}
            >
              Pharmacy
            </button>
          </div>

          {formData.role === "DOCTOR" && (
            <div className="space-y-4 border-l-4 border-[#0F766E] pl-3 py-1 bg-[#f0f7f6] rounded-r-lg">
              <div className="space-y-2">
                <Label htmlFor="specialization" className="text-gray-700 font-semibold">Specialization</Label>
                <Input
                  id="specialization"
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Cardiology, General Medicine"
                  className="h-10 text-base border focus:border-[#0F766E] rounded-lg"
                  required={formData.role === "DOCTOR"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber" className="text-gray-700 font-semibold">License Number</Label>
                <Input
                  id="licenseNumber"
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="e.g. LIC-12345"
                  className="h-10 text-base border focus:border-[#0F766E] rounded-lg"
                  required={formData.role === "DOCTOR"}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="h-12 text-lg border-2 focus:border-[#0F766E] rounded-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="h-12 text-lg border-2 focus:border-[#0F766E] rounded-lg"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg bg-[#0F766E] hover:bg-[#0d6560] text-white rounded-lg"
          >
            Create Account
          </Button>

          <div className="text-center">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="hover:underline" style={{ color: '#0F766E' }}>
              Sign in
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
