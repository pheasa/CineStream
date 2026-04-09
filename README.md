# CineStream - Movie Streaming Platform

CineStream is a modern, full-stack movie streaming and management platform built with React, Express, and PostgreSQL.

## 🚀 Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file or in the **Settings** menu of the AI Studio Build environment:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_APP_NAME` | The name of your application | `CineStream` |
| `VITE_ADSENSE_CLIENT_ID` | Your Google AdSense Publisher ID | `ca-pub-XXXXXXXXXXXXXXXX` |
| `VITE_ADSENSE_HOME_SLOT` | AdSense Slot ID for Home page | `1234567890` |
| `VITE_ADSENSE_HOME_MID_SLOT` | AdSense Slot ID for Home Mid section | `7777777777` |
| `VITE_ADSENSE_HOME_BOTTOM_SLOT` | AdSense Slot ID for Home Bottom section | `8888888888` |
| `VITE_ADSENSE_CATEGORY_SLOT` | AdSense Slot ID for Category page | `0987654321` |
| `VITE_ADSENSE_CATEGORY_MID_SLOT` | AdSense Slot ID for Category page middle | `9999999999` |
| `VITE_ADSENSE_WATCH_SLOT` | AdSense Slot ID for Watch page sidebar | `1122334455` |
| `VITE_ADSENSE_WATCH_TOP_SLOT` | AdSense Slot ID for Watch page top of player | `4444444444` |
| `VITE_ADSENSE_WATCH_PLAYER_BOTTOM_SLOT` | AdSense Slot ID for Watch page bottom of player | `5555555555` |
| `VITE_ADSENSE_TOP_SLOT` | Global Top Ad Slot ID | `1111111111` |
| `VITE_ADSENSE_BOTTOM_SLOT` | Global Bottom Ad Slot ID | `2222222222` |
| `VITE_ADSENSE_POPUP_SLOT` | Global Popup Ad Slot ID | `3333333333` |
| `VITE_ADSENSE_INTERSTITIAL_SLOT` | Watch Page Interstitial Ad Slot ID | `6666666666` |
| `VITE_ADMIN_USERNAME` | Admin panel login username | `admin` |
| `VITE_ADMIN_PASSWORD` | Admin panel login password | `password123` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |

---

## 🔐 Admin Panel

The project includes a secure admin dashboard to manage your content.

- **URL**: `/admin/login`
- **Default Credentials**: Defined via `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD`.
- **Features**:
  - Add, Edit, and Delete Movies.
  - Manage Categories and Countries.
  - View basic site statistics.

---

## 🗄️ Database Migration Guide

This project uses PostgreSQL for data storage. The application is designed to handle migrations automatically, but you can also perform them manually.

### 1. Automatic Migration (Recommended)
The application features an "Init-on-Startup" mechanism. Every time the server starts, it runs the `initDb()` function which:
- Checks if the required tables (`movies`, `categories`, `countries`) exist.
- Creates them automatically if they are missing.
- Seeds the `categories` and `countries` tables with default data if they are empty.

**To trigger an automatic migration:**
Simply set your `DATABASE_URL` environment variable and restart the application.

### 2. Manual Migration
If you need to manually modify the schema (e.g., adding a new column), you can:

#### A. Update the Server Code
Modify the `initDb()` function in `server.ts` to include your `ALTER TABLE` commands:
```sql
-- Example: Adding a rating column
ALTER TABLE movies ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0;
```

#### B. Use a SQL Client
Connect to your database using a tool like **pgAdmin**, **DBeaver**, or **psql** and execute your SQL scripts directly.

### 3. Migrating from JSON to PostgreSQL
If you are moving from the legacy JSON storage to PostgreSQL:
1. Configure your `DATABASE_URL`.
2. Start the app to let it create the tables.
3. Use the **Admin Panel** (`/admin`) to re-upload or re-create your movie entries.

---

## 🛠️ Tech Stack
- **Frontend**: React, Tailwind CSS, Lucide React, Motion.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL.
- **Build Tool**: Vite.

## 📦 Installation & Setup

### Local Setup
1. Install dependencies: `npm install`
2. Configure your `.env` variables.
3. Start the development server: `npm run dev`

### Docker Setup (Recommended)
The easiest way to get started is using Docker Compose, which sets up both the application and the PostgreSQL database automatically.

1. Make sure you have **Docker** and **Docker Compose** installed.
2. Run the following command in the project root:
   ```bash
   docker-compose up --build
   ```
3. The application will be available at `http://localhost:3000`.
4. The database will persist its data in a Docker volume named `postgres_data`.
