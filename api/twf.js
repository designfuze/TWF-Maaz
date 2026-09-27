// ============================================================
// VERCEL API BRIDGE
// ============================================================

function doPost(e) {
  try {
    var body = {};

    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    var action = String(body.action || '').trim();
    var data = body.data || {};

    // Also accept flat payloads.
    if (!body.data) {
      data = {};

      Object.keys(body).forEach(function(key) {
        if (key !== 'action') {
          data[key] = body[key];
        }
      });
    }

    var result;

    switch (action) {

      case 'health':
        result = {
          success: true,
          message: 'Tabasheer Welfare Foundation API is working.',
          timestamp: new Date().toISOString()
        };
        break;

      case 'getFormConfig':
        result = getFormConfig();
        break;

      case 'getBrandAssets':
        result = {
          success: true,
          logoDataUrl: getTWFLogoDataUrl_(),
          signatureDataUrl: getTWFSignatureDataUrl_()
        };
        break;

      case 'submitApplication':
        result = submitApplication(data);
        break;

      case 'getAdmitCardStatus':
        result = getAdmitCardStatus(
          data.applicationId || body.applicationId
        );
        break;

      case 'getAdmitCard':
        result = getAdmitCard(
          data.applicationId || body.applicationId
        );
        break;

      case 'checkResult':
        result = checkResult(
          data.applicationId || body.applicationId
        );
        break;

      default:
        result = {
          success: false,
          message: 'Unknown API action: ' + action
        };
    }

    return jsonResponse_(result);

  } catch (error) {

    console.error('doPost error:', error);

    return jsonResponse_({
      success: false,
      message: error && error.message
        ? error.message
        : 'Server error.'
    });
  }
}


function jsonResponse_(payload) {

  return ContentService
    .createTextOutput(
      JSON.stringify(
        payload || {
          success: false,
          message: 'Empty server response.'
        }
      )
    )
    .setMimeType(ContentService.MimeType.JSON);
}
