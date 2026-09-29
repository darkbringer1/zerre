#!/usr/bin/env python3
"""Show Zerre page, section, and click requests from Cloudflare Analytics."""

import argparse
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.request


API_URL = "https://api.cloudflare.com/client/v4/graphql"
HOST = "zerre.dogukaan.dev"
QUERY = """
query ZerreTraffic($zoneTag: string, $filter: filter) {
  viewer {
    zones(filter: {zoneTag: $zoneTag}) {
      paths: httpRequestsAdaptiveGroups(
        filter: $filter
        limit: 1000
        orderBy: [count_DESC]
      ) {
        count
        dimensions { clientRequestPath }
      }
    }
  }
}
"""


def report(rows):
    pages = []
    sections = []
    clicks = []
    campaigns = []
    page_paths = {"/", "/index.html", "/privacy", "/privacy.html",
                  "/support", "/support.html", "/releases", "/releases.html"}

    for row in rows:
        path = row["dimensions"]["clientRequestPath"]
        count = row["count"]
        if path in page_paths:
            pages.append((path, count))
        elif path.startswith("/assets/analytics/section-") and path.endswith(".txt"):
            sections.append((path.removeprefix("/assets/analytics/").removesuffix(".txt"), count))
        elif path.startswith("/assets/analytics/click-") and path.endswith(".txt"):
            clicks.append((path.removeprefix("/assets/analytics/").removesuffix(".txt"), count))
        elif path.startswith("/assets/analytics/source-") and path.endswith(".txt"):
            campaigns.append((path.removeprefix("/assets/analytics/").removesuffix(".txt"), count))

    for title, group in (("Pages", pages), ("Sections reached", sections),
                         ("Clicks", clicks), ("Campaign arrivals", campaigns)):
        print(f"\n{title}")
        if not group:
            print("  No requests in this period")
        for name, count in sorted(group, key=lambda item: (-item[1], item[0])):
            print(f"  {count:>7}  {name}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hours", type=int, default=24,
                        help="UTC lookback window, 1–24 hours (default: 24)")
    args = parser.parse_args()
    if not 1 <= args.hours <= 24:
        parser.error("--hours must be between 1 and 24")

    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    zone = os.environ.get("CLOUDFLARE_ZONE_ID")
    if not token or not zone:
        parser.error("set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID")

    end = dt.datetime.now(dt.timezone.utc)
    start = end - dt.timedelta(hours=args.hours)
    timestamp = lambda value: value.strftime("%Y-%m-%dT%H:%M:%SZ")
    payload = {
        "query": QUERY,
        "variables": {
            "zoneTag": zone,
            "filter": {
                "datetime_geq": timestamp(start),
                "datetime_lt": timestamp(end),
                "clientRequestHTTPHost": HOST,
                "requestSource": "eyeball",
            },
        },
    }
    request = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.load(response)
    except (urllib.error.URLError, ValueError) as error:
        print(f"Cloudflare request failed: {error}", file=sys.stderr)
        return 1

    if result.get("errors"):
        for error in result["errors"]:
            print(f"Cloudflare: {error.get('message', error)}", file=sys.stderr)
        return 1

    zones = result.get("data", {}).get("viewer", {}).get("zones", [])
    if not zones:
        print("No zone data. Check the zone ID and token's Account Analytics Read access.", file=sys.stderr)
        return 1

    print(f"{HOST} · {timestamp(start)} to {timestamp(end)}")
    report(zones[0]["paths"])
    print("\nRequest counts are approximate; they may include crawlers and Cloudflare sampling.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
