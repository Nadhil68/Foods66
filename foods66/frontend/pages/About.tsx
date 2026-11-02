
import React from 'react';
import { Heart, ShieldCheck, Zap, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useStore';
import { useAuthStore } from '../store/useStore';
import { useCartStore } from '../store/useStore';
import { useNotificationStore } from '../store/useStore';

const About: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div 
      className="min-h-screen bg-cover bg-fixed bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2070')" }}
    >
      <div className="min-h-screen bg-white/90 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-orange-600 to-red-600 py-20 px-8 text-center text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-sm">About FOODS66</h1>
            <p className="text-xl opacity-95 max-w-2xl mx-auto font-medium">
              Revolutionizing food delivery with health-first, AI-driven personalization.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-16">
           {/* Mission */}
           <section className="text-center max-w-3xl mx-auto">
             <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Mission</h2>
             <p className="text-gray-600 leading-relaxed text-lg">
               At <span className="font-bold text-orange-600">FOODS66</span>, we believe that ordering food shouldn't compromise your health. 
               Our mission is to bridge the gap between delicious cravings and nutritional needs 
               by leveraging advanced <span className="font-semibold text-gray-800">Gemini AI</span> to curate personalized menus based on your unique health profile. 
               Whether you have specific dietary restrictions or just want to eat cleaner, we've got you covered.
             </p>
           </section>

           {/* Features Grid */}
           <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 bg-orange-50 rounded-2xl border border-orange-100 transition hover:shadow-md">
                 <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-5">
                    <Heart size={28} fill="currentColor" className="opacity-20 text-orange-600" />
                    <Heart size={28} className="absolute" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-800 mb-3">Health-Centric</h3>
                 <p className="text-gray-600 leading-relaxed">
                   We prioritize ingredients and cooking methods that support your well-being, 
                   offering detailed nutritional breakdowns (Calories, Protein, Carbs) for every dish so you know exactly what you're eating.
                 </p>
              </div>

              <div className="p-8 bg-blue-50 rounded-2xl border border-blue-100 transition hover:shadow-md">
                 <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-5">
                    <Zap size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-800 mb-3">AI-Powered Recommendations</h3>
                 <p className="text-gray-600 leading-relaxed">
                   Powered by Google's Gemini AI, our intelligent system analyzes your health profile (conditions, medications) 
                   to suggest safe, beneficial, and tasty food options tailored just for you.
                 </p>
              </div>
              
              <div className="p-8 bg-green-50 rounded-2xl border border-green-100 transition hover:shadow-md">
                 <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-5">
                    <ShieldCheck size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-800 mb-3">Safety Verification</h3>
                 <p className="text-gray-600 leading-relaxed">
                   Your safety is paramount. Our system performs real-time checks to ensure that the food you order doesn't conflict with 
                   any existing medical conditions or medications you've listed.
                 </p>
              </div>

              <div className="p-8 bg-purple-50 rounded-2xl border border-purple-100 transition hover:shadow-md">
                 <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-5">
                    <Globe size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-800 mb-3">Diverse Menu</h3>
                 <p className="text-gray-600 leading-relaxed">
                   From traditional South Indian delicacies to Gym-focused high-protein combos, 
                   we offer a wide variety of cuisines to suit every palate without sacrificing taste.
                 </p>
              </div>
           </div>

           {/* CTA */}
           <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to eat healthy?</h3>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">Join thousands of users who are taking control of their diet with FOODS66.</p>
                
                {user ? (
                   <Link to="/common-foods" className="inline-flex items-center bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition transform hover:scale-105 shadow-lg">
                      Explore Menu <ArrowRight size={20} className="ml-2" />
                   </Link>
                ) : (
                   <Link to="/register" className="inline-flex items-center bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition transform hover:scale-105 shadow-lg">
                      Get Started <ArrowRight size={20} className="ml-2" />
                   </Link>
                )}
              </div>
              
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 -mt-10 -ml-10 w-40 h-40 bg-orange-600 rounded-full opacity-10 blur-3xl"></div>
              <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-40 h-40 bg-blue-600 rounded-full opacity-10 blur-3xl"></div>
           </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default About;
