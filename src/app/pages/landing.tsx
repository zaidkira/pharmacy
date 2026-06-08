import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { MapPin, Search, Package, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [user, navigate]);
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="PharmaSmart" className="w-10 h-10 object-contain rounded-lg" />
            <span className="text-xl" style={{ color: '#0F766E' }}>MediCare+</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-100">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-[#0F766E] hover:bg-[#0d6560] text-white">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#B7D1CC' }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl leading-tight" style={{ color: '#0F766E' }}>
              Your Health, Our Priority
            </h1>
            <p className="text-xl text-gray-700">
              Find nearby pharmacies, search for medicines, and order health packs for chronic diseases – all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="bg-[#0F766E] hover:bg-[#0d6560] text-white text-lg px-8 py-6 h-auto"
                >
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/dashboard/medicines">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 text-lg px-8 py-6 h-auto"
                  style={{ borderColor: '#0F766E', color: '#0F766E' }}
                >
                  <Search className="mr-2 w-5 h-5" />
                  Find Medicine
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1671108503276-1d3d5ab23a3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBwaGFybWFjeSUyMG1lZGljaW5lc3xlbnwxfHx8fDE3NzM3ODAwNDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Modern pharmacy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4" style={{ color: '#0F766E' }}>
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">
              Simple, accessible, and easy to use healthcare solutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Nearby Pharmacies */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#5FA79A] rounded-2xl">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: '#5FA79A' }}>
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl mb-4" style={{ color: '#0F766E' }}>
                Nearby Pharmacies
              </h3>
              <p className="text-gray-600 text-lg mb-6">
                Find pharmacies near you with real-time availability and directions. See which ones are open now.
              </p>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1666886573452-9dc8ce8f5cc5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwbWVkaWNhbCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NzM2OTMyNDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Healthcare professional"
                className="w-full h-48 object-cover rounded-xl"
              />
            </Card>

            {/* Feature 2: Medicine Search */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#5FA79A] rounded-2xl">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: '#2F8F7E' }}>
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl mb-4" style={{ color: '#0F766E' }}>
                Medicine Search
              </h3>
              <p className="text-gray-600 text-lg mb-6">
                Search thousands of medicines with filters for price and availability. Get the best deals instantly.
              </p>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1646392206581-2527b1cae5cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2F0aW9uJTIwcGlsbHMlMjBwcmVzY3JpcHRpb258ZW58MXx8fHwxNzczNzgwMDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Medication pills"
                className="w-full h-48 object-cover rounded-xl"
              />
            </Card>

            {/* Feature 3: Health Packs */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#5FA79A] rounded-2xl">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: '#0F766E' }}>
                <Package className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl mb-4" style={{ color: '#0F766E' }}>
                Health Packs
              </h3>
              <p className="text-gray-600 text-lg mb-6">
                Specialized packs for chronic conditions like diabetes and asthma. Everything you need in one package.
              </p>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1635367216109-aa3353c0c22e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGglMjB3ZWxsbmVzcyUyMGNhcmV8ZW58MXx8fHwxNzczNzgwMDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Health and wellness"
                className="w-full h-48 object-cover rounded-xl"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#8FB9B0' }}>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl" style={{ color: '#0F766E' }}>
            Ready to take control of your health?
          </h2>
          <p className="text-xl text-gray-700">
            Join thousands of users who trust MediCare+ for their healthcare needs
          </p>
          <Link to="/signup">
            <Button 
              size="lg" 
              className="bg-[#0F766E] hover:bg-[#0d6560] text-white text-lg px-8 py-6 h-auto mt-4"
            >
              Start Now – It's Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="PharmaSmart" className="w-10 h-10 object-contain rounded-lg" />
              <span className="text-xl" style={{ color: '#0F766E' }}>MediCare+</span>
            </div>
            <p className="text-gray-600">
              Your trusted online pharmacy platform for all your healthcare needs.
            </p>
          </div>
          
          <div>
            <h4 className="mb-4" style={{ color: '#0F766E' }}>Product</h4>
            <ul className="space-y-2">
              <li><Link to="/dashboard/pharmacies" className="text-gray-600 hover:text-[#0F766E]">Pharmacies</Link></li>
              <li><Link to="/dashboard/medicines" className="text-gray-600 hover:text-[#0F766E]">Medicines</Link></li>
              <li><Link to="/dashboard/health-packs" className="text-gray-600 hover:text-[#0F766E]">Health Packs</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="mb-4" style={{ color: '#0F766E' }}>Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-[#0F766E]">About Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0F766E]">Contact</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0F766E]">Careers</a></li>
              <li><Link to="/admin" className="text-gray-600 hover:text-[#0F766E]">Admin Portal</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="mb-4" style={{ color: '#0F766E' }}>Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-[#0F766E]">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0F766E]">Terms of Service</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0F766E]">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
          <p>&copy; 2026 MediCare+. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}