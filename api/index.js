const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your ad links
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

// Store created links
const linkStore = new Map();

// Generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// API Root
app.get('/api/', (req, res) => {
  res.json({
    status: 'active',
    message: 'TNEH Ad Share Link System',
    totalAds: adLinks.length,
    endpoints: {
      createLink: 'GET /api/createid',
      generateLink: 'GET /api/Id=&generatelink',
      getAd: 'GET /api/getad?id=ID'
    }
  });
});

// Endpoint 1: /api/createid - Creates a new link ID
app.get('/api/createid', (req, res) => {
  const linkId = generateId();
  const randomAd = adLinks[Math.floor(Math.random() * adLinks.length)];
  
  linkStore.set(linkId, {
    id: linkId,
    adUrl: randomAd,
    createdAt: Date.now(),
    clicks: 0
  });
  
  res.json({
    success: true,
    id: linkId,
    adUrl: randomAd,
    message: 'Use this ID to generate share link'
  });
});

// Endpoint 2: /api/Id=&generatelink - Generate full link from ID
app.get('/api/Id=&generatelink', (req, res) => {
  const linkId = req.query.id;
  
  if (!linkId) {
    return res.json({
      error: 'Please provide an ID',
      example: '/api/Id=&generatelink?id=abc123'
    });
  }
  
  // Check if link exists
  if (!linkStore.has(linkId)) {
    // Create new entry if ID doesn't exist
    const randomAd = adLinks[Math.floor(Math.random() * adLinks.length)];
    linkStore.set(linkId, {
      id: linkId,
      adUrl: randomAd,
      createdAt: Date.now(),
      clicks: 0
    });
  }
  
  const shareLink = `https://tnehwatchad.onrender.com/api/getad?id=${linkId}`;
  
  res.json({
    success: true,
    shareLink: shareLink,
    id: linkId,
    adUrl: linkStore.get(linkId).adUrl,
    message: 'Share this link with anyone!'
  });
});

// Alternative: /api/generatelink?id=ID (cleaner version)
app.get('/api/generatelink', (req, res) => {
  const linkId = req.query.id;
  
  if (!linkId) {
    return res.json({
      error: 'Please provide an ID',
      example: '/api/generatelink?id=abc123'
    });
  }
  
  if (!linkStore.has(linkId)) {
    const randomAd = adLinks[Math.floor(Math.random() * adLinks.length)];
    linkStore.set(linkId, {
      id: linkId,
      adUrl: randomAd,
      createdAt: Date.now(),
      clicks: 0
    });
  }
  
  const shareLink = `https://tnehwatchad.onrender.com/api/getad?id=${linkId}`;
  
  res.json({
    success: true,
    shareLink: shareLink,
    id: linkId
  });
});

// GET AD - Show ad when someone clicks share link
app.get('/api/getad', (req, res) => {
  const linkId = req.query.id;
  
  if (!linkId || !linkStore.has(linkId)) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Invalid Link</title></head>
      <body style="font-family: Arial; text-align: center; margin-top: 50px;">
        <h2>❌ Invalid Link</h2>
        <p>This share link is not valid.</p>
        <a href="https://tnehwatchad.onrender.com/">Create New Link</a>
      </body>
      </html>
    `);
  }
  
  const linkData = linkStore.get(linkId);
  linkData.clicks++;
  linkStore.set(linkId, linkData);
  
  // Show ad page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirecting to Ad...</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          margin: 20px;
        }
        h1 { color: #333; margin-bottom: 10px; }
        .timer {
          font-size: 72px;
          font-weight: bold;
          color: #667eea;
          margin: 20px 0;
        }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 50px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
          transition: transform 0.3s;
        }
        button:hover {
          transform: scale(1.05);
          background: #5a67d8;
        }
        .info {
          margin-top: 20px;
          font-size: 12px;
          color: #999;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>📢 Please View This Ad</h1>
        <p>You will be redirected in</p>
        <div class="timer" id="timer">5</div>
        <button onclick="goNow()">Skip Wait →</button>
        <div class="info">
          ⭐ This helps support free content<br>
          Redirecting to: <strong id="adUrl">${linkData.adUrl}</strong>
        </div>
      </div>
      
      <script>
        let timeLeft = 5;
        const timerEl = document.getElementById('timer');
        
        const countdown = setInterval(() => {
          timeLeft--;
          timerEl.textContent = timeLeft;
          
          if (timeLeft <= 0) {
            clearInterval(countdown);
            window.location.href = '${linkData.adUrl}';
          }
        }, 1000);
        
        function goNow() {
          clearInterval(countdown);
          window.location.href = '${linkData.adUrl}';
        }
      </script>
    </body>
    </html>
  `);
});

// Stats endpoint
app.get('/api/stats/:id', (req, res) => {
  const linkData = linkStore.get(req.params.id);
  if (!linkData) {
    return res.json({ error: 'Link not found' });
  }
  res.json({
    linkId: linkData.id,
    clicks: linkData.clicks,
    createdAt: new Date(linkData.createdAt).toLocaleString(),
    adUrl: linkData.adUrl
  });
});

// Get random ad directly
app.get('/api/random', (req, res) => {
  const randomAd = adLinks[Math.floor(Math.random() * adLinks.length)];
  res.redirect(randomAd);
});

// Get all links (admin)
app.get('/api/links', (req, res) => {
  const allLinks = Array.from(linkStore.values());
  res.json(allLinks);
});

// Homepage
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TNEH Ad Share Link</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 600px;
        }
        h1 { color: #333; margin-bottom: 10px; }
        .subtitle { color: #666; margin-bottom: 30px; }
        .link-box {
          background: #f7f7f7;
          padding: 15px;
          border-radius: 10px;
          margin: 20px 0;
          word-break: break-all;
          font-family: monospace;
        }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 50px;
          font-size: 18px;
          cursor: pointer;
          margin: 10px;
          transition: transform 0.3s;
        }
        button:hover {
          transform: scale(1.05);
          background: #5a67d8;
        }
        .copy-btn {
          background: #48bb78;
        }
        .copy-btn:hover {
          background: #38a169;
        }
        .loading {
          display: none;
          margin: 20px;
          color: #667eea;
        }
        .endpoint {
          background: #eef2ff;
          padding: 10px;
          margin: 10px 0;
          border-radius: 8px;
          font-size: 12px;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 TNEH Ad Share Link</h1>
        <p class="subtitle">Create share links with ad monetization</p>
        
        <button id="createBtn" onclick="createShareLink()">✨ Create Share Link ✨</button>
        
        <div class="loading" id="loading">
          Creating link... ⏳
        </div>
        
        <div id="result" style="display: none;">
          <h3>✅ Your Share Link:</h3>
          <div class="link-box" id="shareLink"></div>
          <button class="copy-btn" onclick="copyLink()">📋 Copy Link</button>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Share this link with anyone!<br>
            They will see an ad before continuing.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <h4>📡 API Endpoints:</h4>
          <div class="endpoint">GET /api/createid</div>
          <div class="endpoint">GET /api/Id=&generatelink?id=YOUR_ID</div>
          <div class="endpoint">GET /api/generatelink?id=YOUR_ID</div>
          <div class="endpoint">GET /api/random</div>
        </div>
      </div>
      
      <script>
        let currentLink = '';
        
        async function createShareLink() {
          const btn = document.getElementById('createBtn');
          const loading = document.getElementById('loading');
          const result = document.getElementById('result');
          
          btn.disabled = true;
          loading.style.display = 'block';
          result.style.display = 'none';
          
          try {
            // First, create an ID
            const idResponse = await fetch('/api/createid');
            const idData = await idResponse.json();
            
            if (idData.success) {
              // Then generate the full link
              const linkResponse = await fetch('/api/Id=&generatelink?id=' + idData.id);
              const linkData = await linkResponse.json();
              
              if (linkData.success) {
                currentLink = linkData.shareLink;
                document.getElementById('shareLink').innerHTML = currentLink;
                result.style.display = 'block';
              } else {
                alert('Error generating link');
              }
            } else {
              alert('Error creating ID');
            }
          } catch (error) {
            alert('Error: ' + error.message);
          } finally {
            btn.disabled = false;
            loading.style.display = 'none';
          }
        }
        
        function copyLink() {
          navigator.clipboard.writeText(currentLink);
          alert('Link copied to clipboard! 📋');
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`✅ Server running on port \${PORT}\`);
  console.log(\`📍 Endpoints:\`);
  console.log(\`   GET /api/createid\`);
  console.log(\`   GET /api/Id=&generatelink?id=ID\`);
  console.log(\`   GET /api/generatelink?id=ID\`);
  console.log(\`📊 Visit: https://tnehwatchad.onrender.com\`);
});

module.exports = app;
