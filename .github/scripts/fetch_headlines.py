#!/usr/bin/env python3
"""
Fetch UK political headlines from RSS feeds and write to data/headlines.json.
Runs every 6 hours via GitHub Actions.
"""

import json
import re
import time
import os
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError
from html import unescape
import xml.etree.ElementTree as ET

# RSS feeds mapped to categories
FEEDS = {
    "government": [
        {
            "url": "https://www.theguardian.com/politics/rss",
            "source": "The Guardian",
            "category": "government"
        },
        {
            "url": "https://feeds.bbci.co.uk/news/politics/rss.xml",
            "source": "BBC News",
            "category": "government"
        },
    ],
    "economy": [
        {
            "url": "https://www.theguardian.com/business/economics/rss",
            "source": "The Guardian",
            "category": "economy"
        },
        {
            "url": "https://feeds.bbci.co.uk/news/business/rss.xml",
            "source": "BBC News",
            "category": "economy"
        },
    ],
    "nhs": [
        {
            "url": "https://www.theguardian.com/society/nhs/rss",
            "source": "The Guardian",
            "category": "nhs"
        },
        {
            "url": "https://feeds.bbci.co.uk/news/health/rss.xml",
            "source": "BBC News",
            "category": "nhs"
        },
    ],
    "immigration": [
        {
            "url": "https://www.theguardian.com/uk/immigration/rss",
            "source": "The Guardian",
            "category": "immigration"
        },
    ],
    "climate": [
        {
            "url": "https://www.theguardian.com/environment/climate-crisis/rss",
            "source": "The Guardian",
            "category": "climate"
        },
        {
            "url": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
            "source": "BBC News",
            "category": "climate"
        },
    ],
    "education": [
        {
            "url": "https://www.theguardian.com/education/rss",
            "source": "The Guardian",
            "category": "education"
        },
    ],
    "housing": [
        {
            "url": "https://www.theguardian.com/society/housing/rss",
            "source": "The Guardian",
            "category": "housing"
        },
    ],
    "foreign_policy": [
        {
            "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
            "source": "BBC News",
            "category": "foreign_policy"
        },
    ],
}

def clean_text(text):
    """Strip HTML tags and decode HTML entities."""
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = unescape(text)
    return text.strip()

def fetch_feed(url, source, category, max_items=3):
    """Fetch an RSS feed and return up to max_items headlines."""
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; DidTheyDeliver/1.0; +https://didtheydeliver.co.uk)"
    }
    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=15) as response:
            content = response.read()

        root = ET.fromstring(content)

        # Handle both RSS 2.0 and Atom feeds
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        items = root.findall('.//item')
        if not items:
            items = root.findall('.//atom:entry', ns)

        headlines = []
        for item in items[:max_items]:
            # Title
            title_el = item.find('title')
            if title_el is None:
                title_el = item.find('atom:title', ns)
            title = clean_text(title_el.text if title_el is not None else "")

            if not title:
                continue

            # Link
            link_el = item.find('link')
            if link_el is None:
                link_el = item.find('atom:link', ns)

            link = ""
            if link_el is not None:
                link = link_el.text or link_el.get('href', '')
            link = link.strip() if link else ""

            # Description/summary
            desc_el = item.find('description')
            if desc_el is None:
                desc_el = item.find('summary')
            if desc_el is None:
                desc_el = item.find('atom:summary', ns)

            description = ""
            if desc_el is not None and desc_el.text:
                description = clean_text(desc_el.text)
                # Truncate to 200 chars
                if len(description) > 200:
                    description = description[:197] + "..."

            if title and link:
                headlines.append({
                    "title": title,
                    "url": link,
                    "description": description,
                    "source": source,
                    "category": category
                })

        return headlines

    except (URLError, ET.ParseError, Exception) as e:
        print(f"  Warning: Could not fetch {url}: {e}")
        return []

def main():
    output = {}
    fetched_at = datetime.now(timezone.utc).isoformat()

    for category, feeds in FEEDS.items():
        category_items = []
        for feed_config in feeds:
            print(f"Fetching {feed_config['source']} for {category}...")
            items = fetch_feed(
                feed_config["url"],
                feed_config["source"],
                category,
                max_items=3
            )
            category_items.extend(items)
            time.sleep(0.5)  # Be polite

        # Deduplicate by title
        seen_titles = set()
        deduped = []
        for item in category_items:
            title_key = item["title"].lower()[:60]
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                deduped.append(item)

        output[category] = deduped[:4]  # Max 4 per category
        print(f"  {category}: {len(output[category])} headlines")

    result = {
        "fetched_at": fetched_at,
        "headlines": output
    }

    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)

    with open("data/headlines.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\nWrote data/headlines.json at {fetched_at}")
    total = sum(len(v) for v in output.values())
    print(f"Total headlines: {total}")

if __name__ == "__main__":
    main()
