/**
 * XII Party RSVP — Google Apps Script web app
 *
 * Receives RSVPs from the GitHub Pages site and writes them to the
 * "Party RSVPs" tab of the XII Google Sheet. Also returns a live headcount.
 *
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Then paste the /exec URL into SCRIPT_URL in index.html.
 */

const SHEET_ID = '1Awy-KgfNtf8IBAZf-nY8pmv26n0juNk28IRTfN0usn4';
const TAB_NAME = 'Party RSVPs';
const HEADERS  = ['Submitted', 'Name', 'Email', 'Phone', 'Office', 'Attending', 'Guests', 'Guest Name', 'Notes', 'Updated'];
const MAX_GUESTS = 1; // one guest per employee

// Optional: get an email each time someone RSVPs. Leave '' to turn off.
const NOTIFY_EMAIL = '';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Honeypot: bots fill hidden fields, people don't.
    if (d.website) return json_({ ok: true });

    const name      = clean_(d.name, 80);
    const email     = clean_(d.email, 120).toLowerCase();
    const phone     = String(d.phone || '').replace(/[^0-9+()\-. ]/g, '').trim().slice(0, 30);
    const office    = clean_(d.office, 40);
    const attending = d.attending === 'Yes' ? 'Yes' : 'No';
    const guests    = attending === 'Yes' ? Math.max(0, Math.min(MAX_GUESTS, parseInt(d.guests, 10) || 0)) : 0;
    const guestName = guests > 0 ? clean_(d.guestName, 80) : '';
    const notes     = clean_(d.notes, 500);

    if (!name)           return json_({ ok: false, error: 'Name is required.' });
    if (!email && !phone) return json_({ ok: false, error: 'Email or phone is required.' });
    if (guests > 0 && !guestName) return json_({ ok: false, error: "Your guest's name is required." });
    if (attending === 'Yes' && d.footwear !== true) return json_({ ok: false, error: 'Please confirm the footwear rules.' });

    const sh = sheet_();
    const now = new Date();
    const phoneDigits = phone.replace(/\D/g, '');

    // Match an existing RSVP by email or phone so people can change their answer.
    const last = sh.getLastRow();
    let rowIndex = -1;
    if (last > 1) {
      const rows = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
      for (let i = 0; i < rows.length; i++) {
        const rEmail = String(rows[i][2]).toLowerCase().trim();
        const rPhone = String(rows[i][3]).replace(/\D/g, '');
        if ((email && rEmail === email) || (phoneDigits && rPhone === phoneDigits)) {
          rowIndex = i + 2;
          break;
        }
      }
    }

    // Leading apostrophe stores phone as text (keeps "+1", stops formula injection).
    const record = [name, email, phone ? "'" + phone : '', office, attending, guests, guestName, notes];

    let updated = false;
    if (rowIndex > 0) {
      sh.getRange(rowIndex, 2, 1, record.length).setValues([record]);
      sh.getRange(rowIndex, HEADERS.length).setValue(now);
      updated = true;
    } else {
      sh.appendRow([now].concat(record).concat(['']));
    }

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL,
        'Party RSVP: ' + name + ' — ' + attending + (guests ? ' (+' + guests + ')' : ''),
        [name, email, phone, office, 'Attending: ' + attending, 'Guests: ' + guests + (guestName ? ' (' + guestName + ')' : ''), notes].join('\n'));
    }

    return json_({ ok: true, updated: updated });
  } catch (err) {
    return json_({ ok: false, error: 'Something went wrong. Please try again.' });
  } finally {
    lock.releaseLock();
  }
}

// Headcount for the page: { going: <people saying yes>, total: <yes + their guests> }
function doGet() {
  const sh = sheet_();
  const last = sh.getLastRow();
  let going = 0, total = 0;
  if (last > 1) {
    sh.getRange(2, 6, last - 1, 2).getValues().forEach(function (r) {
      if (r[0] === 'Yes') { going++; total += 1 + (Number(r[1]) || 0); }
    });
  }
  return json_({ ok: true, going: going, total: total });
}

function sheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(TAB_NAME);
  if (!sh) {
    sh = ss.insertSheet(TAB_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function clean_(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // block spreadsheet formula injection
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run once from the editor to create the tab and grant permissions.
function setup() {
  sheet_();
}
