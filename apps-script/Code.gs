const CONTACT_RECIPIENT = 'rackvision1@gmail.com';
const CONTACT_SHEET_PROPERTY = 'RACKVISION_CONTACT_SHEET_ID';
const CONTACT_SHEET_NAME = 'Inquiries';
const CONTACT_HEADERS = [
  'Submission Date & Time',
  'Customer Name',
  'Company',
  'Phone',
  'Email',
  'Service Required',
  'Project Details'
];

/** Run once from the Apps Script editor while signed in to the receiving account. */
function setupRackVisionContact() {
  // Requests the MailApp authorization during setup, before the public form is deployed.
  MailApp.getRemainingDailyQuota();
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty(CONTACT_SHEET_PROPERTY);
  let spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create('RackVision Website Inquiries');
    spreadsheetId = spreadsheet.getId();
    properties.setProperty(CONTACT_SHEET_PROPERTY, spreadsheetId);
  }

  let sheet = spreadsheet.getSheetByName(CONTACT_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(CONTACT_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CONTACT_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CONTACT_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1f2937')
      .setFontColor('#ffffff');
    sheet.setColumnWidths(1, CONTACT_HEADERS.length, 180);
    sheet.setColumnWidth(7, 420);
  }

  Logger.log('RackVision inquiry sheet: ' + spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

/** Health check for confirming that the deployed /exec URL is active. */
function doGet() {
  return HtmlService.createHtmlOutput('RackVision contact endpoint is active.');
}

/** Accepts standard HTML form POSTs so the static site needs no exposed secrets. */
function doPost(e) {
  const values = (e && e.parameter) || {};

  // Quietly discard bot submissions that fill the off-screen honeypot.
  if (cleanText(values.website, 200)) return renderSubmissionResult('success');

  const submission = {
    name: cleanText(values.name, 150),
    company: cleanText(values.company, 200),
    phone: cleanText(values.phone, 80),
    email: cleanText(values.email, 254),
    service: cleanText(values.service, 200),
    message: cleanText(values.message, 5000)
  };

  if (!submission.name || !submission.email || !submission.message ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    return renderSubmissionResult('error');
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const cache = CacheService.getScriptCache();
    const duplicateKey = 'rv-contact-' + digestEmail(submission.email);
    if (cache.get(duplicateKey)) return renderSubmissionResult('error');

    const spreadsheetId = PropertiesService.getScriptProperties()
      .getProperty(CONTACT_SHEET_PROPERTY);
    if (!spreadsheetId) throw new Error('Contact sheet setup has not been run.');

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(CONTACT_SHEET_NAME);
    if (!sheet) throw new Error('Contact sheet tab is missing.');

    const submittedAt = new Date();
    const timeZone = Session.getScriptTimeZone() || 'Etc/UTC';
    const formattedTime = Utilities.formatDate(submittedAt, timeZone, 'yyyy-MM-dd HH:mm:ss z');
    const sheetRow = [
      submittedAt,
      safeSheetText(submission.name),
      safeSheetText(submission.company),
      safeSheetText(submission.phone),
      safeSheetText(submission.email),
      safeSheetText(submission.service),
      safeSheetText(submission.message)
    ];

    sheet.appendRow(sheetRow);
    sheet.getRange(sheet.getLastRow(), 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');

    const emailBody = [
      'A new inquiry was submitted through the RackVision website.',
      '',
      'Customer Name: ' + submission.name,
      'Company: ' + (submission.company || 'Not provided'),
      'Phone: ' + (submission.phone || 'Not provided'),
      'Email: ' + submission.email,
      'Service Required: ' + (submission.service || 'Not selected'),
      'Project Details: ' + submission.message,
      'Submission Date & Time: ' + formattedTime
    ].join('\n');

    MailApp.sendEmail({
      to: CONTACT_RECIPIENT,
      subject: 'New RackVision Website Inquiry',
      body: emailBody,
      replyTo: submission.email,
      name: 'RackVision Website'
    });

    // Avoid rapid duplicate submissions from the same email address.
    try { cache.put(duplicateKey, '1', 30); } catch (cacheError) {
      console.warn('Unable to set the duplicate-submission cache: ' + cacheError.message);
    }
    return renderSubmissionResult('success');
  } catch (error) {
    console.error('RackVision contact submission failed: ' + error.message);
    return renderSubmissionResult('error');
  } finally {
    try { lock.releaseLock(); } catch (ignored) { /* Lock was not acquired. */ }
  }
}

function cleanText(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim().slice(0, maxLength);
}

function safeSheetText(value) {
  const text = String(value || '');
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function digestEmail(email) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email.toLowerCase());
  return bytes.map(function (byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

function renderSubmissionResult(status) {
  const template = HtmlService.createTemplateFromFile('SubmissionResult');
  template.status = status === 'success' ? 'success' : 'error';
  // This response contains no controls or data; framing is used only for a verified parent postMessage callback.
  return template.evaluate()
    .setTitle('RackVision Contact Form')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
