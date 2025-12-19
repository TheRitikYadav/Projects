# 🚀 Ritik's Project Manager

A modern, card-based project management dashboard with cloud sync and admin protection.


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


1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your Git repository or upload directly
3. Deploy!

## 🔐 Admin Access

The dashboard is protected by a 4-digit PIN.

- **Default state**: Locked (view only)
- **To unlock**: Click 🔒 button → Enter PIN
- **To lock**: Click 🔓 button
