const asyncHandler = require('express-async-handler');
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const Ticket = require('../models/Ticket');
const jwt = require('jsonwebtoken');
const stationCoordinates = require('../utils/stationCoordinates');

// @desc    Process chatbot message
// @route   POST /api/chatbot/message
// @access  Private
const processMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const projectId = process.env.DIALOGFLOW_PROJECT_ID;

  if (!projectId || projectId === 'YOUR_DIALOGFLOW_PROJECT_ID_HERE') {
    // Fallback to mock behavior if Dialogflow is not configured
    return res.status(200).json({ 
      reply: "Dialogflow is not yet configured. Please set up your credentials!", 
      action: null 
    });
  }

  // Generate a unique session ID for the user
  const sessionId = req.user ? req.user._id.toString() : uuid.v4();

  // Parse credentials from Render environment variable if available
  let credentialsOptions = {};
  if (process.env.DIALOGFLOW_KEY_JSON) {
    try {
      credentialsOptions = {
        credentials: JSON.parse(process.env.DIALOGFLOW_KEY_JSON)
      };
    } catch (e) {
      console.error("Failed to parse DIALOGFLOW_KEY_JSON environment variable:", e);
    }
  }

  // Create a new session with dynamic credentials
  const sessionClient = new dialogflow.SessionsClient(credentialsOptions);
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: 'en-US',
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    
    console.log("Dialogflow Intent detected:", result.intent?.displayName);
    console.log("Dialogflow Parameters:", JSON.stringify(result.parameters?.fields, null, 2));

    let action = null;
    let ticketData = null;
    let reply = result.fulfillmentText;
    const intentName = result.intent ? result.intent.displayName : '';

    // Route actions based on intent names
    if (intentName.toLowerCase().includes('book')) {
      // Check if Dialogflow extracted source and destination entities
      const params = result.parameters?.fields;
      let source = params?.source?.stringValue || '';
      let destination = params?.destination?.stringValue || '';

      // Fallback: If Dialogflow NLP misses the entities due to a typo or weak training, use a Regex Parser
      if (!source || !destination) {
        const rawMessage = message.toLowerCase();
        
        // First try standard 'from X to Y'
        let match = rawMessage.match(/from\s+(.+?)\s+to\s+(.+)/i);
        
        // If 'from' is missing, strip common prefixes and look for 'X to Y'
        if (!match) {
          const stripped = rawMessage.replace(/^(?:please\s+)?(?:i want to\s+)?(?:book\s+)?(?:a\s+)?(?:ticket\s+)?(?:for\s+)?/i, '').trim();
          match = stripped.match(/(.+?)\s+to\s+(.+)/i);
        }

        if (match) {
          source = source || match[1].trim();
          destination = destination || match[2].replace(/[^\w\s].*/, '').trim(); // clean up trailing punctuation
          
          // Capitalize first letters for aesthetics
          source = source.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          destination = destination.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }

      if (source && destination) {
        if (req.user.walletBalance < 80) {
          reply = "Your wallet balance is too low! You need a minimum balance of ₹80 to book a ride. Please add money to your wallet on the Dashboard.";
          action = '/dashboard';
        } else {
          // Calculate Real-World Fare using OSRM
          let fareEstimate = 50;
          let distanceEstimate = 15;
          const srcCoords = stationCoordinates[source];
          const destCoords = stationCoordinates[destination];
          
          if (srcCoords && destCoords) {
            try {
              const url = `http://router.project-osrm.org/route/v1/driving/${srcCoords.lon},${srcCoords.lat};${destCoords.lon},${destCoords.lat}?overview=false`;
              const response = await fetch(url);
              const data = await response.json();
              if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                distanceEstimate = Number((data.routes[0].distance / 1000).toFixed(1));
                fareEstimate = Math.ceil(distanceEstimate * 2.5);
                if (fareEstimate < 10) fareEstimate = 10;
              }
            } catch (err) {
              console.error('Chatbot OSRM Routing Error:', err);
            }
          }

          // Generate a Cryptographically Verifiable QR Code using JWT
          const qrPayload = {
            source,
            destination,
            userId: req.user._id,
            fareEstimate,
            distanceEstimate,
            jti: uuid.v4(),
            type: 'TRANSIT_TICKET'
          };
          const qrString = jwt.sign(qrPayload, process.env.JWT_SECRET, { expiresIn: '24h' });
        
          const ticket = await Ticket.create({
            user: req.user._id,
            source,
            destination,
            qrCode: qrString,
            status: 'Active',
            fareEstimate,
            distanceEstimate,
          });

          reply = `Ticket successfully booked from ${source} to ${destination}! Here is your ticket.`;
          action = 'display_ticket';
          ticketData = ticket;
        }
      } else {
        // They didn't provide source/destination, so redirect them to the manual booking page
        reply = "I couldn't quite catch the exact station names. Please make sure to use the exact station names, or you can book manually here!";
        action = '/book';
      }
    } else if (intentName.toLowerCase().includes('history')) {
      action = '/history';
    } else if (intentName.toLowerCase().includes('track') || intentName.toLowerCase().includes('map')) {
      action = '/dashboard';
    }

    res.status(200).json({ 
      reply, 
      action,
      ticketData
    });
  } catch (error) {
    console.error('Dialogflow API Error:', error);
    res.status(500);
    throw new Error('Error communicating with Dialogflow');
  }
});

module.exports = {
  processMessage
};
