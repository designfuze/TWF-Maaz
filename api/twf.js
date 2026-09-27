// ============================================================
// TABASHEER WELFARE FOUNDATION
// VERCEL SERVERLESS API BRIDGE
// ============================================================

module.exports = async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.'
    });
  }

  const gasUrl = process.env.GAS_WEB_APP_URL;

  if (!gasUrl) {
    return res.status(500).json({
      success: false,
      message: 'GAS_WEB_APP_URL is not configured in Vercel.'
    });
  }

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(gasUrl)) {
    return res.status(500).json({
      success: false,
      message: 'GAS_WEB_APP_URL must be a Google Apps Script /exec URL.'
    });
  }

  try {

    let payload = req.body || {};

    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload || '{}');
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON request.'
        });
      }
    }

    const upstream = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const raw = await upstream.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.error('Google Apps Script response:', raw);

      return res.status(502).json({
        success: false,
        message: 'Google Apps Script returned an invalid response.',
        upstreamStatus: upstream.status,
        upstreamPreview: raw.substring(0, 500)
      });
    }

    if (!upstream.ok) {
      return res.status(502).json({
        success: false,
        message: 'Google Apps Script request failed.',
        upstreamStatus: upstream.status,
        upstream: data
      });
    }

    return res.status(200).json(data);

  } catch (error) {

    console.error('Vercel API error:', error);

    return res.status(500).json({
      success: false,
      message: error && error.message
        ? error.message
        : 'Unable to connect to Google Apps Script.'
    });
  }
};
