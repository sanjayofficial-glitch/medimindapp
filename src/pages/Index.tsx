"use client";

import { Link } from "react-router-dom";
import { Pill, ArrowRight, Shield, Clock, Activity, Heart, CheckCircle2, Users2 } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";

const Index = () => {
  const features = [
    {
      icon: Clock,
      title: "Precision Timing",
      description: "Smart reminders that adapt to your routine, ensuring you never miss a critical dose."
    },
    {
      icon: Activity,
      title: "Health Analytics",
      description: "Comprehensive tracking of your adherence patterns with professional-grade insights."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your medical data is encrypted and stored securely, giving you complete control."
    },
    {
      icon: Users2,
      title: "Family Care",
      description: "Manage medications for your entire family from a single, unified dashboard."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">MediMind</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-600">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary hover:bg-primary/90 shadow-sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Heart className="w-4 h-4" />
            <span>Trusted by healthcare professionals</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
            Your Health, <span className="text-primary">Simplified.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            The intelligent medication management platform designed for clarity, safety, and peace of mind.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-lg shadow-primary/20">
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-xl border-2">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Professional Features</h2>
            <p className="text-slate-600">Everything you need to manage your health effectively.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Why Choose MediMind?</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-left">
              {[
                "FDA-compliant database integration",
                "Real-time family synchronization",
                "Advanced adherence reporting",
                "Secure cloud backup",
                "Multi-device support",
                "24/7 AI health assistant"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">MediMind</span>
          </div>
          <MadeWithDyad />
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-primary">Privacy Policy</a>
            <a href="#" className="hover:text-primary">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;