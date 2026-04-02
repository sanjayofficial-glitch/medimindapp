"use client";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pill, Heart, Shield, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <header className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-[#4CAF50]/10 p-2 rounded-lg">
            <Pill className="w-6 h-6 text-[#4CAF50]" />
          </div>
          <span className="text-xl font-bold text-gray-800">MediMind</span>
        </div>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-gray-600 hover:text-[#4CAF50]">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-lg">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto">
        <div className="bg-[#4CAF50]/10 p-4 rounded-full mb-6">
          <Heart className="w-12 h-12 text-[#4CAF50]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Never miss a dose again
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl">
          A smart medicine companion that ensures you never miss a dose — with family support and zero effort.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link to="/signup">
            <Button size="lg" className="bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl px-8 h-12 text-base font-medium shadow-lg shadow-[#4CAF50]/20">
              Create Free Account
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 text-base font-medium border-gray-300 hover:bg-gray-50">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <Shield className="w-8 h-8 text-[#4CAF50] mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Smart Reminders</h3>
            <p className="text-sm text-gray-500">Friendly, adaptive notifications that fit your routine.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <Users className="w-8 h-8 text-[#FF6B35] mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Family Support</h3>
            <p className="text-sm text-gray-500">Caregivers get notified if a dose is missed.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <Pill className="w-8 h-8 text-[#4CAF50] mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Zero Effort Setup</h3>
            <p className="text-sm text-gray-500">Scan prescriptions and auto-add medicines instantly.</p>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} MediMind. Built with care for better health.
      </footer>
    </div>
  );
};

export default Index;