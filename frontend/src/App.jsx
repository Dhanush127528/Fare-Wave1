import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import BookTicket from './pages/BookTicket';
import ScanQR from './pages/ScanQR';
import RideHistory from './pages/RideHistory';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-primary selection:text-white">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/book" element={<BookTicket />} />
              <Route path="/scan" element={<ScanQR />} />
              <Route path="/history" element={<RideHistory />} />
            </Route>
          </Routes>
        </main>
        
        {/* Global Chatbot Widget */}
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;
