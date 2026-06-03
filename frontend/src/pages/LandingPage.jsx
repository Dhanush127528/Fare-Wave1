import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, ScanLine, WalletCards, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: <ScanLine className="h-8 w-8 text-primary" />,
      title: 'QR Smart Travel',
      description: 'Generate instant QR tickets and check-in/out seamlessly.',
    },
    {
      icon: <WalletCards className="h-8 w-8 text-secondary" />,
      title: 'Fintech Wallet',
      description: 'Auto-deduct fares and earn FareWave reward coins.',
    },
    {
      icon: <MapPin className="h-8 w-8 text-green-500" />,
      title: 'Live Tracking',
      description: 'Track your bus in real-time with animated map updates.',
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-yellow-500" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security for your data and payments.',
    },
  ];

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-20 relative">
        <div className="absolute inset-0 -z-10 flex justify-center items-center opacity-20">
          <div className="w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
          <div className="w-96 h-96 bg-secondary rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
        >
          Smart Mobility,<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Reimagined.
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
        >
          Join the future of transport. AI-powered tracking, instant QR ticketing, and seamless payments all in one smart ecosystem.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link
            to="/auth"
            className="px-8 py-4 rounded-full bg-white text-gray-900 font-bold text-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group"
          >
            Get Started
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-4 rounded-full glass border border-gray-600 text-white font-bold text-lg hover:bg-gray-800/50 transition-all">
            Meet Rexa AI
          </button>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="mt-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">Why choose Fare Wave?</h2>
          <p className="text-gray-400 mt-4">Built for scale, designed for you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-dark p-6 rounded-2xl hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="mb-4 bg-gray-800/50 w-16 h-16 rounded-xl flex items-center justify-center border border-gray-700">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
