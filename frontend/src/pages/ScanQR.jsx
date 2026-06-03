import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '../api/axiosConfig';
import { useAuthStore } from '../store/authStore';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ScanQR = () => {
  const [scanType, setScanType] = useState('check-in'); // 'check-in' or 'check-out'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuthStore();

  const handleScan = async (text) => {
    if (loading || result) return;
    
    setLoading(true);
    setError('');
    
    try {
      if (scanType === 'check-in') {
        const { data } = await api.post('/qr/check-in', { qrCode: text });
        setResult({
          success: true,
          message: 'Checked In Successfully!',
          details: `Enjoy your ride from ${data.ride.source} to ${data.ride.destination}.`
        });
        // In a real app, we might save the active ride to Zustand
      } else {
        const { data } = await api.post('/qr/check-out', { qrCode: text });
        
        // Update user state with new balance and coins
        setUser({
          ...user,
          walletBalance: data.userBalance,
          fareWaveCoins: user.fareWaveCoins + data.coins
        });

        setResult({
          success: true,
          message: 'Checked Out Successfully!',
          details: `₹${data.ride.fare} deducted. You earned ${data.coins} Coins!`
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: 'Scan Failed',
        details: err.response?.data?.message || 'Invalid QR Code'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-lg mx-auto min-h-screen flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2">Scan QR</h2>
        <p className="text-gray-400">Scan ticket to {scanType === 'check-in' ? 'board the bus' : 'exit the bus'}</p>
        
        <div className="flex bg-gray-900 rounded-lg p-1 w-max mx-auto mt-6 border border-gray-700">
          <button 
            className={`px-6 py-2 rounded-md font-medium transition-colors ${scanType === 'check-in' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => { setScanType('check-in'); setResult(null); setError(''); }}
          >
            Check In
          </button>
          <button 
            className={`px-6 py-2 rounded-md font-medium transition-colors ${scanType === 'check-out' ? 'bg-secondary text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => { setScanType('check-out'); setResult(null); setError(''); }}
          >
            Check Out
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-dark p-4 rounded-3xl overflow-hidden border border-gray-700/50"
      >
        {!result ? (
          <div className="rounded-2xl overflow-hidden relative aspect-square bg-black">
            <Scanner 
              key={scanType}
              onScan={(result) => {
                if (result && result.length > 0) {
                  handleScan(result[0].rawValue);
                }
              }} 
              onError={(error) => setError(error?.message || 'Error accessing camera')}
              components={{ tracker: true }}
              allowMultiple={true}
              scanDelay={2000}
              sound={true}
            />
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            {result.success ? (
              <CheckCircle2 className="h-20 w-20 text-green-500 mb-4" />
            ) : (
              <XCircle className="h-20 w-20 text-red-500 mb-4" />
            )}
            <h3 className="text-2xl font-bold mb-2">{result.message}</h3>
            <p className="text-gray-400 mb-8">{result.details}</p>
            
            <button 
              onClick={() => setResult(null)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
            >
              Scan Another QR
            </button>
            <Link to="/dashboard" className="text-primary mt-4 inline-block hover:underline">
              Return to Dashboard
            </Link>
          </div>
        )}
      </motion.div>
      
      {error && (
        <div className="mt-6 text-red-500 bg-red-500/10 p-4 rounded-xl text-center text-sm border border-red-500/20">
          {error}
        </div>
      )}
    </div>
  );
};

export default ScanQR;
