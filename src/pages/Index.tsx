import { Link } from "react-router-dom";
{/* Import icons from lucide-react */}
import { Pill, ArrowRight, CheckCircle, Bell, BarChart3, Shield, Clock, Zap } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";

const Index = () => {
  const features = [
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Never miss a dose with intelligent notifications"
    },
    {
      icon: BarChart3,
      title: "Adherence Analytics",
      description: "Track your medication history and compliance"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your health data stays on your device"
    },
    {
      icon: Clock,
      title: "Easy Scheduling",
      description: "Set up your medication routine in seconds"
    },
    {
      icon: Zap,
      title: "Quick Actions",
      description: "Mark doses as taken with one click"
    },
    {
      icon: CheckCircle,
      title: "Progress Tracking",
      description: "Visualize your medication adherence over time"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/25 mb-6">
              <Pill className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
              MediMind
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Your intelligent medication companion. Track, remind, and analyze your medication routine with beautiful simplicity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 md:mt-10">
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto h-12 px-8 text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 border-0"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto h-12 px-8 text-base border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-20">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mb-4 group-hover:from-emerald-500 group-hover:to-teal-500 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl shadow-emerald-500/25">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to take control of your health?</h2>
            <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
              Join thousands of users who trust MediMind to manage their medications. Start your free journey today.
            </p>
            <Link to="/signup">
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-12 px-8 text-base bg-white text-emerald-700 hover:bg-gray-50 shadow-lg"
              >
                Start Now — It's Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <MadeWithDyad />
    </div>
  );
};

export default Index;