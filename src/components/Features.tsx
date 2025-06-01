
import { Zap, Shield, Rocket, Users, Code, BarChart } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built for speed with optimized performance that scales with your needs."
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Enterprise-grade security with end-to-end encryption and compliance."
  },
  {
    icon: Rocket,
    title: "Easy to Deploy",
    description: "One-click deployment to any cloud provider with automatic scaling."
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Built-in collaboration tools to keep your team in sync and productive."
  },
  {
    icon: Code,
    title: "Developer Friendly",
    description: "Clean APIs, comprehensive docs, and SDKs for every major language."
  },
  {
    icon: BarChart,
    title: "Advanced Analytics",
    description: "Real-time insights and analytics to help you make data-driven decisions."
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed to help you build, deploy, and scale your applications with confidence.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover-scale"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
