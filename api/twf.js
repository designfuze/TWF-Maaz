module.exports = async function handler(req, res) {

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }

  // Read environment variable
  const gasUrl = process.env.GAS_WEB_APP_URL;

  if (!gasUrl) {
    console.error(
      'GAS_WEB_APP_URL environment variable is missing.'
    );

    return res.status(500).json({
      success: false,
      message: 'GAS_WEB_APP_URL is not configured in Vercel.'
    });
  }

  console.log('GAS URL configured:', gasUrl.substring(0, 50));

  try {

    let payload = req.body || {};

    // Sometimes Vercel provides the body as a string
    if (typeof payload === 'string') {

      try {
        payload = JSON.parse(payload);

      } catch (error) {

        return res.status(400).json({
          success: false,
          message: 'Invalid JSON request.'
        });

      }
    }

    console.log(
      'Incoming action:',
      payload.action || 'none'
    );

    // Send request to Google Apps Script
    const upstream = await fetch(gasUrl, {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(payload),

      redirect: 'follow'

    });

    const raw = await upstream.text();

    console.log(
      'Google Apps Script status:',
      upstream.status
    );

    console.log(
      'Google Apps Script content type:',
      upstream.headers.get('content-type')
    );

    console.log(
      'Google Apps Script response:',
      raw.substring(0, 3000)
    );

    // Google returned non-2xx
    if (!upstream.ok) {

      return res.status(502).json({

        success: false,

        message:
          'Google Apps Script request failed.',

        googleStatus:
          upstream.status,

        googleResponse:
          raw.substring(0, 3000)

      });

    }

    // Parse JSON
    let data;

    try {

      data = JSON.parse(raw);

    } catch (error) {

      console.error(
        'Google Apps Script returned non-JSON:',
        raw.substring(0, 3000)
      );

      return res.status(502).json({

        success: false,

        message:
          'Google Apps Script returned an invalid response.',

        googleStatus:
          upstream.status,

        googleContentType:
          upstream.headers.get('content-type') || '',

        googleResponse:
          raw.substring(0, 3000)

      });

    }

    // Return Google response to frontend
    return res.status(200).json(data);

  } catch (error) {

    console.error(
      'Vercel API error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        error && error.message
          ? error.message
          : 'Unable to connect to Google Apps Script.'

    });

  }

};
