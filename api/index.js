const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Store for created links (in production, use Redis or Database)
const linkStore = new Map();
const adLinks = [
  'https://omg10.com/4/10552102',
  'https://omg10.com/4/10520164',
  'https://omg10.com/4/10253326',
  'https://omg10.com/4/10552103',
  'https://omg10.com/4/10552095',
  'https://omg10.com/4/10521019',
  'https://omg10.com/4/10552104',
  'https://omg10.com/4/10552097',
  'https://omg10.com/4/10552096',
  'https://omg10.com/4/10524009'
];

// Generate unique ID
function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

// Create share link endpoint
app.post('/api/createlink', (req, res) => {
  const { destinationUrl } = req.body;
  
  if (!destinationUrl) {
    return res.status(400).json({ error: 'Destination URL is required' });
  }

  const linkId = generateId();
  const randomAdLink = adLinks[Math.floor(Math.random() * adLinks.length)];
  
  const linkData = {
    id: linkId,
    destinationUrl,
    adUrl: randomAdLink,
    createdAt: Date.now(),
    clicks: 0
  };
  
  linkStore.set(linkId, linkData);
  
  res.json({
    success: true,
    shareLink: `https://tnehwatchad.onrender.com/l/${linkId}`,
    linkId: linkId
  });
});

// Check endpoint - verifies if user has seen ad
app.post('/api/check', (req, res) => {
  const { linkId, adCompleted } = req.body;
  
  if (!linkId) {
    return res.status(400).json({ error: 'Link ID is required' });
  }
  
  const linkData = linkStore.get(linkId);
  
  if (!linkData) {
    return res.status(404).json({ error: 'Link not found' });
  }
  
  if (adCompleted) {
    // User completed ad view, redirect to destination
    linkData.clicks++;
    linkStore.set(linkId, linkData);
    
    res.json({
      success: true,
      destinationUrl: linkData.destinationUrl,
      message: 'Ad completed, redirecting...'
    });
  } else {
    // Show ad first
    res.json({
      success: true,
      showAd: true,
      adUrl: linkData.adUrl,
      message: 'Please view the ad to continue'
    });
  }
});

// Redirect endpoint for share links
app.get('/l/:linkId', (req, res) => {
  const { linkId } = req.params;
  const linkData = linkStore.get(linkId);
  
  if (!linkData) {
    return res.status(404).send('Link not found');
  }
  
  // Return HTML page with ad iframe/redirect
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirecting...</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          text-align: center;
          background: white;
          padding: 2rem;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 500px;
        }
        .ad-container {
          margin: 20px 0;
          border: 1px solid #ddd;
          border-radius: 5px;
          overflow: hidden;
        }
        iframe {
          width: 100%;
          height: 300px;
          border: none;
        }
        button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 10px;
        }
        button:hover {
          background: #0056b3;
        }
        .hidden {
          display: none;
        }
        .loading {
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Access Content</h2>
        <p>Please view the ad to continue to your destination</p>
        <div id="adContainer" class="ad-container">
          <iframe id="adFrame" src="${linkData.adUrl}"></iframe>
        </div>
        <button id="continueBtn" onclick="checkAdCompletion()">
          I have viewed the ad
        </button>
        <div id="loading" class="loading hidden">Verifying...</div>
      </div>

      <script>
        let adCompleted = false;
        
        // Check if user has spent enough time on ad
        let timerStarted = false;
        let timeSpent = 0;
        
        const adFrame = document.getElementById('adFrame');
        const continueBtn = document.getElementById('continueBtn');
        const loading = document.getElementById('loading');
        
        adFrame.onload = function() {
          if (!timerStarted) {
            timerStarted = true;
            // Start timer for ad viewing (5 seconds minimum)
            setTimeout(() => {
              adCompleted = true;
              continueBtn.disabled = false;
              continueBtn.style.opacity = '1';
            }, 5000);
          }
        };
        
        async function checkAdCompletion() {
          if (!adCompleted) {
            alert('Please wait 5 seconds after the ad loads');
            return;
          }
          
          loading.classList.remove('hidden');
          continueBtn.disabled = true;
          
          try {
            const response = await fetch('/api/check', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                linkId: '${linkId}',
                adCompleted: true
              })
            });
            
            const data = await response.json();
            
            if (data.success && data.destinationUrl) {
              window.location.href = data.destinationUrl;
            } else {
              alert('Error: Could not redirect');
              loading.classList.add('hidden');
              continueBtn.disabled = false;
            }
          } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
            loading.classList.add('hidden');
            continueBtn.disabled = false;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Get stats endpoint
app.get('/api/stats/:linkId', (req, res) => {
  const { linkId } = req.params;
  const linkData = linkStore.get(linkId);
  
  if (!linkData) {
    return res.status(404).json({ error: 'Link not found' });
  }
  
  res.json({
    id: linkData.id,
    clicks: linkData.clicks,
    createdAt: linkData.createdAt
  });
});

// Get all links (admin)
app.get('/api/links', (req, res) => {
  const allLinks = Array.from(linkStore.values()).map(link => ({
    id: link.id,
    clicks: link.clicks,
    createdAt: link.createdAt,
    destinationPreview: link.destinationUrl.substring(0, 50)
  }));
  
  res.json(allLinks);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
