# 🚀 Ritik's Project Manager

A modern, card-based project management dashboard with cloud sync and admin protection.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-green)

## ✨ Features

- **Dashboard View**: Statistics cards showing project counts by status
- **4 Project Statuses**: Active, Published, Planned, Dead
- **Status-Specific Details**:
  - Active: Progress percentage bar
  - Published: Technologies, Live URL, GitHub link
  - Planned: Vision statement
  - Dead: Reason for discontinuation
- **Cloud Sync**: Supabase database integration
- **Admin Protection**: PIN-protected editing with SHA-256 hashing
- **Offline Support**: Falls back to localStorage when offline
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Tech Stack

- HTML5, CSS3, JavaScript (Vanilla)
- Supabase (PostgreSQL database)
- SHA-256 encryption for PIN

## 📦 Deployment

### Option 1: Netlify (Recommended - Free)

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag and drop your project folder
4. Done! Your site is live at `https://your-site.netlify.app`

### Option 2: Vercel (Free)

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **"Add New"** → **"Project"**
3. Import from Git or upload folder
4. Deploy!

### Option 3: GitHub Pages (Free)

1. Create a GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Go to repo **Settings** → **Pages**
4. Select **Branch: main** → **Save**
5. Your site: `https://YOUR_USERNAME.github.io/YOUR_REPO`

### Option 4: Cloudflare Pages (Free)

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your Git repository or upload directly
3. Deploy!

## 🔐 Admin Access

The dashboard is protected by a 4-digit PIN.

- **Default state**: Locked (view only)
- **To unlock**: Click 🔒 button → Enter PIN
- **To lock**: Click 🔓 button

### Change PIN

1. Generate SHA-256 hash of your new PIN:
   - Online: https://emn178.github.io/online-tools/sha256.html
   - Terminal: `echo -n "YOUR_PIN" | shasum -a 256`

2. Update `script.js` line ~33:
   ```javascript
   storedPinHash = 'YOUR_NEW_HASH_HERE';
   ```

## 🗄️ Database Setup (Supabase)

### Create Projects Table

```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  progress INTEGER,
  technologies TEXT,
  link TEXT,
  github TEXT,
  vision TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON projects FOR ALL USING (true);
```

### Update Credentials

In `script.js`, update lines 2-3:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

## 📁 File Structure

```
Projects/
├── index.html      # Main HTML structure
├── style.css       # All styling
├── script.js       # Application logic
└── README.md       # This file
```

## 🎨 Customization

### Colors
Edit `style.css`:
- Background: Line ~9 (navy blue gradient)
- Accent: Search for `#FF6B35` (orange)
- Status colors: Search for `.stat-card.stat-*`

### Status Types
To add/modify statuses, update:
1. HTML: Filter buttons and form select
2. CSS: Status-specific styles
3. JS: `getStatusDetails()` function

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

---

Made with ❤️ by Ritik
