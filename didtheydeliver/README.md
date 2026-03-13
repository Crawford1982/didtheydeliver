# DidTheyDeliver.co.uk

**UK Political Accountability Dashboard**

Track every promise made by UK Prime Ministers since 1997. See what was kept, what was broken, who owns the media reporting on it, and find your MP.

## Stack
- Pure HTML/CSS/JS — no framework, no build step
- GitHub Pages hosting
- Namecheap domain → GitHub Pages CNAME
- Cloudflare Worker (optional) for CORS-proxied API calls

## Live Data Sources (all free)
| Panel | Source | API |
|---|---|---|
| Net Migration | ONS | `api.beta.ons.gov.uk` |
| Cost of Living | ONS | `api.beta.ons.gov.uk` |
| NHS Waiting | NHS England | `api.england.nhs.uk` |
| MP Lookup | Parliament | `members-api.parliament.uk` |
| Terror Threat | MI5 | RSS feed (CF Worker needed) |
| News Feeds | Various | RSS (CF Worker needed) |
| Postcode → Constituency | postcodes.io | Free, no key |

## Setup

### 1. GitHub Pages
```bash
git init
git add .
git commit -m "Initial deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/didtheydeliver.git
git push -u origin main
```
Then in GitHub repo Settings → Pages → Source: `main` branch, `/ (root)`.

### 2. Custom domain (Namecheap → GitHub Pages)
Add a `CNAME` file to repo root containing: `didtheydeliver.co.uk`

In Namecheap DNS, add:
```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   YOUR_USERNAME.github.io
```

### 3. Cloudflare Worker (for news RSS + MI5 threat)
TODO: Deploy worker from `/worker/index.js` to proxy:
- RSS feeds (CORS bypass)
- MI5 threat level page scrape
- ONS API (rate limit buffer)

## Data Updates
- **Terror threat**: Update `CURRENT_THREAT` in `data/promises.js` when MI5 changes level
- **Migration/CPI/NHS**: Update static fallbacks monthly until CF Worker is live
- **PM promises**: Add new broken promises to `key_promises` arrays as they happen

## SEO Articles (TODO)
See memory notes — one article per PM, one per media outlet. Hub-and-spoke model.
