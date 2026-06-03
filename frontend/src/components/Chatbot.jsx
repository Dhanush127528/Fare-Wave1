import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Download, MapPin, Mic } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import { toPng } from 'html-to-image';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuthStore } from '../store/authStore';

// Sub-component for rendering the ticket bubble
const ChatTicketCard = ({ ticket }) => {
  const ticketRef = useRef(null);

  const handleDownload = async () => {
    if (ticketRef.current) {
      try {
        const dataUrl = await toPng(ticketRef.current, { pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `FareWave-Ticket-${ticket.source}-to-${ticket.destination}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Failed to download ticket:", err);
        alert("Failed to download ticket. Please try again.");
      }
    }
  };

  return (
    <div className="mt-2 w-full max-w-[250px]">
      <div 
        ref={ticketRef}
        className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg relative"
      >
        <div className="bg-primary p-3 text-center">
          <h4 className="font-bold text-white text-sm">Fare Wave e-Ticket</h4>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-300">
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm">{ticket.source}</span>
              <span>Source</span>
            </div>
            <MapPin className="h-4 w-4 text-primary" />
            <div className="flex flex-col text-right">
              <span className="font-bold text-white text-sm">{ticket.destination}</span>
              <span>Dest</span>
            </div>
          </div>
          
          <div className="flex justify-center bg-white p-2 rounded-lg">
            <QRCodeCanvas value={ticket.qrCode} size={100} />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Fare:</span>
            <span className="text-primary font-bold">₹{ticket.fareEstimate}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Status:</span>
            <span className="text-green-400 font-bold uppercase">{ticket.status === 'Active' ? 'Not Checked In' : ticket.status}</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={handleDownload}
        className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        <Download className="h-4 w-4" /> Download Ticket
      </button>
    </div>
  );
};

const Chatbot = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-open chatbot when arriving at Dashboard for the first time
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      const hasAutoOpened = sessionStorage.getItem('rexaAutoOpened');
      if (!hasAutoOpened) {
        setIsOpen(true);
        sessionStorage.setItem('rexaAutoOpened', 'true');
      }
    }
  }, [location.pathname]);

  // Update welcome message based on auth status
  useEffect(() => {
    setMessages([
      { 
        id: 1, 
        text: user ? "Hi! I'm Rexa. How can I help you today?" : "Hi! I'm Rexa. To book tickets and use my AI features, you must login first!", 
        sender: 'bot' 
      }
    ]);
  }, [user]);

  // Listen for 'open-chatbot' event from other components (like LandingPage)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handleOpen);
    return () => window.removeEventListener('open-chatbot', handleOpen);
  }, []);

  // Speech Recognition Setup
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput(currentTranscript);
        // If it's the final result, stop listening
        if (event.results[event.results.length - 1].isFinal) {
          setIsListening(false);
          recognition.stop();
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access blocked! Please click the lock/mic icon in your browser URL bar and allow microphone access.');
        } else if (event.error === 'no-speech') {
          // Do nothing, just stop
        } else {
          alert('Microphone error: ' + event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support voice recognition.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Mic start error:", err);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    if (!user) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          text: "Please login to continue chatting! Redirecting you now...", 
          sender: 'bot' 
        }]);
        setLoading(false);
        setTimeout(() => {
          navigate('/auth');
          setIsOpen(false);
        }, 2000);
      }, 1000);
      return;
    }

    try {
      const { data } = await api.post('/chatbot/message', { message: userMessage.text });
      
      const botMessage = { 
        id: Date.now() + 1, 
        text: data.reply, 
        sender: 'bot',
        ticketData: data.ticketData 
      };
      setMessages(prev => [...prev, botMessage]);

      if (data.action && data.action !== 'display_ticket') {
        setTimeout(() => {
          navigate(data.action);
          setIsOpen(false);
        }, 1500);
      }
    } catch (err) {
      const errorMessage = { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting to the network.", sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-xl hover:scale-110 transition-transform z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] glass-dark rounded-3xl shadow-2xl z-50 flex flex-col border border-gray-700/50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-gray-900/50">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 p-2 rounded-full">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Rexa AI</h3>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-900/30">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 ${msg.sender === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-transparent'}`}>
                    {msg.sender === 'bot' && (
                      <div className="bg-gray-800 text-gray-200 rounded-2xl rounded-tl-sm border border-gray-700 p-3 mb-1">
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    )}
                    {msg.sender === 'user' && <p className="text-sm">{msg.text}</p>}
                    
                    {/* Render Ticket Card if ticket data exists */}
                    {msg.ticketData && <ChatTicketCard ticket={msg.ticketData} />}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm p-4 flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-900/50 border-t border-gray-700/50">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Rexa..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}
                >
                  <Mic className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="bg-primary hover:bg-blue-600 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-primary"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
