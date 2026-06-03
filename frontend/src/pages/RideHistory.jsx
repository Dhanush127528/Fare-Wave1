import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axiosConfig';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, MapPin, Navigation, IndianRupee, Trophy } from 'lucide-react';

const RideHistory = () => {
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('monthly');

  const chartData = useMemo(() => {
    if (!history.length) return [];
    const completed = history.filter(r => r.status === 'Completed');
    const dataMap = {};

    completed.forEach(ride => {
      const date = new Date(ride.createdAt || ride.checkInTime);
      let key;
      if (timeframe === 'daily') {
        key = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      } else if (timeframe === 'weekly') {
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const dayOfMonth = date.getDate();
        const weekNum = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);
        key = `Week ${weekNum}, ${date.toLocaleDateString('default', { month: 'short' })}`;
      } else {
        key = date.toLocaleDateString('default', { month: 'short' });
      }

      if (!dataMap[key]) dataMap[key] = { name: key, spent: 0 };
      dataMap[key].spent += ride.fare || 0;
    });

    return Object.values(dataMap);
  }, [history, timeframe]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, analyticsRes] = await Promise.all([
          api.get('/rides/history'),
          api.get('/rides/analytics')
        ]);
        setHistory(historyRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Error fetching ride data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto min-h-screen space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold mb-2">Ride Analytics</h2>
        <p className="text-gray-400">Your travel insights and history.</p>
      </motion.div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-dark p-6 rounded-3xl border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Total Rides</p>
            <h3 className="text-3xl font-bold text-white">{analytics.totalRides}</h3>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-dark p-6 rounded-3xl border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Total Spent</p>
            <h3 className="text-3xl font-bold text-primary flex items-center"><IndianRupee className="h-5 w-5"/>{analytics.totalSpent}</h3>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-dark p-6 rounded-3xl border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Distance Covered</p>
            <h3 className="text-3xl font-bold text-secondary">{analytics.totalDistance} km</h3>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass p-6 rounded-3xl border border-yellow-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500 rounded-full mix-blend-screen filter blur-[50px] opacity-20"></div>
            <p className="text-yellow-500/80 text-sm mb-1 font-medium flex items-center gap-1"><Trophy className="h-4 w-4"/> Coins Earned</p>
            <h3 className="text-3xl font-bold text-yellow-500">{analytics.coinsEarned}</h3>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 glass-dark p-6 rounded-3xl border border-gray-700/50 h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Spending Trends</h3>
            <div className="flex bg-gray-800 rounded-lg p-1">
              {['daily', 'weekly', 'monthly'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${timeframe === tf ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          {chartData?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '12px'}} />
                <Bar dataKey="spent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 pb-16">No data available</div>
          )}
        </motion.div>

        {/* History List */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="glass-dark p-6 rounded-3xl border border-gray-700/50 h-[400px] overflow-y-auto custom-scrollbar">
          <h3 className="text-xl font-bold mb-6">Recent Rides</h3>
          <div className="space-y-4">
            {history.length > 0 ? history.map((ride) => (
              <div key={ride._id} className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 hover:bg-gray-800 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock className="h-4 w-4 text-primary" />
                    {new Date(ride.checkInTime).toLocaleDateString()}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${ride.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {ride.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <div className="w-0.5 h-4 bg-gray-600 my-1"></div>
                    <Navigation className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex flex-col justify-between h-14">
                    <span className="font-medium">{ride.source}</span>
                    <span className="font-medium text-gray-400">{ride.destination}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center text-sm">
                  <span className="text-gray-400">{ride.distance} km</span>
                  <span className="font-bold text-primary flex items-center"><IndianRupee className="h-3 w-3"/>{ride.fare}</span>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-10">No rides yet.</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RideHistory;
