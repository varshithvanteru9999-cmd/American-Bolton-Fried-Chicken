# Social Sign-In Setup (Firebase)

The sign-in popup ("Sign in to continue") supports **Google**, **Facebook**, and
**Microsoft**. The code is fully wired — you only need to create a free Firebase
project, enable the providers, and paste the config into `.env`.

Until that's done the app uses a **simulated** sign-in so the demo keeps working.

## 1. Create a Firebase project
1. Go to <https://console.firebase.google.com> → **Add project** (free Spark plan is fine).
2. In the project, open **Build → Authentication → Get started**.

## 2. Add a Web app + copy config
1. Project settings (⚙) → **General** → "Your apps" → **Web** (`</>`).
2. Register the app; copy the `firebaseConfig` values.
3. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
4. Restart `npm run dev` (Vite reads env at startup).

## 3. Enable the providers
In **Authentication → Sign-in method → Add new provider**:

- **Google** — toggle Enable, pick a support email. Done (Google OAuth is auto-managed).
- **Facebook** — create an app at <https://developers.facebook.com>, copy the
  **App ID** + **App Secret** into Firebase, then add Firebase's OAuth redirect URI
  to the Facebook app (Facebook Login → Settings → Valid OAuth Redirect URIs).
  Email permission needs Meta **App Review** before production.
- **Microsoft** — register an app in **Azure Portal → App registrations**, copy the
  **Application (client) ID** + a **client secret** into Firebase, and add Firebase's
  redirect URI (`https://<your-project>.firebaseapp.com/__/auth/handler`) to Azure.

## 4. Authorize your domains
**Authentication → Settings → Authorized domains**: add `localhost` (already there)
and your production domain (e.g. the Vercel URL) so the popup is allowed.

## Storing user data (Firestore)

Signed-in users' **profile** and **order history** are saved to **Cloud Firestore**
(`users/{uid}` and `users/{uid}/orders/{orderId}`). Guests fall back to localStorage.
To turn this on:

1. Firebase Console → **Build → Firestore Database → Create database**.
2. Choose a location and start in **production mode**.
3. Go to the **Rules** tab and paste the rules below (users access only their own
   data; admins can read everything and manage the menu), then **Publish**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function isAdmin() {
         return request.auth != null && request.auth.token.email in [
           'msfavouritechicken@gmail.com', 'varunvanteru9999@gmail.com'
         ];
       }
       // A user's profile + their orders
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
         allow read: if isAdmin();
         match /{document=**} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
           allow read: if isAdmin();
         }
       }
       // Top-level orders collection: any visitor (incl. guests) can place an
       // order; only the admin can read the full list / update / delete.
       match /orders/{orderId} {
         allow create: if true;
         allow read, update, delete: if isAdmin();
       }
       // Admin: read all orders across users + update status / delete
       match /{path=**}/orders/{orderId} {
         allow read, write: if isAdmin();
       }
       // Menu price/availability overrides + admin-added items/categories:
       // public read, admin write.
       match /menuConfig/{itemId} {
         allow read: if true;
         allow write: if isAdmin();
       }
       match /customMenuItems/{id} { allow read: if true; allow write: if isAdmin(); }
       match /customCategories/{id} { allow read: if true; allow write: if isAdmin(); }
       match /categoryConfig/{id} { allow read: if true; allow write: if isAdmin(); }
     }
   }
   ```
   (Keep the admin emails in the rules in sync with `ADMIN_EMAILS` in
   `src/admin/adminConfig.js`.)

### Quick demo rules (NOT for production)

If you just want the dashboard to show orders immediately — without creating a
Firebase Email/Password admin user — publish these instead. They let guests
place orders and let the dashboard read/manage them even when you're logged in
with the local `.env` password (no Firebase token). **This exposes order data
to anyone with the project keys — use only with dummy data, then switch to the
secure rules above before going live.**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
      match /{document=**} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
    match /orders/{orderId} {
      allow read, create, update, delete: if true;
    }
    match /menuConfig/{itemId} { allow read, write: if true; }
    match /customMenuItems/{id} { allow read, write: if true; }
    match /customCategories/{id} { allow read, write: if true; }
    match /categoryConfig/{id} { allow read, write: if true; }
    match /pushSubs/{id} { allow read, write, delete: if true; }
  }
}
```

Until Firestore is enabled the app still works — profile/order writes just fail
silently (logged as warnings) and orders stay in the current session/localStorage.

## Admin dashboard (`/admin`)

- Access is gated by an **email allowlist** in `src/admin/adminConfig.js`
  (override with `VITE_ADMIN_EMAILS=a@x.com,b@y.com` in `.env`). Signed-in admins
  also get an **Admin Dashboard** link in their navbar profile dropdown.
- Sections: **Overview** (totals + recent orders), **Orders** (all orders via a
  Firestore collection-group query), **Customers** (the `users` collection), and
  **Menu** (edit price / toggle availability → saved to `menuConfig`, applied live
  on the storefront).
- Requires Firestore enabled + the rules above published.

## How it works in code
- `src/firebase.js` — initializes Firebase from env; `isFirebaseConfigured` is true
  only when keys are present. `getProvider('google')`; exports `db` (Firestore).
- `src/context/CartContext.jsx` — `signInWithProvider(provider)` calls
  `signInWithPopup`; `onAuthStateChanged` keeps `user` in sync; `signOut()` calls
  Firebase sign-out. All fall back to the simulated user when not configured.
- The sign-in buttons live in the "Sign in to continue" popup (`OrderNow.jsx`).
