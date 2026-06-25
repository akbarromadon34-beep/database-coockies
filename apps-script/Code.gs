const SHEET_NAME = 'Data';
const DEFAULT_APP_TOKEN = '1nqsHGV2pDst9P9qgink3zlG5bxXUfvUUNLAJ8TO2VaA';
const HEADERS = [
  'id',
  'category',
  'title',
  'uploadDate',
  'encryptedText',
  'iv',
  'salt',
  'fileName',
  'sizeBytes'
];

function setup() {
  initSheet_();
  PropertiesService.getScriptProperties().setProperty('APP_TOKEN', DEFAULT_APP_TOKEN);
}

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    const payload = parsePayload_(e);
    const token = payload.token || '';

    if (!isAuthorized_(token)) {
      return json_({ ok: false, error: 'Unauthorized. Token salah atau belum disetel.' });
    }

    const action = payload.action || 'list';

    if (action === 'list') {
      return json_({ ok: true, entries: listEntries_() });
    }

    if (action === 'add') {
      const saved = addEntry_(payload.entry || {});
      return json_({ ok: true, entry: saved });
    }

    if (action === 'delete') {
      deleteEntry_(payload.id);
      return json_({ ok: true });
    }

    return json_({ ok: false, error: 'Action tidak dikenal.' });
  } catch (err) {
    return json_({ ok: false, error: err.message || String(err) });
  }
}

function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      throw new Error('Payload JSON tidak valid.');
    }
  }
  return (e && e.parameter) ? e.parameter : {};
}

function isAuthorized_(token) {
  const savedToken = PropertiesService.getScriptProperties().getProperty('APP_TOKEN');
  return Boolean(savedToken) && token === savedToken;
}

function initSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = currentHeaders.join('') !== '';

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function listEntries_() {
  const sheet = initSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return values
    .filter(row => row[0])
    .map(rowToEntry_)
    .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
}

function addEntry_(entry) {
  const sheet = initSheet_();

  if (!entry.encryptedText || !entry.iv || !entry.salt) {
    throw new Error('Data terenkripsi tidak lengkap.');
  }

  const saved = {
    id: Utilities.getUuid(),
    category: sanitize_(entry.category || 'other'),
    title: sanitize_(entry.title || 'Tanpa Judul'),
    uploadDate: new Date().toISOString(),
    encryptedText: String(entry.encryptedText),
    iv: String(entry.iv),
    salt: String(entry.salt),
    fileName: sanitize_(entry.fileName || ''),
    sizeBytes: Number(entry.sizeBytes || 0)
  };

  sheet.appendRow(HEADERS.map(key => saved[key]));
  return saved;
}

function deleteEntry_(id) {
  if (!id) throw new Error('ID wajib diisi.');

  const sheet = initSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('Data kosong.');

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const index = ids.findIndex(value => value === id);

  if (index === -1) throw new Error('Data tidak ditemukan.');
  sheet.deleteRow(index + 2);
}

function rowToEntry_(row) {
  const entry = {};
  HEADERS.forEach((key, index) => {
    entry[key] = row[index];
  });
  return entry;
}

function sanitize_(value) {
  return String(value).replace(/[<>]/g, '').trim();
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
