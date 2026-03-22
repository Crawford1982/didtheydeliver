#!/usr/bin/env python3
"""
Fetch live UK economic and political stats for Did They Deliver.
Pulls from: ONS API, Bank of England, NHS England, Ofgem.
Writes to data/live-stats.json — committed by GitHub Actions daily.
"""

import json
import os
import re
import csv
import io
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; DidTheyDeliver/1.0; +https://didtheydeliver.co.uk)"
}

def fetch_url(url, timeout=20):
    """Fetch a URL and return the response body as string."""
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="replace")

def fetch_json(url, timeout=20):
    """Fetch a URL and parse as JSON."""
    return json.loads(fetch_url(url, timeout))

# ─────────────────────────────────────────────
# ONS API helpers
# ─────────────────────────────────────────────
ONS_BASE = "https://api.ons.gov.uk/v1"

def ons_latest_monthly(dataset, series):
    """Return (value_float, period_str) for the latest monthly observation."""
    url = f"{ONS_BASE}/dataset/{dataset}/timeseries/{series}/data"
    data = fetch_json(url)
    months = data.get("months", [])
    if not months:
        raise ValueError(f"No monthly data for {dataset}/{series}")
    # Sort by date string — ONS uses 'YYYY MMM' e.g. '2026 JAN'
    months_sorted = sorted(months, key=lambda x: x.get("date", ""))
    latest = months_sorted[-1]
    return float(latest["value"]), latest["date"].strip()

def ons_latest_quarterly(dataset, series):
    """Return (value_float, period_str) for the latest quarterly observation."""
    url = f"{ONS_BASE}/dataset/{dataset}/timeseries/{series}/data"
    data = fetch_json(url)
    quarters = data.get("quarters", [])
    if not quarters:
        # Some series store quarters under months
        return ons_latest_monthly(dataset, series)
    quarters_sorted = sorted(quarters, key=lambda x: x.get("date", ""))
    latest = quarters_sorted[-1]
    return float(latest["value"]), latest["date"].strip()

# ─────────────────────────────────────────────
# Individual fetchers — each returns a dict or raises
# ─────────────────────────────────────────────

def fetch_cpi():
    """CPI annual % change. ONS MM23 series D7G7."""
    value, period = ons_latest_monthly("MM23", "D7G7")
    return {
        "value": round(value, 1),
        "display": f"{value:.1f}%",
        "period": period,
        "label": "CPI Inflation",
        "color": "g" if value <= 3.0 else "a" if value <= 5.0 else "r",
        "source": "ONS MM23/D7G7"
    }

def fetch_unemployment():
    """UK unemployment rate %. ONS LMS series MGSX."""
    value, period = ons_latest_monthly("LMS", "MGSX")
    return {
        "value": round(value, 1),
        "display": f"{value:.1f}%",
        "period": period,
        "label": "Unemployment",
        "color": "g" if value < 4.5 else "a" if value < 6.0 else "r",
        "source": "ONS LMS/MGSX"
    }

def fetch_house_prices():
    """UK average house price (£). ONS UKHPI series ZZUK — monthly £ average."""
    # ZZUK is the UK all-dwellings average house price index
    # The actual average price series in UKHPI is SJR2 (UK, all, average price)
    try:
        value, period = ons_latest_monthly("UKHPI", "SJR2")
        price = int(round(value))
    except Exception:
        # Fallback: UKHOUSINGPRICES dataset
        value, period = ons_latest_monthly("UKHOUSINGPRICES", "ZZUK")
        price = int(round(value))
    k = price // 1000
    return {
        "value": price,
        "display": f"£{k}K",
        "period": period,
        "label": "Avg House Price",
        "color": "a",
        "source": "ONS UKHPI"
    }

def fetch_gdp_growth():
    """UK GDP growth quarter-on-quarter %. ONS QNA series IHYQ."""
    try:
        value, period = ons_latest_quarterly("QNA", "IHYQ")
    except Exception:
        value, period = ons_latest_monthly("QNA", "IHYQ")
    return {
        "value": round(value, 1),
        "display": f"{'+' if value >= 0 else ''}{value:.1f}%",
        "period": period,
        "label": "GDP Growth (QoQ)",
        "color": "g" if value >= 0.3 else "a" if value >= 0 else "r",
        "source": "ONS QNA/IHYQ"
    }

def fetch_boe_rate():
    """Bank of England base rate. BoE stats CSV download."""
    url = (
        "https://www.bankofengland.co.uk/boeapps/database/fromshowcolumns.asp"
        "?csv.x=yes&Datefrom=01/Jan/2023&Dateto=now"
        "&SeriesCodes=IUMABEDR&CSVF=TN&UsingCodes=Y"
    )
    raw = fetch_url(url)
    reader = csv.reader(io.StringIO(raw))
    rows = [r for r in reader if len(r) >= 2 and r[0].strip() != ""]
    # Skip header rows — find last row where second column is a number
    value, period = None, None
    for row in rows:
        try:
            v = float(row[1].strip())
            value = v
            period = row[0].strip()
        except (ValueError, IndexError):
            continue
    if value is None:
        raise ValueError("Could not parse BoE base rate")
    return {
        "value": round(value, 2),
        "display": f"{value:.2f}%",
        "period": period,
        "label": "BoE Base Rate",
        "color": "a",
        "source": "Bank of England IUMABEDR"
    }

def fetch_net_migration():
    """UK net migration (thousands per year). ONS MIG series DJZN.
    DJZN = net long-term international migration, thousands.
    """
    try:
        value, period = ons_latest_yearly("MIG", "DJZN")
        mig_k = int(round(value * 1000))
    except Exception:
        # Try quarterly
        try:
            value, period = ons_latest_quarterly("MIG", "DJZN")
            mig_k = int(round(value * 1000))
        except Exception:
            raise ValueError("Could not fetch net migration")
    display = f"{mig_k:,}/yr"
    return {
        "value": mig_k,
        "display": display,
        "period": period,
        "label": "Net Migration",
        "color": "r" if mig_k > 400000 else "a" if mig_k > 200000 else "g",
        "source": "ONS MIG/DJZN"
    }

def ons_latest_yearly(dataset, series):
    """Return (value_float, period_str) for the latest annual observation."""
    url = f"{ONS_BASE}/dataset/{dataset}/timeseries/{series}/data"
    data = fetch_json(url)
    years = data.get("years", [])
    if not years:
        raise ValueError(f"No yearly data for {dataset}/{series}")
    years_sorted = sorted(years, key=lambda x: x.get("date", ""))
    latest = years_sorted[-1]
    return float(latest["value"]), latest["date"].strip()

def fetch_nhs_rtt():
    """NHS England RTT total waiting list.
    Tries the NHS England open data CKAN API first.
    Falls back to parsing the stats page for the latest CSV URL.
    """
    # Try CKAN API
    try:
        api_url = "https://opendata.england.nhs.uk/api/3/action/package_search?q=rtt+waiting+times&rows=5"
        data = fetch_json(api_url)
        # Parse results to find the most recent total
        # This is complex so we look for the summary CSV
        results = data.get("result", {}).get("results", [])
        for pkg in results:
            for res in pkg.get("resources", []):
                if "csv" in res.get("format", "").lower() and "summary" in res.get("name", "").lower():
                    csv_url = res["url"]
                    return parse_nhs_rtt_csv(csv_url)
    except Exception:
        pass

    # Fallback: scrape the NHS England RTT stats page
    try:
        from html.parser import HTMLParser

        page = fetch_url("https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/")
        # Find links to CSV files — they follow pattern like 'Full-CSV-data-file'
        # Actually look for the summary stats
        urls = re.findall(r'href="([^"]+\.csv[^"]*)"', page, re.IGNORECASE)
        zip_urls = re.findall(r'href="([^"]+\.zip[^"]*)"', page, re.IGNORECASE)

        # Look for aggregated/summary stats in the page text
        # The total is usually quoted as "X.X million"
        match = re.search(r'(\d+[\.,]\d+)\s*million[^a-z]*(?:patients?|people|waiting)', page, re.IGNORECASE)
        if match:
            total_m = float(match.group(1).replace(",", "."))
            period_match = re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})', page)
            period = period_match.group(0) if period_match else "Latest"
            return {
                "value": int(total_m * 1_000_000),
                "display": f"{total_m:.2f}M",
                "period": period,
                "label": "NHS RTT Waiting",
                "color": "r",
                "source": "NHS England RTT"
            }
    except Exception:
        pass

    raise ValueError("Could not fetch NHS RTT data")

def parse_nhs_rtt_csv(url):
    """Parse a NHS England RTT CSV to extract total waiting."""
    raw = fetch_url(url)
    reader = csv.DictReader(io.StringIO(raw))
    total = 0
    period = "Latest"
    for row in reader:
        # Look for total waiting column
        for key, val in row.items():
            if "total" in key.lower() and "wait" in key.lower():
                try:
                    total += int(str(val).replace(",", "").replace(" ", ""))
                except ValueError:
                    pass
    if total > 100000:
        m = total / 1_000_000
        return {
            "value": total,
            "display": f"{m:.2f}M",
            "period": period,
            "label": "NHS RTT Waiting",
            "color": "r",
            "source": "NHS England RTT CSV"
        }
    raise ValueError("Could not parse NHS RTT total from CSV")

def fetch_energy_cap():
    """Ofgem energy price cap — typical household (£/yr).
    Ofgem doesn't have a public API, but publishes on their site.
    We look for a data attribute or structured text on the ofgem page.
    """
    try:
        page = fetch_url("https://www.ofgem.gov.uk/check-if-energy-price-cap-affects-you")
        # Look for £XXXX per year pattern
        match = re.search(r'£([\d,]+)\s*(?:a|per)\s*year', page, re.IGNORECASE)
        if match:
            val = int(match.group(1).replace(",", ""))
            return {
                "value": val,
                "display": f"£{val:,}/yr",
                "period": "Current quarter",
                "label": "Energy Price Cap",
                "color": "r" if val > 2000 else "a",
                "source": "Ofgem"
            }
    except Exception:
        pass
    raise ValueError("Could not fetch Ofgem energy cap")


# ─────────────────────────────────────────────
# Pledge tracker — live status vs target
# ─────────────────────────────────────────────

def build_pledge_tracker(stats):
    """Derive live pledge status from the stats we've fetched."""
    pledges = []

    # Starmer: No tax rises on working people
    # (NI rise — this is factual, not dependent on live data)
    pledges.append({
        "pm": "starmer",
        "pledge": "No tax rises on working people",
        "target": "No increase",
        "current": "Employer NI up 1.2pp from Apr 2025",
        "status": "broken",
        "source": "HM Treasury Budget 2024"
    })

    # Starmer: Cut energy bills by £300
    # Baseline was ~£1,568 Ofgem cap at time of pledge
    # We compare live cap to £1,268 target
    if "energy_cap" in stats:
        cap = stats["energy_cap"]["value"]
        baseline = 1568
        target = baseline - 300
        diff = cap - target
        current_text = f"Cap is £{cap:,}/yr — £{abs(diff):,} {'above' if diff > 0 else 'below'} target"
        status = "broken" if diff > 50 else "kept" if diff < -50 else "partial"
        pledges.append({
            "pm": "starmer",
            "pledge": "Cut energy bills by £300",
            "target": f"£{target:,}/yr cap",
            "current": current_text,
            "status": status,
            "source": "Ofgem"
        })
    else:
        pledges.append({
            "pm": "starmer",
            "pledge": "Cut energy bills by £300",
            "target": "£1,268/yr cap",
            "current": "Bills rose — cap remains above target",
            "status": "broken",
            "source": "Ofgem (manual)"
        })

    # Starmer: NHS — 40,000 extra appointments per week
    if "nhs_rtt" in stats:
        rtt = stats["nhs_rtt"]["value"]
        rtt_m = rtt / 1_000_000
        baseline = 7.54
        current_text = f"{rtt_m:.2f}M waiting — {'falling' if rtt_m < baseline else 'still rising'} from {baseline}M baseline"
        status = "partial" if rtt_m < baseline else "broken"
        pledges.append({
            "pm": "starmer",
            "pledge": "40,000 extra NHS appointments per week",
            "target": "Reduce waiting list from 7.54M",
            "current": current_text,
            "status": status,
            "source": "NHS England RTT"
        })

    # Starmer: Halve NHS waiting list by end of parliament (our interpretation)
    # (this is a broader framing of the NHS pledge)

    # Starmer: Grow the economy
    if "gdp_growth" in stats:
        gdp = stats["gdp_growth"]["value"]
        current_text = f"{stats['gdp_growth']['display']} QoQ ({stats['gdp_growth']['period']})"
        status = "partial" if gdp >= 0 else "broken"
        pledges.append({
            "pm": "starmer",
            "pledge": "Grow the economy",
            "target": "Consistent positive GDP growth",
            "current": current_text,
            "status": status,
            "source": "ONS QNA"
        })

    # Starmer: Reduce net migration
    if "net_migration" in stats:
        mig = stats["net_migration"]["value"]
        current_text = f"{stats['net_migration']['display']} ({stats['net_migration']['period']}) — record was 764,000"
        status = "partial" if mig < 700000 else "broken"
        pledges.append({
            "pm": "starmer",
            "pledge": "Reduce overall net migration",
            "target": "Significant reduction from 764,000 peak",
            "current": current_text,
            "status": status,
            "source": "ONS LTIM"
        })

    return pledges


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def load_existing():
    """Load current live-stats.json as fallback values."""
    try:
        with open("data/live-stats.json", "r") as f:
            return json.load(f)
    except Exception:
        return {"stats": {}, "pledges": []}

def main():
    existing = load_existing()
    existing_stats = existing.get("stats", {})

    fetchers = {
        "cpi":           fetch_cpi,
        "unemployment":  fetch_unemployment,
        "house_prices":  fetch_house_prices,
        "gdp_growth":    fetch_gdp_growth,
        "boe_rate":      fetch_boe_rate,
        "net_migration": fetch_net_migration,
        "nhs_rtt":       fetch_nhs_rtt,
        "energy_cap":    fetch_energy_cap,
    }

    stats = {}
    for key, fn in fetchers.items():
        print(f"Fetching {key}...", end=" ", flush=True)
        try:
            result = fn()
            stats[key] = result
            print(f"✓  {result['display']} ({result.get('period','')})")
        except Exception as e:
            print(f"✗  {e}")
            # Keep previous value
            if key in existing_stats:
                stats[key] = existing_stats[key]
                stats[key]["stale"] = True
                print(f"   → kept previous: {existing_stats[key].get('display','?')}")

    pledges = build_pledge_tracker(stats)

    output = {
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated_readable": datetime.now(timezone.utc).strftime("%-d %B %Y"),
        "stats": stats,
        "pledges": pledges
    }

    os.makedirs("data", exist_ok=True)
    with open("data/live-stats.json", "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Wrote data/live-stats.json ({len(stats)} stats, {len(pledges)} pledges)")

if __name__ == "__main__":
    main()
