import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Wallet, Plus, QrCode, Ticket, ArrowRight, History, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import LiveMap from '../components/LiveMap';

const Dashboard = () => {
  const { user, setUser } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    
    setLoading(true);
    try {
      // 1. Create order on backend
      const { data: order } = await api.post('/auth/create-razorpay-order', { amount });

      // 2. Open Razorpay checkout modal
      const options = {
        key: "rzp_test_Sstb2ptytL1nuq", // Replace with real key id later, wait actually we can just pass order id
        amount: order.amount,
        currency: order.currency,
        name: "Fare Wave",
        description: "Wallet Top Up",
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify payment on backend
            const { data: verifyData } = await api.post('/auth/verify-razorpay-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount
            });
            
            setUser(verifyData.user);
            setShowModal(false);
            setAmount('');
            alert('Money added successfully!');
          } catch (err) {
            console.error('Payment verification failed', err);
            alert('Payment verification failed.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#3b82f6" // Primary blue
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert("Payment Failed. Reason: " + response.error.description);
      });
      rzp.open();
      
    } catch (err) {
      console.error('Error creating Razorpay order', err);
      alert('Error initiating payment. Please ensure your API keys are configured in backend .env');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { name: 'Book Ticket', icon: <Ticket className="h-6 w-6" />, color: 'bg-primary', link: '/book' },
    { name: 'Scan QR', icon: <QrCode className="h-6 w-6" />, color: 'bg-secondary', link: '/scan' },
    { name: 'Ride History', icon: <History className="h-6 w-6" />, color: 'bg-gray-700', link: '/history' },
  ];

  return (
    <div className="pt-24 pb-24 px-4 max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold">
          Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{user?.name}</span> 👋
        </h1>
        <p className="text-gray-400 mt-2">Where are we heading today?</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Wallet & Actions */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Wallet Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full mix-blend-screen filter blur-[50px] opacity-50 group-hover:opacity-70 transition-opacity"></div>
            
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Fare Wallet</h2>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-400 text-sm">Available Balance</p>
              <h3 className="text-4xl font-black mt-1">₹{user?.walletBalance || 0}</h3>
            </div>

            <button 
              onClick={() => setShowModal(true)}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Money
            </button>
          </motion.div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
              >
                <Link to={action.link} className="glass p-4 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-colors group cursor-pointer h-full">
                  <div className={`p-3 rounded-xl ${action.color} bg-opacity-20 text-white group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <span className="font-medium text-sm text-center">{action.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>

        {/* Right Column: Live Map */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="glass-dark h-[500px] rounded-3xl p-6 flex flex-col relative border border-gray-700/50">
            <div className="flex justify-between items-center mb-4 z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Live Tracking <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
              </h2>
            </div>
            
            <div className="flex-1 rounded-2xl flex items-center justify-center relative">
              <LiveMap />
            </div>
          </div>
        </motion.div>

      </div>

      {/* Add Money Modal (Razorpay Mock) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-700 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              
              <h3 className="text-xl font-bold mb-2">Add Money</h3>
              <p className="text-gray-400 text-sm mb-6">Top up your Fare Wallet using Test Integration</p>

              <form onSubmit={handleAddMoney}>
                <div className="relative mb-6">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    min="1"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary text-lg font-bold"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !amount}
                  className="w-full bg-gradient-to-r from-primary to-secondary py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-opacity flex justify-center"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Processing via Razorpay...
                    </span>
                  ) : (
                    `Pay ₹${amount || 0}`
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
