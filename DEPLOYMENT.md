# Deploying Your Own Copy

This guide walks you through putting your own private copy of the Negotiation Simulator online, so you can use it with your own class. **No coding experience is required** — every step below is either clicking buttons in a web dashboard or copy-pasting a command into a terminal exactly as written.

It takes about 30–45 minutes the first time. Everything in this guide runs on free tiers (see [Cost](#cost) below) — the only thing you'll actually pay for is Claude API usage, which is billed by Anthropic per message and is typically a few cents per negotiation session.

**What you'll end up with**: your own private website (e.g. `your-class.vercel.app`) where you log in as an instructor to build negotiation scenarios and assign them to your students, and your students log in to practice negotiating with an AI and get feedback.

## Before you start

Create free accounts on these three sites (you'll need all of them):

1. **[GitHub](https://github.com/signup)** — hosts your copy of the code
2. **[Railway](https://railway.app)** — runs the backend server and database
3. **[Vercel](https://vercel.com)** — hosts the website your students and you will actually visit

You'll also need a **Claude API key** — see [Part 2](#part-2-get-a-claude-api-key) below.

---

## Part 1: Get your own copy of the code

1. Go to the project's GitHub page: **https://github.com/brandon-mattalo/negotiation-simulator**
2. Click the **Fork** button near the top-right of the page. This creates your own private/public copy under your own GitHub account that you fully control — changes to the original project won't affect your copy, and vice versa.
3. That's it — you now have your own copy at `https://github.com/YOUR-USERNAME/negotiation-simulator`. Everything below deploys *that* copy.

## Part 2: Get a Claude API key

This is what powers the AI negotiation partner and the automatic feedback.

1. Go to **https://console.anthropic.com/** and sign up.
2. Add a small amount of credit (e.g. $5–10 is plenty to start — it's pay-as-you-go, not a subscription).
3. Go to **API Keys** → **Create Key**. Copy the key somewhere safe (it starts with `sk-ant-`) — you'll paste it into Railway in the next part.

## Part 3: Deploy the backend (Railway)

The "backend" is the server and database that store everything — accounts, scenarios, negotiation transcripts. This is invisible to your students; they only ever see the website from Part 4.

1. Go to **https://railway.app** and sign in with your GitHub account.
2. Click **New Project** → **Deploy from GitHub repo** → select your fork (`YOUR-USERNAME/negotiation-simulator`).
3. Railway will try to build the whole repository at once, which won't work — it needs to be told the backend lives in the `backend` folder:
   - Click on the new service it created → **Settings** tab.
   - Under **Source**, set **Root Directory** to `backend`.
   - Under **Deploy**, set **Build Command** to `npm install && npm run build` and **Start Command** to `npm start`.
4. Add a database: in your Railway project, click **New** → **Database** → **Add PostgreSQL**. Railway automatically connects it to your backend service and sets a `DATABASE_URL` variable for you — you don't need to type this one in yourself.
5. Click on your backend service → **Variables** tab → **Add variables**, and add these (see the [full reference table](#environment-variable-reference) below for what each one does):

   | Variable | Value |
   |---|---|
   | `JWT_SECRET` | A random secret — generate one by running `openssl rand -hex 32` in a terminal (macOS/Linux) and pasting the output |
   | `CLAUDE_API_KEY` | The key you copied in Part 2 |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | Leave this blank for now — you'll fill it in during Part 5 |

   (`PORT` and `DATABASE_URL` are set automatically by Railway — don't add them yourself.)

6. Railway will now build and deploy. Once it's running, give it a public address: **Settings** → **Networking** → **Generate Domain**. Copy this URL (something like `https://your-app.up.railway.app`) — you'll need it in Part 4.

## Part 4: Deploy the frontend (Vercel)

The "frontend" is the actual website you and your students will visit.

1. Go to **https://vercel.com** and sign in with your GitHub account.
2. Click **Add New** → **Project** → import your fork (`YOUR-USERNAME/negotiation-simulator`).
3. Vercel will ask you to configure the project:
   - **Root Directory**: click **Edit** and select `frontend`.
   - **Framework Preset**: it should auto-detect **Vite** — leave it as-is.
4. Expand **Environment Variables** and add one:
   - `VITE_API_URL` = your Railway URL from Part 3, **with `/api` on the end** — e.g. `https://your-app.up.railway.app/api`
5. Click **Deploy**. When it finishes, copy the URL it gives you (e.g. `https://your-class.vercel.app`) — this is the link you'll share with your class.

## Part 5: Connect the two halves

Right now the backend doesn't know your frontend's address yet, so it will reject requests from it (a browser security protection called CORS).

1. Go back to **Railway** → your backend service → **Variables**.
2. Set `FRONTEND_URL` to your Vercel URL from Part 4 (e.g. `https://your-class.vercel.app`) — no trailing slash.
3. Railway automatically redeploys when you change a variable. Wait for it to finish (~1 minute).

## Part 6: Create your first account

There's no public "sign up" page — on purpose. **Only an instructor can create accounts, and only for students** (never for other instructors), so a one-time setup script creates just your own first login. Everyone else's account — your real students — gets created afterwards from inside the app itself, not from a script.

You'll run this from your own computer, pointed at your live Railway database, following the exact same pattern as every other one-off command in this guide:

1. On your computer, clone your fork and install the backend's dependencies:
   ```bash
   git clone https://github.com/YOUR-USERNAME/negotiation-simulator.git
   cd negotiation-simulator/backend
   npm install
   ```
2. Get your database's connection string: in Railway, click your **Postgres** service → **Connect** tab → copy the connection string shown there.
3. Run the setup script against it:
   ```bash
   DATABASE_URL="paste-your-connection-string-here" npm run create-instructor
   ```
   This creates exactly one instructor account (username `instructor` by default — set `INSTRUCTOR_USERNAME`/`INSTRUCTOR_PASSWORD` before running the command if you'd rather choose your own). The username and password are printed to your terminal — write them down, they aren't saved anywhere else.
4. Also seed the built-in scenario templates (salary negotiation, vendor contract, etc.) so you have something to start from:
   ```bash
   DATABASE_URL="paste-your-connection-string-here" npm run prisma:seed
   ```
5. Log in at your Vercel URL with the credentials from step 3, go to the **Students** page, and click **Create Student** for each of your real students. Each one gets an automatically generated, anonymous username (e.g. `quick-fox-482`) and a password you can either set yourself or generate randomly — there's no free-text username field, so there's no way a real name or other identifying text ends up as a login. The credentials are shown once after creation; use **Export Credentials** on that same page any time you need the full list again (as long as `ENCRYPTION_KEY` — see the reference table below — is set; otherwise, copy each password down when the account is created, since it can't be recovered later).

**Adding colleagues as instructors**: the account from step 3 is an **admin** — it has one extra capability regular instructors don't: an **Instructors** page (only admins see it in the sidebar) where you can create login accounts for colleagues, optionally marking any of them as admins too. Unlike students, instructor usernames aren't anonymized — you pick one when creating the account, since these are named colleagues, not students needing privacy protection. An admin can also deactivate a colleague's account (e.g. if they leave) without deleting their data, and reactivate it later; the system won't let an admin deactivate their own account or leave the deployment with zero active admins.

## Part 7 (optional): The public one-click demo login

If you want a `/reviewer` page anyone can use to try the app instantly (e.g. to link from a paper, syllabus, or conference talk) without needing real login credentials, run one more script and set a few variables. This is entirely separate from Part 6 — it creates two dedicated demo accounts, not real students.

1. Create the demo accounts the same way you created your instructor account:
   ```bash
   DATABASE_URL="paste-your-connection-string-here" npm run seed:reviewer-accounts
   ```
   This prints passwords for `reviewer-prof` and `reviewer-student` — copy them into Railway's `REVIEWER_PROF_PASSWORD`/`REVIEWER_STUDENT_PASSWORD` variables (see the reference table below) for the one-click login to work.
2. Because this link is public, the app automatically limits how much a visitor can do with it (usage caps, and an hourly reset of anything a visitor edits) — see the "Reviewer demo" rows in the reference table to configure or fine-tune this. In particular, log in as `reviewer-prof` and set up the demo scenario exactly how you want visitors to see it, **then** run `DATABASE_URL="..." npm run reviewer:capture-baseline`, so the hourly reset has something correct to restore to.

## Part 8: Test it

1. Visit your Vercel URL.
2. Log in as `instructor` and confirm you can see the Templates/Configurations pages.
3. Log in as one of your students (in a private/incognito window, so you're not logged into both at once) and confirm you can start a negotiation and chat with the bot.
4. End the session and confirm you get feedback.

If all four of those work, you're done — share your Vercel URL with your class.

---

## Environment Variable Reference

Everything the backend reads from Railway's **Variables** tab:

| Variable | Required? | What it's for |
|---|---|---|
| `DATABASE_URL` | Set automatically by Railway | Connects to your Postgres database |
| `PORT` | Set automatically by Railway | Which port the server listens on |
| `JWT_SECRET` | **Required** | Signs student/instructor login sessions. Generate with `openssl rand -hex 32` |
| `CLAUDE_API_KEY` | **Required** | Powers the AI negotiation partner and feedback. From console.anthropic.com |
| `NODE_ENV` | **Required** | Set to `production` |
| `FRONTEND_URL` | **Required** | Your Vercel URL — lets the backend accept requests from your site |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | Optional | Enables the voice (spoken) negotiation mode. From elevenlabs.io |
| `ENCRYPTION_KEY` | Optional, recommended | Lets instructors look up/export a student's forgotten password from the Students page. Generate with `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `REVIEWER_PROF_PASSWORD`, `REVIEWER_STUDENT_PASSWORD` | Optional | Enables the public `/reviewer` one-click demo login. Must match the passwords printed by `npm run seed:reviewer-accounts` (Part 7) |
| `REVIEWER_PROF_USERNAME`, `REVIEWER_STUDENT_USERNAME` | Optional | Only needed if you renamed those accounts away from the defaults |
| `REVIEWER_ACCOUNTS_ENABLED` | Optional | Emergency off switch for the `/reviewer` page — set to `false` to instantly disable it without redeploying code. Only visible/changeable to you in Railway; students and the public never see this |
| `REVIEWER_RESET_COOLDOWN_HOURS` | Optional (default `1`) | How often the public demo accounts' data resets back to the scenario you captured with `npm run reviewer:capture-baseline`. **This deletes any negotiation transcripts visitors created since the last reset** |
| `REVIEWER_SESSION_IDLE_TIMEOUT_MINUTES` | Optional (default `15`) | If a demo visitor abandons a negotiation without ending it, how long before the next visitor is unblocked |
| `REVIEWER_STUDENT_MAX_SESSIONS_PER_HOUR` | Optional (default `10`) | Caps how many negotiations the public demo can run per hour, to bound your Claude API bill |
| `REVIEWER_STUDENT_MAX_MESSAGES_PER_SESSION` | Optional (default `20`) | Caps how long a single public demo negotiation can run |

And on Vercel's **Environment Variables**:

| Variable | Required? | What it's for |
|---|---|---|
| `VITE_API_URL` | **Required** | Your Railway backend URL, with `/api` on the end |

---

## Cost

| Service | Free tier | What you're using it for |
|---|---|---|
| Railway | $5 credit/month | Backend server + database |
| Vercel | Free for personal/small projects | The website itself |
| Anthropic (Claude) | Pay-as-you-go, no free tier | Powers each negotiation — typically a few cents per session |
| ElevenLabs (optional) | Free tier available | Only if you enable voice mode |

A small class doing a handful of negotiation exercises per semester will typically stay within Railway and Vercel's free tiers; your only real ongoing cost is Claude API usage.

## Troubleshooting

**"CORS error" in the browser console when logging in** → `FRONTEND_URL` on Railway doesn't exactly match your Vercel URL (check for a trailing slash, `http` vs `https`, or `www.`).

**Frontend loads but every request fails / spinners forever** → `VITE_API_URL` on Vercel is wrong or missing `/api` at the end. After fixing it, you must **redeploy** the Vercel project — changing an environment variable alone doesn't rebuild the site.

**"Reviewer accounts are not configured on the server" when using `/reviewer`** → `REVIEWER_PROF_PASSWORD`/`REVIEWER_STUDENT_PASSWORD` aren't set on Railway, or don't match the passwords printed by `npm run seed:reviewer-accounts`.

**Railway build fails** → double-check **Root Directory** is set to `backend` under that service's Settings, not the repo root.

**Vercel build fails** → double-check **Root Directory** is set to `frontend`.

**Can't run `npm run create-instructor`** → make sure you're inside the `backend` folder and ran `npm install` first; double-check you copied the full Postgres connection string from Railway (including the password).

**Still stuck?** Open an issue on your fork's GitHub page describing exactly which step failed and any error message shown — include screenshots if you can.

## Security notes

- Never commit your `.env` file or any exported student credentials CSV to GitHub.
- Keep your `CLAUDE_API_KEY` and `JWT_SECRET` private — anyone with them could rack up charges on your Anthropic account or forge login sessions.
- If you enable the public `/reviewer` demo login, review the `REVIEWER_*` variables above — they exist specifically to limit what a public, unauthenticated-feeling visitor can do to your real class's data and your Claude API bill.
