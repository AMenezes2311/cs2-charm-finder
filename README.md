# Charm Scraper

Scrape CS2 tournament charm listings from csgoskins.gg, enrich them with Steam Market links, and explore them with filtering, sorting, and CSV export.

## Features

- Scrape any csgoskins.gg charm listing page server-side (POST `/api/scrape`).
- Deduplicates results and extracts title, price, rarity, popularity, rating, images, and Steam Market URLs.
- Client-side filtering, sort by price/title, and CSV export of the current view.
- Built with Next.js App Router (Node runtime) and Tailwind UI components.

## Prerequisites

- Node.js 20+ recommended (Next 15).
- npm (ships with Node). No extra environment variables are required.

## Setup

```bash
npm install
npm run dev
# visit http://localhost:3000
```

## Usage

1. Start the dev server and open the app.
2. Enter a player name (input builds the tournament charm URL under the hood) or paste any csgoskins.gg charm page URL.
3. Click "Fetch charms" to scrape; refine results via the filter box, sort toggles, or export the current view to CSV.

## API

- Endpoint: `POST /api/scrape`
- Body: `{ "url": "https://csgoskins.gg/..." }` (must be a csgoskins.gg URL)
- Response shape:

```json
{
  "count": 24,
  "steam": "https://steamcommunity.com/market/listings/730/...",
  "items": [
    {
      "title": "Souvenir Charm | ...",
      "href": "https://csgoskins.gg/items/charm-...",
      "image": "https://...",
      "price": 12.34,
      "priceText": "$12.34",
      "rarity": "Classified",
      "popularity": "Top 10%",
      "rating": "4.8",
      "steam": "https://steamcommunity.com/market/listings/730/..."
    }
  ]
}
```

## Project Structure

- app/page.tsx — UI for querying, filtering, sorting, and exporting results.
- app/api/scrape/route.ts — server-side scraping with cheerio and Steam URL generation.
- components/ui/\* — shared button, card, input, table primitives.
- lib/utils.ts — shared utilities for classnames.

## Scripts

- `npm run dev` — start Next.js with Turbopack.
- `npm run build` — production build.
- `npm run start` — serve the production build.
- `npm run lint` — run eslint.

## Notes

- Scraping is restricted to csgoskins.gg for safety; other hosts return 400.
- Requests bypass Next.js caching (`cache: "no-store"`), so each call hits the origin.
- For deployment, add a production host (e.g., Vercel) and ensure outbound HTTP access is allowed.

---

## 📜 License & Usage Modification: Not permitted.

Redistribution: Only allowed with proper attribution and without any changes to the original files.

Commercial Use: Only with prior written consent.

📌 Attribution All credits for the creation, design, and development of this project go to:

Andre Menezes 📧 Contact: andremenezes231@hotmail.com 🌐 Website: https://andremenezes.dev

If this project is used, cited, or referenced in any form (including partial code, design elements, or documentation), you must provide clear and visible attribution to the original author(s).

⚠️ Disclaimer This project is provided without any warranty of any kind, either expressed or implied. Use at your own risk.

📂 File Integrity Do not alter, rename, or remove any files, directories, or documentation included in this project. Checksum or signature verification may be used to ensure file authenticity.

© 2025 Andre Menezes. All Rights Reserved.

