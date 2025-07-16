import React from 'react';
import { Shield, Clock, Users } from 'lucide-react';
import { Button } from '../components/Button';
import { AnimatedGridPattern } from '../components/ui/animated-grid-pattern';
import { cn } from '../lib/utils';

export function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-4 lg:px-8 overflow-hidden">
        <div className="mx-auto max-w-2xl py-4 sm:py-4 lg:py-4">
          <div className="text-center relative z-10">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Non-Emergency Transportation Services
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Reliable, safe, and comfortable transportation for medical appointments, therapy sessions, and other non-emergency needs.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {/* Button removed */}
            </div>
          </div>
        </div>
        
        {/* Animated Grid Pattern Background */}
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className={cn(
            "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-[-10%] h-[150%]",
          )}
        />
      </div>
      
      {/* Hero Image */}
      <div className="w-full flex justify-center py-4 bg-white">
        <img 
          src="/JA-NEMT-Image.jpg" 
          alt="Non-emergency transportation services showing vehicles and caregivers" 
          className="w-1/2 h-auto object-contain mx-auto" 
        />
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-8 sm:py-8 lg:py-8 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Why Choose Us</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for reliable transportation
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none flex justify-center items-center">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Shield className="h-5 w-5 flex-none text-blue-600" />
                  Safe & Secure
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Fully licensed and insured transportation services with experienced drivers.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Clock className="h-5 w-5 flex-none text-blue-600" />
                  Reliable Service
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Punctual pickups and drop-offs with real-time ride tracking.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Users className="h-5 w-5 flex-none text-blue-600" />
                  Professional Care
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Trained staff providing compassionate and professional assistance.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Subtle background pattern for features section */}
        <AnimatedGridPattern
          numSquares={15}
          maxOpacity={0.05}
          duration={4}
          repeatDelay={2}
          className={cn(
            "[mask-image:linear-gradient(to_bottom,transparent,white,transparent)]",
            "opacity-70",
          )}
        />
      </div>
    </div>
  );
}
