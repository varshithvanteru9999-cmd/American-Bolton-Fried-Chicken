# Deploying to Hostinger (hPanel)

Written for: whoever is publishing this site — no build tooling knowledge assumed.

This is a static single-page app. Hostinger shared hosting serves it as plain
files; there is no Node process running on the server.

---

## Before the first deploy

### 1. Set up Firebase Auth (required for admin access)

The admin dashboard has **no password fallback in production**. Firebase is the
only way in. Without it, `/admin` is unreachable.

1. Create a project at <https://console.firebase.google.com>
2. **Authentication → Sign-in method →** enable **Email/Password**
3. **Authentication → Users → Add user**, using the address in
   `src/admin/adminConfig.js` (`admin@americanfriedchicken.co.uk`) or your own
4. **Project settings → General → Your apps → Web app** — copy the config values
5. Create a `.env` file in the project root:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Who may reach the dashboard (comma-separated)
VITE_ADMIN_EMAILS=admin@americanfriedchicken.co.uk

# Leave EMPTY. Only used on a dev machine; compiled out of production builds.
VITE_ADMIN_PASSWORD=
```

6. In Firebase, add your live domain under
   **Authentication → Settings → Authorized domains**, or sign-in is refused.

> These `VITE_` values are baked into the JavaScript at build time and are
> visible to anyone who views the site. That is expected for Firebase web keys —
> they identify the project, they do not grant access. Access is controlled by
> Firebase Auth and your Firestore security rules. Never put a password,
> private key or admin secret in a `VITE_` variable.

### 2. Replace the placeholder business details

`src/data/brand.js` contains **invented** Bolton details (address, postcode,
email). They also appear in the Terms and Privacy pages, which name a real
trading entity. Replace them before going live.

### 3. Set the menu prices

Every item is `0.00`. Set real prices in the admin dashboard *before* taking
public orders, or customers can order everything free.

---

## Build

```bash
npm install     # first time only
npm run build
```

Output lands in `dist/`. Build it locally — Hostinger shared hosting cannot run
the build itself.

---

## Upload

**hPanel → Files → File Manager**, then open `public_html`.

1. Delete any existing contents (or move them aside first)
2. Upload **everything inside `dist/`** — the *contents*, not the folder itself
3. Confirm `.htaccess` made it across. File Manager hides dotfiles by default:
   **Settings → Show hidden files**

`public_html` should then contain:

```
index.html
.htaccess
sw.js
registerSW.js
manifest.webmanifest
assets/
images/
Logo.png  icon-192.png  icon-512.png  ...
```

FTP works equally well (**hPanel → Files → FTP Accounts**) — upload the same
contents to `/public_html`.

---

## After uploading

- [ ] Home page loads
- [ ] **Refresh on `/about`** — must not 404. If it does, `.htaccess` is missing
      or `mod_rewrite` is off
- [ ] `/admin/login` signs in with the Firebase user
- [ ] Menu images load
- [ ] Check on a phone
- [ ] Enable **SSL** (hPanel → Security → SSL) and force HTTPS — the PWA and
      service worker require it

---

## Redeploying

```bash
npm run build
```

Then re-upload `dist/` contents. `.htaccess` tells browsers never to cache
`index.html` or `sw.js`, so visitors pick up new builds on their next visit
without a hard refresh.

---

## Known gaps

These are unfinished, not bugs:

- **Payments are simulated.** Checkout does not take money.
- **Legal pages are adapted boilerplate.** Have someone check them, especially
  the payment and refund clauses, which describe a flow that does not exist yet.
- **Seven items have placeholder images** (the six milkshakes and the Tango can)
  — upload real photos from the admin dashboard.
