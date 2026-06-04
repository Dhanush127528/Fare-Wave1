import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, IndianRupee, QrCode, ArrowRight, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axiosConfig';

const MOCK_LOCATIONS = [
  'Baiyappanahalli', 'Banashankari', 'Banaswadi', 'Bellandur', 'Bommanahalli', 
  'BTM Layout', 'Dasarahalli', 'Domlur', 'Electronic City', 'Hebbal', 
  'HSR Layout', 'Indiranagar', 'ITPL', 'Jayanagar', 'JP Nagar', 
  'Kadubeesanahalli', 'Kalyan Nagar', 'Kengeri', 'Koramangala', 'KR Market', 
  'KR Puram', 'Madiwala', 'Majestic', 'Malleshwaram', 'Marathahalli', 
  'Mekhri Circle', 'MG Road', 'Peenya', 'Rajajinagar', 'RT Nagar', 
  'Sarjapur Road', 'Shantinagar', 'Shivajinagar', 'Silk Board', 'Ulsoor', 
  'Whitefield', 'Yelahanka', 'Yeshwanthpur'
].sort();

const BookTicket = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [calculatedFare, setCalculatedFare] = useState(null);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const fetchFare = async () => {
      if (!source || !destination || source === destination) {
        setCalculatedFare(null);
        setCalculatedDistance(null);
        return;
      }
      setIsCalculating(true);
      try {
        const { data } = await api.post('/ticket/calculate-fare', { source, destination });
        setCalculatedFare(data.fare);
        setCalculatedDistance(data.distance);
      } catch (err) {
        console.error('Error calculating fare', err);
      } finally {
        setIsCalculating(false);
      }
    };
    fetchFare();
  }, [source, destination]);

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    
    if (source === destination) {
      setError('Source and destination cannot be the same.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/ticket/book', {
        source,
        destination,
        fareEstimate: calculatedFare || 50,
        distanceEstimate: calculatedDistance || 15
      });
      setTicket(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error booking ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById('ticket-qr');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40; // Add some padding
      canvas.height = img.height + 40;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20); // Draw with padding
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `FareWave-${ticket.source}-to-${ticket.destination}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto min-h-screen flex flex-col md:flex-row gap-8">
      
      {/* Booking Form */}
      <div className="w-full md:w-1/2">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark p-6 rounded-3xl border border-gray-700/50"
        >
          <h2 className="text-2xl font-bold mb-6">Book Your Ride</h2>
          
          {error && <div className="text-red-500 bg-red-500/10 p-3 rounded-lg mb-4 text-sm">{error}</div>}

          <form onSubmit={handleBook} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-gray-400 text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" /> Source
              </label>
              <select 
                value={source} 
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:outline-none focus:border-primary text-white"
                required
              >
                <option value="">Select pickup point</option>
                {MOCK_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm flex items-center gap-2">
                <Navigation className="h-4 w-4 text-red-500" /> Destination
              </label>
              <select 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:outline-none focus:border-primary text-white"
                required
              >
                <option value="">Select drop point</option>
                {MOCK_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>

            {calculatedFare !== null && !isCalculating && (
              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-xs">Real-World Driving Distance</p>
                  <p className="font-bold text-white">{calculatedDistance} km</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">Calculated Fare (₹2.5/km)</p>
                  <p className="font-bold text-primary flex items-center justify-end"><IndianRupee className="h-4 w-4"/> {calculatedFare}</p>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || isCalculating || !source || !destination || source === destination}
              className="w-full bg-gradient-to-r from-primary to-secondary py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Generating...' : isCalculating ? 'Calculating Real Route...' : 'Generate Ticket'}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Ticket / QR Preview */}
      <div className="w-full md:w-1/2">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-8 rounded-3xl h-full flex flex-col items-center justify-center relative overflow-hidden"
        >
          {ticket ? (
            <div className="text-center space-y-6 w-full">
              <div className="flex justify-between items-center text-sm text-gray-400 border-b border-gray-700 pb-4">
                <span>{ticket.source}</span>
                <ArrowRight className="h-4 w-4" />
                <span>{ticket.destination}</span>
              </div>
              
              <div className="bg-white p-4 rounded-xl inline-block">
                <QRCodeSVG id="ticket-qr" value={ticket.qrCode} size={200} />
              </div>
              
              <p className="text-gray-400 text-sm">Scan this QR when entering the bus</p>

              <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <div className="text-left">
                  <p className="text-gray-400 text-xs">Est. Fare</p>
                  <p className="font-bold text-lg text-primary flex items-center"><IndianRupee className="h-4 w-4"/> {ticket.fareEstimate}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">Est. Distance</p>
                  <p className="font-bold text-lg">{ticket.distanceEstimate} km</p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <div className="text-left w-full">
                  <p className="text-gray-400 text-xs">Status</p>
                  <p className="font-bold text-sm text-green-400 uppercase">
                    {ticket.status === 'Active' ? 'Not Checked In' : ticket.status}
                  </p>
                </div>
              </div>

              <button 
                onClick={handleDownload}
                className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-5 w-5" /> Download Ticket
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 flex flex-col items-center">
              <QrCode className="h-20 w-20 mb-4 opacity-50" />
              <p>Your ticket QR will appear here</p>
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
};

export default BookTicket;
