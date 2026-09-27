/**
 * ============================================================
 * TABASHEER WELFARE FOUNDATION
 * TALENT HUNT EXAMINATION PORTAL
 * Google Apps Script + Google Sheets + Google Drive
 * ============================================================
 *
 * Features:
 * - Student registration
 * - Automatic Application ID
 * - Student confirmation email
 * - Admin notification email
 * - Passport photo upload
 * - Google Drive photo storage
 * - Admit Card Management with Yes/No publishing control
 * - Result Management with Yes/No publishing control
 * - Admit Card generation
 * - Result lookup
 * - Automatic yearly registration
 * - Permanent Exam Settings sheet for yearly examination date
 *
 * Admin Emails:
 * tabasheerfoundation@gmail.com
 * designfuzee@gmail.com
 */

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  FOUNDATION_NAME: 'Tabasheer Welfare Foundation',
  EXAM_NAME: 'Talent Hunt Examination',

  ADMIN_EMAILS: [
    'tabasheerfoundation@gmail.com',
    'designfuzee@gmail.com'
  ],

  TIMEZONE: 'Asia/Kolkata',

  APPLICATION_SHEET: 'Applications',
  ADMIT_CARD_SHEET: 'Admit Card Management',
  RESULT_SHEET: 'Result Management',
  EXAM_SETTINGS_SHEET: 'Exam Settings',

  PHOTO_FOLDER_NAME: 'Tabasheer Talent Hunt - Student Photos',

  // Official TWF signature used on Admit Cards and Results.
  TWF_SIGNATURE_FILE_ID: '1d2hbH0xPa35iqU5Ckp3eDXiy1Y_v07Q5',

  // Official TWF logo used in the portal, Admit Card, Result and favicon.
  TWF_LOGO_FILE_ID: '1YckO15_oT9dspFSpIgIgt-otTlLXUa-E',

  MAX_PHOTO_SIZE_BYTES: 2 * 1024 * 1024,

  BOARD_OPTIONS: [
    'CBSE',
    'ICSE',
    'BSEB',
    'Other'
  ],

  GENDER_OPTIONS: [
    'Male',
    'Female',
    'Other'
  ],

  MEDIUM_OPTIONS: [
    'English',
    'Hindi',
    'Urdu',
    'Other'
  ],

  // Change these whenever examination centres need to be updated.
  EXAM_CENTRES: [
    'Purnia',
    'Araria',
    'Kishanganj',
    'Other'
  ]
};



// ============================================================
// ADMIN MENU
// ============================================================

function onOpen() {

  SpreadsheetApp
    .getUi()
    .createMenu('Talent Hunt Admin')
    .addItem('Setup / Sync Management Sheets', 'setupProject')
    .addItem('Sync Management Sheets', 'syncManagementSheets_')
    .addToUi();
}


// ============================================================
// WEB APP
// ============================================================

function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Talent Hunt Examination | Tabasheer Welfare Foundation')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


// ============================================================
// INITIAL PROJECT SETUP
// ============================================================

function setupProject() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ----------------------------------------------------------
  // Exam Settings Sheet
  // ----------------------------------------------------------

  let examSettingsSheet =
    ss.getSheetByName(CONFIG.EXAM_SETTINGS_SHEET);

  if (!examSettingsSheet) {
    examSettingsSheet =
      ss.insertSheet(CONFIG.EXAM_SETTINGS_SHEET);
  }

  if (examSettingsSheet.getLastRow() === 0) {

    examSettingsSheet
      .getRange(1, 1, 2, 2)
      .setValues([
        ['Setting', 'Value'],
        ['Examination Date', '20 December 2026']
      ]);

    examSettingsSheet
      .getRange(1, 1, 1, 2)
      .setFontWeight('bold');

    examSettingsSheet.setFrozenRows(1);
  }

  // ----------------------------------------------------------
  // Applications Sheet
  // ----------------------------------------------------------

  let applicationSheet = ss.getSheetByName(CONFIG.APPLICATION_SHEET);

  if (!applicationSheet) {
    applicationSheet = ss.insertSheet(CONFIG.APPLICATION_SHEET);
  }

  const applicationHeaders = [
    'Timestamp',
    'Application ID',
    'Student Name',
    'Gender',
    'Date of Birth',
    'Phone',
    'Email',
    'Present School Name',
    '10th Board',
    'Other Board Name',
    'District',
    'Exam Centre',
    'Exam Paper Medium',
    'Full Address',
    'Photo File ID',
    'Photo File URL',
    'Admit Card Available Date',
    'Declaration'
  ];

  if (applicationSheet.getLastRow() === 0) {
    applicationSheet
      .getRange(1, 1, 1, applicationHeaders.length)
      .setValues([applicationHeaders]);

    applicationSheet
      .getRange(1, 1, 1, applicationHeaders.length)
      .setFontWeight('bold');

    applicationSheet.setFrozenRows(1);
  }

  // ----------------------------------------------------------
  // Admit Card Management Sheet
  // ----------------------------------------------------------

  let admitSheet = ss.getSheetByName(CONFIG.ADMIT_CARD_SHEET);

  if (!admitSheet) {
    admitSheet = ss.insertSheet(CONFIG.ADMIT_CARD_SHEET);
  }

  const admitHeaders = [
    'Application ID',
    'Student Name',
    'Gender',
    'Date of Birth',
    'Present School Name',
    '10th Board',
    'District',
    'Exam Centre',
    'Exam Paper Medium',
    'Full Address',
    'Application Date',
    'Photo File ID',
    'Admit Card Live?'
  ];

  if (admitSheet.getLastRow() === 0) {
    admitSheet
      .getRange(1, 1, 1, admitHeaders.length)
      .setValues([admitHeaders]);

    admitSheet
      .getRange(1, 1, 1, admitHeaders.length)
      .setFontWeight('bold');

    admitSheet.setFrozenRows(1);
  }

  // ----------------------------------------------------------
  // Result Management Sheet
  // ----------------------------------------------------------

  let resultSheet = ss.getSheetByName(CONFIG.RESULT_SHEET);

  if (!resultSheet) {
    resultSheet = ss.insertSheet(CONFIG.RESULT_SHEET);
  }

  const resultHeaders = [
    'Application ID',
    'Student Name',
    'Date of Birth',
    '10th Board',
    'Exam Paper Medium',
    'Result Status',
    'Marks',
    'Rank',
    'Remarks',
    'Result Live?'
  ];

  if (resultSheet.getLastRow() === 0) {
    resultSheet
      .getRange(1, 1, 1, resultHeaders.length)
      .setValues([resultHeaders]);

    resultSheet
      .getRange(1, 1, 1, resultHeaders.length)
      .setFontWeight('bold');

    resultSheet.setFrozenRows(1);
  }

  // Add Yes/No dropdowns to management sheets.
  applyManagementValidation_();

  // Synchronize all existing applications.
  syncManagementSheets_();

  // ----------------------------------------------------------
  // Drive Folder
  // ----------------------------------------------------------

  getPhotoFolder_();

  return {
    success: true,
    message: 'Project setup completed successfully.'
  };
}


// ============================================================
// FORM CONFIGURATION
// ============================================================

function getFormConfig() {

  return {
    gender: CONFIG.GENDER_OPTIONS,
    board: CONFIG.BOARD_OPTIONS,
    examCentre: CONFIG.EXAM_CENTRES,
    medium: CONFIG.MEDIUM_OPTIONS
  };
}


// ============================================================
// SUBMIT APPLICATION
// ============================================================

function submitApplication(data) {

  try {

    validateApplication_(data);

    const lock = LockService.getScriptLock();

    lock.waitLock(30000);

    try {

      const ss = SpreadsheetApp.getActiveSpreadsheet();

      const sheet = ss.getSheetByName(CONFIG.APPLICATION_SHEET);

      if (!sheet) {
        throw new Error(
          'Applications sheet not found. Please run setupProject() first.'
        );
      }

      // ------------------------------------------------------
      // Generate Application ID
      // ------------------------------------------------------

      const timestamp = new Date();

      const applicationId = generateApplicationId_(sheet, timestamp);

      // ------------------------------------------------------
      // Photo
      // ------------------------------------------------------

      let photoFileId = '';
      let photoFileUrl = '';

      if (data.photo && data.photo.base64) {

        const photo = saveStudentPhoto_(
          data.photo,
          applicationId,
          data.studentName
        );

        photoFileId = photo.fileId;
        photoFileUrl = photo.url;
      }

      // ------------------------------------------------------
      // Medium
      // ------------------------------------------------------

      const finalMedium =
        data.medium === 'Other'
          ? String(data.mediumOther || '').trim()
          : String(data.medium || '').trim();

      // ------------------------------------------------------
      // Board
      // ------------------------------------------------------

      const finalBoard =
        data.board === 'Other'
          ? String(data.boardOther || '').trim()
          : String(data.board || '').trim();

      // ------------------------------------------------------
      // Save Application
      // ------------------------------------------------------

      const row = [
        timestamp,
        applicationId,
        data.studentName,
        data.gender,
        data.dob,
        data.phone,
        data.email,
        data.school,
        finalBoard,
        data.board === 'Other' ? data.boardOther : '',
        data.district,
        data.examCentre,
        finalMedium,
        String(data.address || '').trim(),
        photoFileId,
        photoFileUrl,
        '',
        data.declaration ? 'Accepted' : 'Not Accepted'
      ];

      sheet.appendRow(row);

      // Keep management sheets synchronized with the new application.
      syncManagementSheets_();

      // ------------------------------------------------------
      // Student Email
      // ------------------------------------------------------

      sendStudentConfirmationEmail_({
        applicationId: applicationId,
        timestamp: timestamp,
        studentName: data.studentName,
        gender: data.gender,
        dob: data.dob,
        phone: data.phone,
        email: data.email,
        school: data.school,
        board: finalBoard,
        district: data.district,
        examCentre: data.examCentre,
        medium: finalMedium,
        address: String(data.address || '').trim()
      });

      // ------------------------------------------------------
      // Admin Email
      // ------------------------------------------------------

      sendAdminNotificationEmail_({
        applicationId: applicationId,
        timestamp: timestamp,
        studentName: data.studentName,
        email: data.email,
        phone: data.phone,
        school: data.school,
        board: finalBoard,
        district: data.district,
        examCentre: data.examCentre,
        medium: finalMedium
      });

      return {
        success: true,
        applicationId: applicationId,
        studentName: data.studentName,
        applicationDate: formatDate_(timestamp),
        examinationDate: getExaminationDate_(),
        message:
          'Congratulations! Your application has been successfully submitted.'
      };

    } finally {

      lock.releaseLock();
    }

  } catch (error) {

    console.error(error);

    return {
      success: false,
      message: error.message || 'Unable to submit application.'
    };
  }
}


// ============================================================
// VALIDATE APPLICATION
// ============================================================

function validateApplication_(data) {

  if (!data) {
    throw new Error('Invalid application data.');
  }

  const required = [
    ['studentName', 'Student name'],
    ['gender', 'Gender'],
    ['dob', 'Date of birth'],
    ['phone', 'Phone number'],
    ['email', 'Email address'],
    ['school', 'School name'],
    ['board', '10th Board'],
    ['district', 'District'],
    ['examCentre', 'Examination centre'],
    ['medium', 'Exam paper medium'],
    ['address', 'Full address']
  ];

  required.forEach(function(item) {

    const key = item[0];
    const label = item[1];

    if (!data[key] || String(data[key]).trim() === '') {
      throw new Error(label + ' is required.');
    }
  });

  if (
    data.board === 'Other' &&
    (!data.boardOther || String(data.boardOther).trim() === '')
  ) {
    throw new Error('Please enter the board name.');
  }

  if (
    data.medium === 'Other' &&
    (!data.mediumOther || String(data.mediumOther).trim() === '')
  ) {
    throw new Error('Please enter the exam language.');
  }

  if (!data.declaration) {
    throw new Error('Please accept the declaration.');
  }

  const phone = String(data.phone).replace(/\D/g, '');

  if (phone.length < 10 || phone.length > 15) {
    throw new Error('Please enter a valid phone number.');
  }

  const email = String(data.email).trim();

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address.');
  }

  // ----------------------------------------------------------
  // Photo Validation
  // ----------------------------------------------------------

  if (!data.photo || !data.photo.base64) {
    throw new Error('Passport size photograph is required.');
  }

  if (
    data.photo.size &&
    Number(data.photo.size) > CONFIG.MAX_PHOTO_SIZE_BYTES
  ) {
    throw new Error('Photo size must not exceed 2 MB.');
  }

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (
    data.photo.mimeType &&
    allowedTypes.indexOf(data.photo.mimeType.toLowerCase()) === -1
  ) {
    throw new Error('Only JPG, JPEG or PNG photographs are allowed.');
  }
}


// ============================================================
// APPLICATION ID
// ============================================================

function generateApplicationId_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Applications");

  const startNumber = 110;
  const lastRow = sheet.getLastRow();

  // If there are no student applications yet
  if (lastRow < 2) {
    return "TWF-TH-00110-DF";
  }

  // Application ID is assumed to be in Column B
  const ids = sheet
    .getRange(2, 2, lastRow - 1, 1)
    .getValues()
    .flat()
    .filter(String);

  let highestNumber = startNumber - 1;

  ids.forEach(function(id) {
    const match = String(id).match(/^TWF-TH-(\d+)-DF$/);

    if (match) {
      const number = parseInt(match[1], 10);

      if (number > highestNumber) {
        highestNumber = number;
      }
    }
  });

  const nextNumber = highestNumber + 1;

  return `TWF-TH-${String(nextNumber).padStart(5, "0")}-DF`;
}


// ============================================================
// SAVE STUDENT PHOTO
// ============================================================

function saveStudentPhoto_(photo, applicationId, studentName) {

  const folder = getPhotoFolder_();

  const base64 = String(photo.base64);

  const commaIndex = base64.indexOf(',');

  const encoded =
    commaIndex >= 0
      ? base64.substring(commaIndex + 1)
      : base64;

  const bytes = Utilities.base64Decode(encoded);

  if (bytes.length > CONFIG.MAX_PHOTO_SIZE_BYTES) {
    throw new Error('Photo size must not exceed 2 MB.');
  }

  const mimeType =
    photo.mimeType || 'image/jpeg';

  const extension =
    mimeType === 'image/png'
      ? 'png'
      : 'jpg';

  const safeName =
    String(studentName || 'Student')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_');

  const fileName =
    applicationId +
    '_' +
    safeName +
    '.' +
    extension;

  const blob = Utilities.newBlob(
    bytes,
    mimeType,
    fileName
  );

  const file = folder.createFile(blob);

  return {
    fileId: file.getId(),
    url: file.getUrl()
  };
}


// ============================================================
// PHOTO FOLDER
// ============================================================

function getPhotoFolder_() {

  const properties =
    PropertiesService.getScriptProperties();

  const existingFolderId =
    properties.getProperty('PHOTO_FOLDER_ID');

  if (existingFolderId) {

    try {
      return DriveApp.getFolderById(existingFolderId);
    } catch (error) {
      // Folder no longer exists. Create a new one.
    }
  }

  const folders = DriveApp.getFoldersByName(
    CONFIG.PHOTO_FOLDER_NAME
  );

  let folder;

  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(
      CONFIG.PHOTO_FOLDER_NAME
    );
  }

  properties.setProperty(
    'PHOTO_FOLDER_ID',
    folder.getId()
  );

  return folder;
}


// ============================================================
// ADMIT CARD STATUS
// ============================================================

function getAdmitCardStatus(applicationId) {

  try {

    const application =
      findApplication_(applicationId);

    if (!application) {

      return {
        success: false,
        message: 'Application ID not found.'
      };
    }

    const live =
      isAdmitCardLive_(application.applicationId);

    if (!live) {

      return {
        success: true,
        available: false,
        applicationId: application.applicationId,
        studentName: application.studentName,
        message:
          'Your Admit Card has not been released yet. Please check again later.'
      };
    }

    return {
      success: true,
      available: true,
      applicationId: application.applicationId,
      studentName: application.studentName
    };

  } catch (error) {

    return {
      success: false,
      message: error.message
    };
  }
}


// ============================================================
// GET ADMIT CARD
// ============================================================

function getAdmitCard(applicationId) {

  try {

    const application =
      findApplication_(applicationId);

    if (!application) {

      return {
        success: false,
        message: 'Application ID not found.'
      };
    }

    // --------------------------------------------------------
    // SERVER-SIDE MANAGEMENT CHECK
    // --------------------------------------------------------

    if (!isAdmitCardLive_(application.applicationId)) {

      return {
        success: false,
        locked: true,
        message:
          'Your Admit Card has not been released yet. Please check again later.'
      };
    }

    // --------------------------------------------------------
    // PHOTO
    // --------------------------------------------------------

    const photoDataUrl = getStudentPhotoDataUrl_(
      application.photoFileId,
      application.photoUrl
    );

    return {
      success: true,
      applicationId: application.applicationId,
      studentName: application.studentName,
      gender: application.gender,
      dob: application.dob,
      phone: application.phone,
      email: application.email,
      school: application.school,
      board: application.board,
      district: application.district,
      examCentre: application.examCentre,
      medium: application.medium,
      address: application.address,
      applicationDate:
        formatDate_(application.timestamp),

      examinationDate:
        getExaminationDate_(),

      signatureDataUrl: getTWFSignatureDataUrl_(),
      logoDataUrl: getTWFLogoDataUrl_(),

      photoDataUrl: photoDataUrl,
      photoAvailable: !!photoDataUrl
    };

  } catch (error) {

    return {
      success: false,
      message: error.message
    };
  }
}


// ============================================================
// TWF SIGNATURE DATA URL
// ============================================================

function getTWFSignatureDataUrl_() {

  const fileId =
    String(CONFIG.TWF_SIGNATURE_FILE_ID || '').trim();

  if (!fileId) {
    return '';
  }

  try {

    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const bytes = blob.getBytes();

    if (!bytes || bytes.length === 0) {
      return '';
    }

    let mimeType =
      String(blob.getContentType() || '').toLowerCase();

    if (
      mimeType !== 'image/png' &&
      mimeType !== 'image/jpeg' &&
      mimeType !== 'image/jpg'
    ) {
      const fileName =
        String(file.getName() || '').toLowerCase();

      mimeType = fileName.endsWith('.png')
        ? 'image/png'
        : 'image/jpeg';
    }

    return 'data:' +
      mimeType +
      ';base64,' +
      Utilities.base64Encode(bytes);

  } catch (error) {

    console.error(
      'Unable to load TWF signature:',
      error
    );

    return '';
  }
}


// ============================================================
// STUDENT PHOTO DATA URL
// ============================================================

function getStudentPhotoDataUrl_(fileId, fileUrl) {

  let id = String(fileId || '').trim();

  // Fallback: recover the Drive file ID from the saved URL if the
  // File ID column is empty for an older application.
  if (!id && fileUrl) {
    const match = String(fileUrl).match(/[-\w]{25,}/);
    if (match) {
      id = match[0];
    }
  }

  if (!id) {
    return '';
  }

  try {

    const file = DriveApp.getFileById(id);
    const blob = file.getBlob();
    const bytes = blob.getBytes();

    if (!bytes || bytes.length === 0) {
      return '';
    }

    let mimeType = String(blob.getContentType() || '').toLowerCase();

    // Some Drive files may return a generic content type.
    // Normalize it so the browser can render the image correctly.
    if (mimeType !== 'image/jpeg' &&
        mimeType !== 'image/png' &&
        mimeType !== 'image/jpg') {

      const name = String(file.getName() || '').toLowerCase();

      if (name.endsWith('.png')) {
        mimeType = 'image/png';
      } else {
        mimeType = 'image/jpeg';
      }
    }

    return 'data:' +
      mimeType +
      ';base64,' +
      Utilities.base64Encode(bytes);

  } catch (error) {

    console.error(
      'Unable to load student photo:',
      error
    );

    return '';
  }
}


// ============================================================
// ADMIT CARD LIVE CHECK
// ============================================================

function isAdmitCardLive_(applicationId) {

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CONFIG.ADMIT_CARD_SHEET);

  if (!sheet || sheet.getLastRow() < 2) {
    return false;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        13
      )
      .getValues();

  const id =
    String(applicationId || '')
      .trim()
      .toUpperCase();

  for (let i = 0; i < values.length; i++) {

    const row = values[i];

    if (
      String(row[0] || '')
        .trim()
        .toUpperCase() === id
    ) {

      return isYes_(row[12]);
    }
  }

  return false;
}


// ============================================================
// FIND APPLICATION
// ============================================================

function findApplication_(applicationId) {

  const id =
    String(applicationId || '')
      .trim()
      .toUpperCase();

  if (!id) {
    throw new Error('Please enter Application ID.');
  }

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CONFIG.APPLICATION_SHEET);

  if (!sheet) {
    throw new Error('Applications sheet not found.');
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        18
      )
      .getValues();

  for (let i = 0; i < values.length; i++) {

    const row = values[i];

    if (
      String(row[1] || '')
        .trim()
        .toUpperCase() === id
    ) {

      return {
        timestamp: row[0],
        applicationId: row[1],
        studentName: row[2],
        gender: row[3],
        dob: formatStoredDate_(row[4]),
        phone: row[5],
        email: row[6],
        school: row[7],
        board: row[8],
        otherBoard: row[9],
        district: row[10],
        examCentre: row[11],
        medium: row[12],
        address: row[13],
        photoFileId: row[14],
        photoUrl: row[15],
        admitCardDate: row[16],
        declaration: row[17]
      };
    }
  }

  return null;
}


// ============================================================
// TWF LOGO DATA URL
// ============================================================

function getTWFLogoDataUrl_() {

  const fileId =
    String(CONFIG.TWF_LOGO_FILE_ID || '').trim();

  if (!fileId) {
    return '';
  }

  try {

    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const bytes = blob.getBytes();

    if (!bytes || bytes.length === 0) {
      return '';
    }

    let mimeType =
      String(blob.getContentType() || '').toLowerCase();

    if (
      mimeType !== 'image/png' &&
      mimeType !== 'image/jpeg' &&
      mimeType !== 'image/jpg' &&
      mimeType !== 'image/webp'
    ) {
      const fileName =
        String(file.getName() || '').toLowerCase();

      if (fileName.endsWith('.webp')) {
        mimeType = 'image/webp';
      } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      } else {
        mimeType = 'image/png';
      }
    }

    return 'data:' +
      mimeType +
      ';base64,' +
      Utilities.base64Encode(bytes);

  } catch (error) {

    console.error(
      'Unable to load TWF logo:',
      error
    );

    return '';
  }
}


// ============================================================
// RESULT LOOKUP
// ============================================================

function checkResult(applicationId) {

  try {

    const id =
      String(applicationId || '')
        .trim()
        .toUpperCase();

    if (!id) {
      throw new Error('Please enter Application ID.');
    }

    const sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(CONFIG.RESULT_SHEET);

    if (!sheet) {
      throw new Error('Result Management sheet not found.');
    }

    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {

      return {
        success: true,
        published: false,
        message:
          'Result has not been published yet.'
      };
    }

    const values =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          10
        )
        .getValues();

    for (let i = 0; i < values.length; i++) {

      const row = values[i];

      if (
        String(row[0] || '')
          .trim()
          .toUpperCase() === id
      ) {

        const published =
          isYes_(row[9]);

        if (!published) {

          return {
            success: true,
            published: false,
            message:
              'Result has not been published yet.'
          };
        }

        return {
          success: true,
          published: true,
          applicationId: row[0],
          studentName: row[1],
          status: row[5],
          marks: row[6],
          rank: row[7],
          remarks: row[8],
          signatureDataUrl: getTWFSignatureDataUrl_(),
          logoDataUrl: getTWFLogoDataUrl_()
        };
      }
    }

    return {
      success: true,
      published: false,
      message:
        'No result found for this Application ID.'
    };

  } catch (error) {

    return {
      success: false,
      message: error.message
    };
  }
}


// ============================================================
// MANAGEMENT SHEET SYNC
// ============================================================

function syncManagementSheets_() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const applicationSheet =
    ss.getSheetByName(CONFIG.APPLICATION_SHEET);

  if (!applicationSheet) {
    throw new Error('Applications sheet not found.');
  }

  let admitSheet =
    ss.getSheetByName(CONFIG.ADMIT_CARD_SHEET);

  if (!admitSheet) {
    admitSheet = ss.insertSheet(CONFIG.ADMIT_CARD_SHEET);
  }

  let resultSheet =
    ss.getSheetByName(CONFIG.RESULT_SHEET);

  if (!resultSheet) {
    resultSheet = ss.insertSheet(CONFIG.RESULT_SHEET);
  }

  ensureManagementHeaders_(admitSheet, [
    'Application ID',
    'Student Name',
    'Gender',
    'Date of Birth',
    'Present School Name',
    '10th Board',
    'District',
    'Exam Centre',
    'Exam Paper Medium',
    'Full Address',
    'Application Date',
    'Photo File ID',
    'Admit Card Live?'
  ]);

  ensureManagementHeaders_(resultSheet, [
    'Application ID',
    'Student Name',
    'Date of Birth',
    '10th Board',
    'Exam Paper Medium',
    'Result Status',
    'Marks',
    'Rank',
    'Remarks',
    'Result Live?'
  ]);

  if (applicationSheet.getLastRow() < 2) {
    applyManagementValidation_();
    return;
  }

  const rows =
    applicationSheet
      .getRange(
        2,
        1,
        applicationSheet.getLastRow() - 1,
        18
      )
      .getValues();

  const existingAdmit =
    readManagementRows_(admitSheet, 13);

  const existingResult =
    readManagementRows_(resultSheet, 10);

  rows.forEach(function(row) {

    const id =
      String(row[1] || '').trim();

    if (!id) return;

    const admitExisting =
      existingAdmit[id];

    const resultExisting =
      existingResult[id];

    const admitRow = [
      id,
      row[2],
      row[3],
      formatStoredDate_(row[4]),
      row[7],
      row[8],
      row[10],
      row[11],
      row[12],
      row[13],
      formatDate_(row[0]),
      row[14],
      admitExisting
        ? admitExisting[12]
        : 'No'
    ];

    upsertManagementRow_(
      admitSheet,
      existingAdmit,
      id,
      admitRow,
      13
    );

    const resultRow = [
      id,
      row[2],
      formatStoredDate_(row[4]),
      row[8],
      row[12],
      resultExisting
        ? resultExisting[5]
        : '',
      resultExisting
        ? resultExisting[6]
        : '',
      resultExisting
        ? resultExisting[7]
        : '',
      resultExisting
        ? resultExisting[8]
        : '',
      resultExisting
        ? resultExisting[9]
        : 'No'
    ];

    upsertManagementRow_(
      resultSheet,
      existingResult,
      id,
      resultRow,
      10
    );
  });

  applyManagementValidation_();
}


function ensureManagementHeaders_(sheet, headers) {

  if (sheet.getLastRow() === 0) {

    sheet
      .getRange(1, 1, 1, headers.length)
      .setValues([headers]);

    sheet
      .getRange(1, 1, 1, headers.length)
      .setFontWeight('bold');

    sheet.setFrozenRows(1);

    return;
  }

  const current =
    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .getValues()[0];

  const matches =
    headers.every(function(header, index) {
      return String(current[index] || '').trim() === header;
    });

  if (!matches) {

    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .setValues([headers]);

    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .setFontWeight('bold');

    sheet.setFrozenRows(1);
  }
}


function readManagementRows_(sheet, columnCount) {

  const map = {};

  if (!sheet || sheet.getLastRow() < 2) {
    return map;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        columnCount
      )
      .getValues();

  values.forEach(function(row, index) {

    const id =
      String(row[0] || '').trim();

    if (id) {
      row._rowNumber = index + 2;
      map[id] = row;
    }
  });

  return map;
}


function upsertManagementRow_(
  sheet,
  existingMap,
  applicationId,
  row,
  columnCount
) {

  const existing =
    existingMap[applicationId];

  if (existing && existing._rowNumber) {

    sheet
      .getRange(
        existing._rowNumber,
        1,
        1,
        columnCount
      )
      .setValues([row]);

    return;
  }

  // Find the row again because existingMap stores row data.
  const values =
    sheet.getLastRow() < 2
      ? []
      : sheet
          .getRange(
            2,
            1,
            sheet.getLastRow() - 1,
            1
          )
          .getValues();

  let foundRow = 0;

  for (let i = 0; i < values.length; i++) {

    if (
      String(values[i][0] || '').trim() ===
      applicationId
    ) {
      foundRow = i + 2;
      break;
    }
  }

  if (foundRow) {

    sheet
      .getRange(
        foundRow,
        1,
        1,
        columnCount
      )
      .setValues([row]);

  } else {

    sheet.appendRow(row);
  }
}


function applyManagementValidation_() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const admitSheet =
    ss.getSheetByName(CONFIG.ADMIT_CARD_SHEET);

  const resultSheet =
    ss.getSheetByName(CONFIG.RESULT_SHEET);

  const rule =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        ['Yes', 'No'],
        true
      )
      .setAllowInvalid(false)
      .build();

  if (admitSheet) {

    const rows =
      Math.max(admitSheet.getMaxRows() - 1, 1);

    admitSheet
      .getRange(2, 13, rows, 1)
      .setDataValidation(rule);
  }

  if (resultSheet) {

    const rows =
      Math.max(resultSheet.getMaxRows() - 1, 1);

    resultSheet
      .getRange(2, 10, rows, 1)
      .setDataValidation(rule);
  }
}


function isYes_(value) {

  return (
    String(value || '')
      .trim()
      .toLowerCase() === 'yes' ||
    value === true
  );
}


// ============================================================
// STUDENT CONFIRMATION EMAIL
// ============================================================

function sendStudentConfirmationEmail_(data) {

  const subject =
    '🎉 Application Successfully Submitted – ' +
    CONFIG.EXAM_NAME;

  const htmlBody = buildStudentEmail_(data);

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.FOUNDATION_NAME
  });
}


// ============================================================
// STUDENT EMAIL HTML
// ============================================================

function buildStudentEmail_(data) {

  return `
  <div style="
    margin:0;
    padding:30px 15px;
    background:#f5f5f5;
    font-family:Arial,Helvetica,sans-serif;
    color:#171717;
  ">

    <div style="
      max-width:700px;
      margin:auto;
      background:#ffffff;
      border-radius:18px;
      overflow:hidden;
      border:1px solid #e6e6e6;
    ">

      <div style="
        background:#111111;
        color:#ffffff;
        padding:28px;
        text-align:center;
      ">
        <div style="
          color:#ffd400;
          font-size:14px;
          font-weight:bold;
          letter-spacing:1px;
          text-transform:uppercase;
        ">
          ${CONFIG.FOUNDATION_NAME}
        </div>

        <h1 style="
          margin:10px 0 4px;
          font-size:26px;
        ">
          ${CONFIG.EXAM_NAME}
        </h1>

        <div style="color:#cccccc;">
          Application Confirmation
        </div>
      </div>

      <div style="padding:30px;">

        <h2 style="
          margin-top:0;
          color:#111111;
        ">
          🎉 Congratulations, ${escapeHtml_(data.studentName)}!
        </h2>

        <p style="
          font-size:15px;
          line-height:1.7;
        ">
          Your application for the
          <strong>${CONFIG.EXAM_NAME}</strong>
          has been successfully submitted.
        </p>

        <div style="
          background:#fff8cc;
          border:2px solid #ffd400;
          border-radius:14px;
          padding:20px;
          text-align:center;
          margin:25px 0;
        ">

          <div style="
            font-size:12px;
            text-transform:uppercase;
            font-weight:bold;
            color:#777777;
          ">
            Your Application ID
          </div>

          <div style="
            font-size:28px;
            font-weight:800;
            margin-top:8px;
            letter-spacing:1px;
          ">
            ${escapeHtml_(data.applicationId)}
          </div>

        </div>

        <p>
          <strong>Please keep your Application ID safe.</strong>
          You will need it to access your Admit Card and check your result.
        </p>

        <table style="
          width:100%;
          border-collapse:collapse;
          margin:20px 0;
        ">

          ${emailRow_('Student Name', data.studentName)}
          ${emailRow_('Gender', data.gender)}
          ${emailRow_('Date of Birth', data.dob)}
          ${emailRow_('Phone', data.phone)}
          ${emailRow_('Email', data.email)}
          ${emailRow_('School', data.school)}
          ${emailRow_('10th Board', data.board)}
          ${emailRow_('District', data.district)}
          ${emailRow_('Examination Centre', data.examCentre)}
          ${emailRow_('Exam Paper Medium', data.medium)}
          ${emailRow_('Examination Date', getExaminationDate_())}
          ${emailRow_('Application Date', formatDate_(data.timestamp))}

        </table>

        <div style="
          margin-top:25px;
          padding:20px;
          border-radius:14px;
          background:#f6f6f6;
        ">

          <strong>🪪 Admit Card</strong>

          <p style="
            line-height:1.6;
            margin-bottom:0;
          ">
            Your Admit Card will be made available after it is
            released by the Examination Team. Please use the
            Student Portal to check availability.
          </p>

        </div>

        <div style="
          margin-top:30px;
          padding:22px;
          border-top:1px solid #eeeeee;
          text-align:center;
        ">

          <div style="
            font-size:19px;
            font-weight:bold;
          ">
            🌟 Best wishes for your examination!
          </div>

          <p style="
            color:#555555;
            line-height:1.7;
          ">
            Believe in yourself, prepare well and give it your very best.
            We wish you success in the Tabasheer Welfare Foundation
            Talent Hunt Examination.
          </p>

          <strong>
            Examination Team<br>
            ${CONFIG.FOUNDATION_NAME}
          </strong>

        </div>

      </div>

    </div>

  </div>
  `;
}


// ============================================================
// ADMIN EMAIL
// ============================================================

function sendAdminNotificationEmail_(data) {

  const subject =
    'New Talent Hunt Application - ' +
    data.applicationId +
    ' - ' +
    data.studentName;

  const htmlBody = `
  <div style="
    font-family:Arial,Helvetica,sans-serif;
    max-width:700px;
    margin:auto;
  ">

    <h2>
      New Talent Hunt Examination Application
    </h2>

    <p>
      A new student application has been submitted.
    </p>

    <table style="
      width:100%;
      border-collapse:collapse;
    ">

      ${emailRow_('Application ID', data.applicationId)}
      ${emailRow_('Student Name', data.studentName)}
      ${emailRow_('Email', data.email)}
      ${emailRow_('Phone', data.phone)}
      ${emailRow_('School', data.school)}
      ${emailRow_('10th Board', data.board)}
      ${emailRow_('District', data.district)}
      ${emailRow_('Exam Centre', data.examCentre)}
      ${emailRow_('Medium', data.medium)}
      ${emailRow_('Examination Date', getExaminationDate_())}
      ${emailRow_('Application Date', formatDate_(data.timestamp))}

    </table>

  </div>
  `;

  CONFIG.ADMIN_EMAILS.forEach(function(email) {

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      name: CONFIG.FOUNDATION_NAME
    });

  });
}


// ============================================================
// EMAIL TABLE ROW
// ============================================================

function emailRow_(label, value) {

  return `
    <tr>
      <td style="
        border:1px solid #eeeeee;
        padding:10px;
        background:#f7f7f7;
        font-weight:bold;
        width:38%;
      ">
        ${escapeHtml_(label)}
      </td>

      <td style="
        border:1px solid #eeeeee;
        padding:10px;
      ">
        ${escapeHtml_(value)}
      </td>
    </tr>
  `;
}


// ============================================================
// EXAMINATION DATE
// ============================================================

function getExaminationDate_() {

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CONFIG.EXAM_SETTINGS_SHEET);

  if (!sheet) return '';

  const value = sheet.getRange('B2').getValue();

  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(
      value,
      CONFIG.TIMEZONE,
      'dd MMMM yyyy'
    );
  }

  const textValue = String(value).trim();

  if (!textValue) return '';

  const parsed = new Date(textValue);

  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(
      parsed,
      CONFIG.TIMEZONE,
      'dd MMMM yyyy'
    );
  }

  return textValue;
}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate_(date) {

  if (!date) return '';

  return Utilities.formatDate(
    new Date(date),
    CONFIG.TIMEZONE,
    'dd MMMM yyyy'
  );
}


function formatStoredDate_(value) {

  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]') {

    return Utilities.formatDate(
      value,
      CONFIG.TIMEZONE,
      'dd/MM/yyyy'
    );
  }

  return String(value);
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml_(value) {

  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// VERCEL API BRIDGE
// ============================================================

function doPost(e) {
  try {
    var body = {};

    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: "Google Apps Script API is working.",
        action: body.action || "",
        received: true
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {

    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
