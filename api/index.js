const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Your 10 ad links
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

// Store links in memory
const linkStore = new Map();

// Helper: Generate random ID
function generateId() {
  return 'tneh' + Math.random().toString(36).substring(2, 8);
}

// ============= ENDPOINTS =============

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    totalLinks: linkStore.size,
    totalAds: adLinks.length
  });
});

// 2. Create ID
app.get('/api/createid', (req, res) => {
  const newId = generateId();
  
  res.json({
    success: true,
    id: newId,
    message: 'Use this ID to generate share link'
  });
});

// 3. Generate share link (URL: /api/Id=tneh1&generate=)
app.get('/api/Id=:id&generate=', (req, res) => {
  const linkId = req.params.id;
  
  if (!linkId) {
    return res.status(400).json({
      success: false,
      error: 'ID is required',
      example: '/api/Id=tneh1&generate='
    });
  }
  
  // Check if link already exists
  if (!linkStore.has(linkId)) {
    const randomAd = adLinks[Math.floor(Math.random() * adLinks.length)];
    linkStore.set(linkId, {
      id: linkId,
      adUrl: randomAd,
      createdAt: Date.now(),
      clicks: 0
    });
  }
  
  const linkData = linkStore.get(linkId);
  const shareLink = `https://tnehwatchad.onrender.com/api/getad?id=${linkId}`;
  
  res.json({
    success: true,
    shareLink: shareLink,
    id: linkId,
    adUrl: linkData.adUrl,
    message: 'Share this link with anyone!'
  });
});

// 4. Alternative format (cleaner)
app.get('/api/generate/:id', (req, res) => {
  const linkId = req.params.id;
  
  if (!linkStore.has(linkId)) {
    const randomAd = adLinks[Math.floor(Math.random() * adLinks.length)];
    linkStore.set(linkId, {
      id: linkId,
      adUrl: randomAd,
      createdAt: Date.now(),
      clicks: 0
    });
  }
  
  const linkData = linkStore.get(linkId);
  
  res.json({
    success: true,
    shareLink: `https://tnehwatchad.onrender.com/api/getad?id=${linkId}`,
    id: linkId,
    adUrl: linkData.adUrl
  });
});

// 5. Check ID validity
app.get('/api/checkid=:id', (req, res) => {
  const linkId = req.params.id;
  
  if (!linkId) {
    return res.json({
      valid: false,
      error: 'No ID provided'
    });
  }
  
  const exists = linkStore.has(linkId);
  
  if (exists) {
    const data = linkStore.get(linkId);
    res.json({
      valid: true,
      id: linkId,
      clicks: data.clicks,
      createdAt: new Date(data.createdAt).toISOString(),
      adUrl: data.adUrl
    });
  } else {
    res.json({
      valid: false,
      id: linkId,
      message: 'ID not found. You can still create a link with this ID.'
    });
  }
});

// 6. Get ad (redirect to actual ad)
app.get('/api/getad', (req, res) => {
  const linkId = req.query.id;
  
  if (!linkId || !linkStore.has(linkId)) {
    return res.status(404).json({
      error: 'Link not found',
      message: 'Invalid or expired share link'
    });
  }
  
  const linkData = linkStore.get(linkId);
  linkData.clicks++;
  linkStore.set(linkId, linkData);
  
  // Return JSON with ad URL (not HTML redirect)
  res.json({
    success: true,
    redirectTo: linkData.adUrl,
    id: linkId,
    clicks: linkData.clicks,
    message: 'Redirect to this URL to view ad'
  });
});

// 7. Direct random ad
app.get('/api/random', (req, res) => {
  const randomAd = adLinks[Math.floor(Math.random() * adLinks.length)];
  res.json({
    adUrl: randomAd,
    message: 'Redirect to this URL'
  });
});

// 8. Get all links (admin)
app.get('/api/links', (req, res) => {
  const allLinks = Array.from(linkStore.values());
  res.json({
    total: allLinks.length,
    links: allLinks
  });
});

// 9. Delete link (admin)
app.delete('/api/delete/:id', (req, res) => {
  const linkId = req.params.id;
  
  if (linkStore.has(linkId)) {
    linkStore.delete(linkId);
    res.json({
      success: true,
      message: `Link ${linkId} deleted`
    });
  } else {
    res.json({
      success: false,
      message: 'Link not found'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'TNEH Ad Share Link API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      createId: 'GET /api/createid',
      generateLink: 'GET /api/Id={ID}&generate=',
      generateAlt: 'GET /api/generate/{ID}',
      checkId: 'GET /api/checkid={ID}',
      getAd: 'GET /api/getad?id={ID}',
      random: 'GET /api/random',
      allLinks: 'GET /api/links'
    },
    example: {
      step1: 'GET https://tnehwatchad.onrender.com/api/createid',
      step2: 'GET https://tnehwatchad.onrender.com/api/Id=tneh1&generate=',
      step3: 'Share the returned shareLink'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Endpoints ready:`);
  console.log(`   GET /api/health`);
  console.log(`   GET /api/createid`);
  console.log(`   GET /api/Id=tneh1&generate=`);
  console.log(`   GET /api/checkid=tneh1`);
});

module.exports = app;
