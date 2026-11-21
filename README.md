# XII Party RSVP

One-page party invite with an RSVP form. Hosted on GitHub Pages, RSVPs saved to the **Party RSVPs** tab of the XII Google Sheet through a Google Apps Script web app. Employees don't sign in.

## Files

| File | What it is |
|---|---|
| `index.html` | The page. All party details are in the `EDIT THIS BLOCK` section near the bottom. |
| `banner.jpg` | The flyer banner (compressed to ~360 KB). Must sit next to `index.html` in the repo. |
| `Code.gs` | The Apps Script that writes RSVPs to the sheet and returns the headcount. Doesn't go in the repo. |

## Setup (about 10 minutes)

### 1. Create the Apps Script
1. Open the XII Google Sheet → **Extensions → Apps Script**. (Or create a standalone project at script.google.com — `Code.gs` opens the sheet by ID either way.)
2. Replace the contents of `Code.gs` with the file from this folder. Save.
3. In the function dropdown pick **setup** → **Run**. Approve the permissions. This creates the **Party RSVPs** tab with these columns: Submitted, Name, Email, Phone, Office, Attending, Guests, Guest Name, Notes, Updated.
   - If a **Party RSVPs** tab already exists from the earlier version, delete it first so it's recreated with the Guest Name column.

### 2. Deploy it as a web app
1. **Deploy → New deployment** → type **Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Click **Deploy** and copy the **Web app URL** (ends in `/exec`).

### 3. Connect the page
1. In `index.html`, paste that URL into `SCRIPT_URL`.
2. Fill in the `EVENT` block: title, date, time, location, schedule, RSVP-by date.

### 4. Publish on GitHub Pages
1. On GitHub, create a new repo under `runx12` (e.g. `xii-party`). It must be **public** for free GitHub Pages.
2. Upload `index.html` and `banner.jpg` (and this README if you want).
3. **Settings → Pages** → Source: **Deploy from a branch** → `main` / `root` → Save.
4. After a minute the page is live at `https://runx12.github.io/xii-party/`.

## Good to know
- **Rules the form enforces (in the page and the script):** one guest max, the guest's name is required when bringing one, and anyone attending must tick the footwear checkbox.
- **Changing an answer:** someone who submits again with the same email or phone updates their existing row instead of adding a new one.
- **Editing Code.gs later:** use **Deploy → Manage deployments → Edit → Version: New version**. That keeps the same URL. A *new deployment* gives a new URL you'd have to paste again.
- **Email alerts:** set `NOTIFY_EMAIL` in `Code.gs` to get an email per RSVP.
- **Headcount:** the page shows "Going / With guests" totals. Set `showHeadcount: false` to hide them.
- **Privacy:** the web app only accepts new RSVPs and returns the two totals. It never sends names or contact info back to the page.
