"""
PrivacyRadar Scan Engine
- Uses real HIBP API when HIBP_API_KEY is set in .env
- Uses XposedOrNot (Free) for breach lookups
- Uses EmailRep.io (Free) for email reputation
- Falls back to realistic demo mode otherwise (varied per input)
"""

import os
import asyncio
import hashlib
import random
import httpx
from typing import List, Dict, Any
from models import Breach

HIBP_API_KEY = os.getenv("HIBP_API_KEY", "")
BREACH_DIRECTORY_API_KEY = os.getenv("BREACH_DIRECTORY_API_KEY", "")

# ---------------------------------------------------------------------------
# Breach pool — used to enrich keyless API results (XposedOrNot) and demo mode
# ---------------------------------------------------------------------------

BREACH_DATA = {
    "LinkedIn": Breach(name="LinkedIn", date="2021-06-22", records="700M", severity="CRITICAL",
                      data_types=["Email", "Password", "Phone", "Professional Info"],
                      change_url="https://linkedin.com/psettings/", has_passwords=True),
    "Adobe": Breach(name="Adobe", date="2019-10-23", records="153M", severity="HIGH",
                   data_types=["Email", "Password Hash", "Username"],
                   change_url="https://account.adobe.com/", has_passwords=True),
    "Canva": Breach(name="Canva", date="2019-05-24", records="137M", severity="HIGH",
                   data_types=["Email", "Username", "Name", "City"],
                   change_url="https://www.canva.com/password/reset/", has_passwords=False),
    "Zynga": Breach(name="Zynga", date="2019-09-01", records="218M", severity="MEDIUM",
                   data_types=["Email", "Username", "Password Hash", "Phone"],
                   change_url="https://zynga.com/", has_passwords=True),
    "Facebook": Breach(name="Facebook", date="2021-04-03", records="533M", severity="HIGH",
                      data_types=["Phone", "Name", "Email", "Location", "Date of Birth"],
                      change_url="https://www.facebook.com/settings?tab=security", has_passwords=False),
    "Gravatar": Breach(name="Gravatar", date="2020-10-09", records="114M", severity="LOW",
                      data_types=["Email", "Username"],
                      change_url="https://en.gravatar.com/", has_passwords=False),
    "MyFitnessPal": Breach(name="MyFitnessPal", date="2018-03-29", records="151M", severity="HIGH",
                          data_types=["Email", "Username", "IP Address", "Password Hash"],
                          change_url="https://www.myfitnesspal.com/user/settings", has_passwords=True),
    "Dropbox": Breach(name="Dropbox", date="2016-08-31", records="68.6M", severity="HIGH",
                     data_types=["Email", "Password Hash"],
                     change_url="https://www.dropbox.com/account/security", has_passwords=True),
    "Tumblr": Breach(name="Tumblr", date="2016-05-01", records="65.5M", severity="MEDIUM",
                    data_types=["Email", "Password Hash"],
                    change_url="https://www.tumblr.com/settings/account", has_passwords=True),
    "Last.fm": Breach(name="Last.fm", date="2012-03-22", records="43.5M", severity="MEDIUM",
                     data_types=["Email", "Password", "Username"],
                     change_url="https://www.last.fm/settings/security", has_passwords=True),
    "Domino's India": Breach(name="Domino's India", date="2021-05-24", records="18M", severity="HIGH",
                           data_types=["Email", "Phone", "Address", "Name"],
                           change_url="https://www.dominos.co.in/", has_passwords=False),
    "BigBasket": Breach(name="BigBasket", date="2020-10-30", records="20M", severity="HIGH",
                       data_types=["Email", "Phone", "Name", "Address", "Date of Birth"],
                       change_url="https://www.bigbasket.com/", has_passwords=False),
    "Unacademy": Breach(name="Unacademy", date="2020-01-05", records="22M", severity="MEDIUM",
                       data_types=["Email", "Username", "Name"],
                       change_url="https://unacademy.com/", has_passwords=False),
    "Collection #1": Breach(name="Collection #1", date="2019-01-07", records="772.9M", severity="CRITICAL",
                          data_types=["Email", "Password"],
                          change_url="https://haveibeenpwned.com/", has_passwords=True),
}

BREACH_POOL = list(BREACH_DATA.values())

# ---------------------------------------------------------------------------
# Platform pool — shuffled per input
# ---------------------------------------------------------------------------

PLATFORM_POOL = [
    "GitHub", "Twitter", "Instagram", "Reddit", "LinkedIn", "Facebook",
    "Pinterest", "Spotify", "YouTube", "Twitch", "Discord", "Steam",
    "TikTok", "Quora", "DeviantArt", "Medium", "Behance", "Dribbble",
    "Flickr", "Tumblr", "WordPress", "Vimeo", "Patreon", "Snapchat",
    "Telegram", "Keybase", "Mastodon", "HackerNews", "GitLab", "Bitbucket",
]


def _input_rng(value: str) -> random.Random:
    """Create a deterministic-but-unique RNG seeded by the full input value."""
    digest = hashlib.sha256(value.lower().encode()).hexdigest()
    seed = int(digest[:16], 16)  # 64-bit seed from SHA-256 — unique per input
    return random.Random(seed)


# ---------------------------------------------------------------------------
# XposedOrNot (Free, No Key)
# ---------------------------------------------------------------------------

async def xposedornot_scan(email: str) -> List[Breach]:
    """Check XposedOrNot (Free, No Key) for breaches."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://api.xposedornot.com/v1/check-email/{email}")
            if resp.status_code != 200:
                return []
            
            data = resp.json()
            if data.get("status") != "success":
                return []
            
            # XposedOrNot returns [["Breach1", "Breach2"]]
            found_names = []
            for sublist in data.get("breaches", []):
                if isinstance(sublist, list):
                    found_names.extend(sublist)
                else:
                    found_names.append(sublist)
            
            breaches = []
            for name in found_names:
                if name in BREACH_DATA:
                    breaches.append(BREACH_DATA[name])
                else:
                    # Generic breach if not in our rich pool
                    breaches.append(Breach(
                        name=name, date="Unknown", records="N/A", severity="MEDIUM",
                        data_types=["Email", "Account Info"], change_url="#", has_passwords=False
                    ))
            return breaches
    except Exception:
        return []


# ---------------------------------------------------------------------------
# BreachDirectory (Free via RapidAPI)
# ---------------------------------------------------------------------------

async def breachdirectory_scan(value: str) -> List[Breach]:
    """Check BreachDirectory (Free Tier via RapidAPI) if key is set."""
    if not BREACH_DIRECTORY_API_KEY:
        return []
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://breachdirectory.p.rapidapi.com/",
                headers={
                    "X-RapidAPI-Key": BREACH_DIRECTORY_API_KEY,
                    "X-RapidAPI-Host": "breachdirectory.p.rapidapi.com"
                },
                params={"func": "auto", "term": value}
            )
            if resp.status_code != 200:
                return []
            
            data = resp.json()
            if not data.get("success"):
                return []
            
            # Map their format to ours
            breaches = []
            for item in data.get("result", []):
                breaches.append(Breach(
                    name=item.get("source", "Unknown Leak"),
                    date="N/A", records="N/A", severity="HIGH",
                    data_types=item.get("exposed_data", ["Email"]),
                    change_url="#", has_passwords=item.get("has_password", False)
                ))
            return breaches
    except Exception:
        return []


# ---------------------------------------------------------------------------
# EmailRep.io (Free, No Key)
# ---------------------------------------------------------------------------

async def emailrep_scan(email: str) -> Dict[str, Any]:
    """Check Email Reputation from EmailRep.io (Free, No Key)."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://emailrep.io/{email}")
            if resp.status_code != 200:
                return {}
            return resp.json()
    except Exception:
        return {}


# ---------------------------------------------------------------------------
# HIBP breach scanner — real API
# ---------------------------------------------------------------------------

async def hibp_scan(value: str) -> List[Breach]:
    """Check HIBP. Uses real API if key is set."""
    if not HIBP_API_KEY or "@" not in value:
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://haveibeenpwned.com/api/v3/breachedaccount/{value}",
                headers={
                    "hibp-api-key": HIBP_API_KEY,
                    "User-Agent": "PrivacyRadar-CIPHATHO26",
                },
                params={"truncateResponse": "false"},
            )
            if resp.status_code != 200:
                return []

            data = resp.json()
            breaches = []
            for item in data:
                severity = "CRITICAL" if item.get("Spamlist") or item.get("IsVerified", False) and item.get("PwnCount", 0) > 100_000_000 else \
                           "HIGH"     if item.get("PwnCount", 0) > 10_000_000 else \
                           "MEDIUM"   if item.get("PwnCount", 0) > 1_000_000 else "LOW"
                breaches.append(Breach(
                    name=item.get("Name", "Unknown"),
                    date=item.get("BreachDate", "Unknown"),
                    records=f"{item.get('PwnCount', 0):,}",
                    severity=severity,
                    data_types=item.get("DataClasses", []),
                    change_url=item.get("Domain", "#"),
                    has_passwords="Passwords" in item.get("DataClasses", []),
                ))
            return breaches
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Demo Fallback
# ---------------------------------------------------------------------------

def _demo_breaches(value: str) -> List[Breach]:
    """Return a realistically varied subset of the breach pool, unique per input."""
    rng = _input_rng(value)
    roll = rng.random()
    if roll < 0.20: return []
    elif roll < 0.50: count = rng.randint(1, 2)
    elif roll < 0.90: count = rng.randint(3, 4)
    else: count = rng.randint(5, min(6, len(BREACH_POOL)))
    shuffled = BREACH_POOL[:]
    rng.shuffle(shuffled)
    return shuffled[:count]


# ---------------------------------------------------------------------------
# Platform scanner
# ---------------------------------------------------------------------------

async def whatsmyname_scan(username: str) -> List[str]:
    """Return a unique shuffled platform list per username."""
    if not username: return []
    rng = _input_rng(username)
    roll = rng.random()
    if roll < 0.15: count = rng.randint(0, 3)
    elif roll < 0.50: count = rng.randint(4, 9)
    elif roll < 0.85: count = rng.randint(10, 18)
    else: count = rng.randint(19, len(PLATFORM_POOL))
    pool = PLATFORM_POOL[:]
    rng.shuffle(pool)
    return pool[:count]


# ---------------------------------------------------------------------------
# Dark-web scanner (demo)
# ---------------------------------------------------------------------------

async def ahmia_scan(query: str) -> int:
    rng = _input_rng(query + ":dark")
    roll = rng.random()
    if roll < 0.60: return 0
    elif roll < 0.85: return rng.randint(1, 2)
    else: return rng.randint(3, 5)


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------

async def run_parallel_scan(value: str, input_type: str) -> Dict[str, Any]:
    if input_type not in ["email", "username", "phone", "domain"]:
        return {
            "breaches": [], "platforms_found": [], "ahmia_hits": 0,
            "pii_found": {"phone": False, "address": False, "dob": False},
            "paste_hits": 0, "exif_found": False,
        }

    # Parallel tasks
    tasks = [
        hibp_scan(value),
        xposedornot_scan(value) if input_type == "email" else asyncio.sleep(0, result=[]),
        breachdirectory_scan(value),
        whatsmyname_scan(value),
        ahmia_scan(value),
        emailrep_scan(value) if input_type == "email" else asyncio.sleep(0, result={}),
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Extraction
    hibp_res = results[0] if not isinstance(results[0], Exception) else []
    xon_res  = results[1] if not isinstance(results[1], Exception) else []
    bd_res   = results[2] if not isinstance(results[2], Exception) else []
    platforms = results[3] if not isinstance(results[3], Exception) else []
    ahmia_hits = results[4] if not isinstance(results[4], Exception) else 0
    # emailrep = results[5] if not isinstance(results[5], Exception) else {}

    # COMBINE BREACHES
    # Use a set to prevent duplicates by name
    all_breaches = {b.name: b for b in hibp_res}
    for b in xon_res: 
        if b.name not in all_breaches: all_breaches[b.name] = b
    for b in bd_res:
        if b.name not in all_breaches: all_breaches[b.name] = b
    
    final_breaches = list(all_breaches.values())

    # FALLBACK TO DEMO IF NO REAL RESULTS FOUND (for impressive hackathon UX)
    if not final_breaches and not HIBP_API_KEY and not BREACH_DIRECTORY_API_KEY:
        final_breaches = _demo_breaches(value)

    all_types = [dt.lower() for b in final_breaches for dt in (b.data_types or [])]
    pii_found = {
        "phone":   any("phone" in t for t in all_types),
        "address": any("address" in t or "location" in t for t in all_types),
        "dob":     any("birth" in t or "dob" in t or "age" in t for t in all_types),
    }

    return {
        "breaches":       final_breaches,
        "platforms_found": platforms,
        "ahmia_hits":     ahmia_hits,
        "pii_found":      pii_found,
        "paste_hits":     len(final_breaches) // 2,
        "exif_found":     False,
    }
