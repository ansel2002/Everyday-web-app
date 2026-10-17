# Sign-in setup: Google, and email links through Gmail

Supabase's built-in email service is for testing only and sends just a few emails per hour, so sign-in links stop arriving.
Everyday avoids that limit in two ways:

1. **Continue with Google** sends no email at all, so there is no limit.
2. **Email links** still work as a backup, but they go out through your own Gmail account (about 500 per day) instead of Supabase's test service.

Your end-to-end encryption does not change. Signing in only proves who you are. Your passphrase still unlocks your data, and it never leaves your device.

---

## Part A: Send email links through Gmail (about 10 minutes)

### 1. Create a Gmail app password

1. Turn on **2-Step Verification** for your Google account: https://myaccount.google.com/signinoptions/twosv (app passwords need it).
2. Open https://myaccount.google.com/apppasswords.
3. Name it `Everyday Supabase` and click **Create**.
4. Copy the 16-character password it shows. You will paste it into Supabase in the next step. Don't save it anywhere else.

### 2. Connect Gmail to Supabase

In the Supabase dashboard for project `raefbogputkvicevfrwa`, go to **Authentication → Emails → SMTP Settings** and turn on **Enable custom SMTP**:

| Field | Value |
|---|---|
| Sender email address | your Gmail address |
| Sender name | `Everyday` |
| Host | `smtp.gmail.com` |
| Port | `465` |
| Username | your Gmail address |
| Password | the 16-character app password |

Click **Save**.

### 3. Raise the email limit

Go to **Authentication → Rate Limits**. Set **Rate limit for sending emails** to `30` per hour, or higher if you expect more people, and save.

That's it. Email links now come from your Gmail.

---

## Part B: Add "Continue with Google" (about 15 minutes)

### 1. Create a Google Cloud project

1. Open https://console.cloud.google.com and sign in.
2. At the top, open the project picker, click **New project**, name it `Everyday` and click **Create**. Make sure it is selected.

### 2. Set up the consent screen

Go to **APIs & Services → OAuth consent screen**. Newer consoles call it **Google Auth Platform → Branding**.

1. **App name:** `Everyday`. **User support email:** your email.
2. **Audience:** **External**.
3. **Contact information:** your email. Then finish.
4. Under **Audience**, click **Publish app** and confirm, so anyone can sign in, not only test users. Everyday only asks for basic profile and email, so Google does not need to review it.

### 3. Create the OAuth client

Go to **APIs & Services → Credentials** (or **Google Auth Platform → Clients**). Click **Create credentials → OAuth client ID**, then:

- **Application type:** Web application. **Name:** `Everyday web`.
- **Authorized JavaScript origins:**
  - `https://everyday-quiet-mornings.netlify.app`
  - `http://localhost:5173`
- **Authorized redirect URIs:**
  - `https://raefbogputkvicevfrwa.supabase.co/auth/v1/callback`

Click **Create**. Keep the window with the **Client ID** and **Client secret** open.

### 4. Turn on Google in Supabase

In Supabase, go to **Authentication → Sign In / Providers → Google**:

1. Turn on **Enable Sign in with Google**.
2. Paste the **Client ID** and the **Client secret**.
3. Click **Save**.

Check **Authentication → URL Configuration** still lists `https://everyday-quiet-mornings.netlify.app` (Site URL and Redirect URLs). That's where Google sends people back.

### 5. Switch the button on in the app

Set `VITE_GOOGLE_SIGN_IN=on` in `everyday/.env.local`, then deploy:

```bash
cd everyday
npm run deploy
```

Until this setting is on, the live app hides the Google button, so nobody sees a button that doesn't work yet.

---

## Good to know

- **Same account either way.** If you sign in with a Gmail email link and later with Google using the same address, Supabase links them into one account, so the same passphrase opens the same data.
- **Privacy.** Google tells Supabase your name, email and profile picture. Everyday only uses the email to identify your account. Your journal, moods and habits are encrypted on your device and never readable by Google or Supabase.
- **Gmail limits.** A personal Gmail account can send about 500 emails a day. For more, use a dedicated email provider with your own domain, connected with the same SMTP settings.
