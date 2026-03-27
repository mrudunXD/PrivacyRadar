# PRD: PrivacyRadar — Personal Digital Exposure Intelligence Engine
### Hackathon: CIPHATHO 26' | Problem: CIPH-PS-007 | Team: CipherX

---

## Overview

PrivacyRadar is a **free, web-based OSINT tool** that allows any citizen — technical or not — to discover their complete digital footprint, understand their exposure risk, and take immediate action to protect their identity. It aggregates 10+ free data sources, scores exposure using a rule-based risk engine, and delivers step-by-step remediation — all from a single breathtaking dashboard.

**Core User Journey:**
```
Enter email / username / phone
        ↓
Parallel scan across 14 free OSINT sources
        ↓
Digital Risk Score (0–100) with breakdown
        ↓
Actionable remediation checklist
        ↓
PDF report + Legal takedown letter
```

**Tech Stack (100% Free):**
- Frontend: React.js + Tailwind CSS + Framer Motion
- Backend: Python FastAPI
- Database: Supabase (free tier)
- Cache: Upstash Redis (free tier)
- AI: Google Gemini API (free tier)
- Auth: Supabase Auth (optional, for saved scans)
- PDF: jsPDF (client-side, free)

---

## UI/UX Design System

### Aesthetic Direction: "Dark Intelligence"
The app must feel like a **premium cyber-intelligence terminal** — not a student project. Think NSA dashboard meets modern SaaS. Every pixel should communicate trust, power, and clarity.

### Color Palette
```css
:root {
  --bg-primary: #020817;        /* Deep space black */
  --bg-secondary: #0D1117;      /* GitHub dark */
  --bg-card: #0F1923;           /* Card surface */
  --accent-primary: #00D4FF;    /* Electric cyan */
  --accent-secondary: #0EA5E9;  /* Sky blue */
  --accent-danger: #FF3B3B;     /* Breach red */
  --accent-warning: #F59E0B;    /* Amber alert */
  --accent-success: #10B981;    /* Safe green */
  --text-primary: #F1F5F9;      /* Near white */
  --text-secondary: #94A3B8;    /* Muted slate */
  --border: #1E293B;            /* Subtle border */
  --glow-cyan: 0 0 20px rgba(0, 212, 255, 0.3);
  --glow-red: 0 0 20px rgba(255, 59, 59, 0.3);
}
```

### Typography
```css
/* Headlines */
font-family: 'Space Mono', monospace;   /* Terminal feel for headings */

/* Body */
font-family: 'DM Sans', sans-serif;     /* Clean, readable body */

/* Data / Scores */
font-family: 'JetBrains Mono', monospace; /* Numbers, hashes, code */
```

### Animation Principles
- Page load: staggered fade-up reveals (150ms delay between elements)
- Scan progress: live animated terminal output with typewriter effect
- Risk score: animated arc gauge that fills with color (green → amber → red)
- Cards: subtle glow pulse on hover
- Breach items: slide-in with red flash on entry
- Numbers: count-up animation on reveal
- Background: slow animated particle field (canvas, <5% CPU)

### Responsive Breakpoints
- Mobile first — full feature parity on phones
- Tablet: 2-column grid layouts
- Desktop: 3-column dashboard with sidebar

---

## Task 1: Landing Page

**Goal:** Instantly communicate what the app does and get the user to scan in under 10 seconds.

### Layout
- Full-screen hero with animated particle background
- Central headline + single input field (email/username/phone)
- Live scan counter: `"14,832 scans completed today"`
- Three micro-stats below input (29.5B records, 77% unaware, ₹5800Cr losses)
- Scroll-triggered feature cards below fold

### Components

**Hero Section**
```
[Animated particle background — dark space with floating data nodes]

        KNOW YOUR EXPOSURE.
        OWN YOUR PRIVACY.

  [Subheadline: "Scan your digital footprint across 14+ breach databases"]

  [_______ Enter your email, username, or phone _______] [SCAN NOW →]

  [ 🔒 Zero data stored  ·  ⚡ Results in 90 seconds  ·  🆓 100% Free ]

        14,832 scans completed ● 2 active right now
```

**Trust Bar (below hero)**
- Logos/badges: HIBP, Shodan, DPDP 2023 Compliant, Open Source
- "Used by journalists, students, HR professionals, and everyday citizens"

**Feature Preview Cards (scroll section)**
- Card 1: Digital Risk Score with mini gauge preview
- Card 2: EXIF Metadata Stripper with photo icon
- Card 3: AI Risk Narrative with chat bubble preview
- Card 4: Legal Takedown Generator with document icon

### API Endpoints
```
None — static page
```

### UI Requirements
- Input accepts: email, username, phone number, or domain
- Auto-detect input type (regex validation)
- Animated placeholder cycling: "Try your email..." → "Try your username..." → "Try a phone number..."
- On submit: dramatic full-screen transition to scan page
- Mobile: full-width input + button stacked vertically

---

## Task 2: Live Scan Engine (Core Feature)

**Goal:** Run parallel scans across 14 free sources and show real-time progress to the user.

### 14 Free Data Sources

| # | Source | API/Method | Data Type | Rate Limit Strategy |
|---|--------|-----------|-----------|---------------------|
| 1 | HaveIBeenPwned (HIBP) | REST API (free) | Email breach history | Cache 24h |
| 2 | HIBP Pwned Passwords | k-Anonymity API | Password breach count | No rate limit |
| 3 | BreachDirectory.org | REST API (free tier) | Email/hash lookup | Cache 24h |
| 4 | LeakCheck.io | REST API (free tier) | Email breach sources | Cache 24h |
| 5 | IntelligenceX (IntelX) | REST API (free tier) | Email in pastes/leaks | Cache 24h |
| 6 | WhatsMyName | Open source JSON | Username on 500+ sites | Self-hosted |
| 7 | Maigret | Open source Python | Username on 3000+ sites | Self-hosted |
| 8 | Shodan.io | REST API (free tier) | Exposed services/IPs | Cache 48h |
| 9 | GrayhatWarfare | REST API (free) | Exposed S3 buckets | Cache 48h |
| 10 | Phonebook.cz | Scrape (free) | Emails tied to domain | Cache 24h |
| 11 | Epieos.com | REST API (free) | Google/social accounts | Cache 24h |
| 12 | Ahmia.fi | REST API (free) | Dark web index hits | Cache 48h |
| 13 | Hunter.io | REST API (free tier) | Domain email exposure | Cache 24h |
| 14 | theHarvester | Open source Python | Emails, subdomains, IPs | Self-hosted |

### Backend Architecture
```python
# FastAPI async parallel scan
@app.post("/api/scan")
async def scan(input: ScanRequest):
    # 1. Check Redis cache first
    cached = await redis.get(f"scan:{input.value}")
    if cached:
        return cached

    # 2. Run all sources in parallel
    results = await asyncio.gather(
        hibp_scan(input.value),
        breach_directory_scan(input.value),
        leakcheck_scan(input.value),
        intelx_scan(input.value),
        whatsmyname_scan(input.value),
        maigret_scan(input.value),
        shodan_scan(input.value),
        grayhat_scan(input.value),
        phonebook_scan(input.value),
        epieos_scan(input.value),
        ahmia_scan(input.value),
        hunter_scan(input.value),
        harvester_scan(input.value),
        return_exceptions=True
    )

    # 3. Aggregate + deduplicate
    aggregated = aggregate_results(results)

    # 4. Score + store
    score = calculate_risk_score(aggregated)
    await redis.setex(f"scan:{input.value}", 86400, aggregated)

    return {"results": aggregated, "score": score}
```

### Rate Limiting
```python
# Per IP: 3 scans/day
# Per input: cached 24 hours (same input = instant return, no API call)
# Global: async queue with 5 concurrent scans max
```

### Scan Progress UI (Live Terminal)
```
INITIALIZING SCAN FOR: j**n@gmail.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[✓] HaveIBeenPwned .............. 4 breaches found
[✓] BreachDirectory ............. 2 entries found
[⟳] LeakCheck ................... scanning...
[⟳] IntelligenceX ............... scanning...
[✓] WhatsMyName ................. 23 platforms found
[ ] Shodan ...................... queued
[ ] Ahmia (Dark Web) ............ queued

SOURCES COMPLETE: 4/14     ETA: ~60s
```

- Typewriter animation for each line
- Color coded: green checkmark (found), red X (error), spinning (in progress)
- Real-time WebSocket updates OR polling every 2 seconds

### API Endpoints
```
POST /api/scan
  Body: { input: string, type: "email"|"username"|"phone"|"domain" }
  Returns: { scan_id: string, status: "queued" }

GET  /api/scan/:scan_id
  Returns: { status, progress, partial_results }

GET  /api/scan/:scan_id/complete
  Returns: { results, score, breakdown, timestamp }
```

---

## Task 3: Risk Score Engine

**Goal:** Convert raw scan results into a meaningful, colour-coded 0–100 risk score with category breakdown.

### Scoring Rules (Rule-Based, Transparent)

```python
def calculate_risk_score(results):
    score = 0
    breakdown = {}

    # CREDENTIAL LEAKS (max 35 points)
    breach_count = len(results.breaches)
    if breach_count >= 1:  score += 10
    if breach_count >= 3:  score += 10
    if breach_count >= 7:  score += 10
    if any(b.has_passwords for b in results.breaches): score += 5
    breakdown["credentials"] = min(score, 35)

    # PII EXPOSURE (max 25 points)
    pii_score = 0
    if results.phone_found:    pii_score += 8
    if results.address_found:  pii_score += 8
    if results.dob_found:      pii_score += 9
    breakdown["pii"] = pii_score

    # DARK WEB PRESENCE (max 25 points)
    dw_score = 0
    if results.paste_hits > 0:   dw_score += 10
    if results.ahmia_hits > 0:   dw_score += 15
    breakdown["dark_web"] = dw_score

    # DIGITAL FOOTPRINT (max 15 points)
    fp_score = 0
    platform_count = len(results.platforms_found)
    if platform_count > 10:  fp_score += 5
    if platform_count > 25:  fp_score += 5
    if results.exif_found:   fp_score += 5
    breakdown["footprint"] = fp_score

    total = sum(breakdown.values())
    return { "total": min(total, 100), "breakdown": breakdown }
```

### Risk Score UI
```
         DIGITAL RISK SCORE

              [ 74 ]
         ████████████░░░░
              HIGH RISK

  Credentials  ████████░░  68%
  PII Exposure ██████░░░░  52%
  Dark Web     ███░░░░░░░  28%
  Footprint    █████░░░░░  45%
```

- Animated circular gauge (SVG arc, fills on load)
- Color: 0-30 green, 31-60 amber, 61-100 red
- Animated counter counting up to final score
- Category bars animate in sequentially with 200ms stagger

### Score Labels
| Score | Label | Color | Message |
|-------|-------|-------|---------|
| 0–20 | MINIMAL RISK | Green | "Your footprint is clean. Stay vigilant." |
| 21–40 | LOW RISK | Teal | "Minor exposure detected. Review findings." |
| 41–60 | MODERATE RISK | Amber | "Notable exposure. Action recommended." |
| 61–80 | HIGH RISK | Orange | "Significant exposure. Act now." |
| 81–100 | CRITICAL | Red | "Severe exposure. Immediate action required." |

### API Endpoints
```
GET /api/score/:scan_id
  Returns: { total, breakdown, label, recommendations_count }
```

---

## Task 4: Results Dashboard

**Goal:** Present all scan findings in a clean, scannable, visually stunning dashboard.

### Layout (Desktop)
```
┌─────────────────────────────────────────────────────┐
│  RISK SCORE GAUGE    │  SCAN SUMMARY CARDS (4)       │
│      [74]            │  Breaches | Platforms | PII   │
├──────────────────────┴───────────────────────────────┤
│  BREACH TIMELINE          │  PLATFORMS FOUND         │
│  (chronological cards)    │  (icon grid, 500+ sites) │
├───────────────────────────┴──────────────────────────┤
│  AI RISK NARRATIVE (full width)                      │
├──────────────────────────────────────────────────────┤
│  REMEDIATION CHECKLIST    │  BREACH SEVERITY TABLE   │
└──────────────────────────────────────────────────────┘
```

### Summary Cards (4 cards at top)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  BREACHES   │  │  PLATFORMS  │  │  DARK WEB   │  │  RISK SCORE │
│     4       │  │    23       │  │  MENTIONS   │  │     74      │
│  FOUND      │  │  FOUND      │  │     2       │  │    HIGH     │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```
- Each card has animated number count-up
- Color coded by severity
- Subtle glow border matching severity color

### Breach Cards
Each breach displayed as a card:
```
┌──────────────────────────────────────────────────┐
│  🔴 CRITICAL  │  LinkedIn Data Breach            │
│               │  June 2021 · 700M records        │
│               │  Data exposed: Email, Password,  │
│               │  Phone, Professional info        │
│               │  [Change Password →] [Details →] │
└──────────────────────────────────────────────────┘
```
- Severity badge: CRITICAL / HIGH / MEDIUM / LOW
- Breach date + scale
- Exact data types exposed (chips/tags)
- Direct action button

### Digital Footprint Timeline
- Horizontal scrollable timeline
- Each breach plotted chronologically
- Click to expand breach details
- Shows "attack surface growth over time"

### Platform Presence Grid
- Icon grid of all platforms where username was found
- Green = public profile, Amber = private but exists, Red = exposed data
- Click any platform icon → direct link to profile or removal guide

### API Endpoints
```
GET /api/results/:scan_id
  Returns: { breaches[], platforms[], timeline[], pii_found, dark_web_hits }

GET /api/breach/:breach_id
  Returns: { name, date, records, data_types, severity, remediation_url }
```

---

## Task 5: AI Risk Narrative

**Goal:** Use Google Gemini API (free tier) to generate a plain-English, personalised paragraph explaining the user's risk in human terms.

### Implementation
```python
import google.generativeai as genai

def generate_narrative(scan_results, score):
    prompt = f"""
    You are a cybersecurity expert explaining digital exposure risk to a non-technical person.
    
    Scan results:
    - Risk score: {score}/100
    - Breaches found: {len(scan_results.breaches)}
    - Breach names: {[b.name for b in scan_results.breaches]}
    - Data types exposed: {scan_results.data_types}
    - Platforms found: {len(scan_results.platforms)}
    - Dark web hits: {scan_results.dark_web_hits}
    
    Write a 3-sentence plain English explanation of:
    1. What was found and how serious it is
    2. What an attacker could specifically do with this data TODAY
    3. The single most important action this person should take RIGHT NOW
    
    Be specific, not generic. Be honest about severity. 
    Do not use technical jargon. Write like you are talking to someone's parent.
    Keep it under 120 words.
    """
    
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(prompt)
    return response.text
```

### UI Display
```
┌─────────────────────────────────────────────────────────┐
│  🤖 AI RISK ANALYSIS                                     │
│                                                         │
│  "Your email appeared in 4 major data breaches          │
│  including LinkedIn (2021) and Adobe (2019). This       │
│  means your old password is likely being tested         │
│  right now on your bank, email, and social accounts     │
│  by automated bots. Your most urgent action:            │
│  change your email account password immediately         │
│  and enable two-factor authentication."                 │
│                                                         │
│  Generated by Gemini AI · Not stored · Regenerate ↺    │
└─────────────────────────────────────────────────────────┘
```

### API Endpoints
```
POST /api/narrative
  Body: { scan_id: string }
  Returns: { narrative: string, generated_at: timestamp }
```

---

## Task 6: EXIF Metadata Extractor (Showstopper Demo Feature)

**Goal:** Allow user to upload any photo and reveal hidden metadata — GPS location, device model, timestamp — then strip it and let them download the clean version.

### Why This Wins Hackathons
This is your **live demo moment.** Upload a photo taken on your phone. Show the GPS coordinates on a map pinpointing the exact location it was taken. Watch the judges' faces. This is the feature that makes everyone in the room go silent.

### Implementation (Client-Side Only — Zero Privacy Risk)
```javascript
// Using exif-js library (free, client-side)
import EXIF from 'exif-js';

function extractEXIF(file) {
  return new Promise((resolve) => {
    EXIF.getData(file, function() {
      const data = {
        gps: {
          lat: EXIF.getTag(this, 'GPSLatitude'),
          lng: EXIF.getTag(this, 'GPSLongitude'),
          altitude: EXIF.getTag(this, 'GPSAltitude')
        },
        device: {
          make: EXIF.getTag(this, 'Make'),
          model: EXIF.getTag(this, 'Model'),
          software: EXIF.getTag(this, 'Software')
        },
        timestamp: EXIF.getTag(this, 'DateTimeOriginal'),
        dimensions: {
          width: EXIF.getTag(this, 'PixelXDimension'),
          height: EXIF.getTag(this, 'PixelYDimension')
        }
      };
      resolve(data);
    });
  });
}
```

### Strip EXIF (Client-Side)
```javascript
// Redraw image on canvas (strips all metadata automatically)
function stripEXIF(file) {
  const canvas = document.createElement('canvas');
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    canvas.toBlob(blob => {
      downloadFile(blob, 'clean_' + file.name);
    }, 'image/jpeg', 0.95);
  };
  img.src = URL.createObjectURL(file);
}
```

### UI Flow
```
[DROP YOUR PHOTO HERE — or click to upload]
         ↓ (upload)
┌─────────────────────────────────────────┐
│  📍 GPS LOCATION FOUND                  │
│  [Map showing exact pin location]       │
│  18.9220° N, 72.8347° E — Mumbai, India │
│                                         │
│  📱 Device: Apple iPhone 14 Pro         │
│  📅 Taken: March 15, 2024, 14:32:07     │
│  📐 Resolution: 4032 × 3024             │
│  ⚠️  This image reveals your location!  │
│                                         │
│  [⬇ Download Clean Version — No EXIF]  │
└─────────────────────────────────────────┘
```

- Map rendered using Leaflet.js (100% free, no API key)
- Red pulsing pin on map location
- All processing client-side — photo never leaves the browser
- Prominent privacy badge: "Your photo is never uploaded to our servers"

### API Endpoints
```
None — 100% client-side processing
```

---

## Task 7: Remediation Dashboard

**Goal:** For every vulnerability found, provide a specific, actionable, checkbox-based remediation step.

### Dynamic Remediation Logic
```python
def generate_remediation(scan_results):
    steps = []

    # Per breach
    for breach in scan_results.breaches:
        if breach.has_passwords:
            steps.append({
                "priority": "CRITICAL",
                "icon": "🔐",
                "title": f"Change your {breach.name} password immediately",
                "detail": "Your password from this breach may be reused elsewhere.",
                "action_url": breach.change_password_url,
                "action_label": "Change Password →"
            })

    # If reused passwords suspected
    if len(scan_results.breaches) > 2:
        steps.append({
            "priority": "HIGH",
            "icon": "🔑",
            "title": "Enable a Password Manager",
            "detail": "Use Bitwarden (free) to generate unique passwords for every site.",
            "action_url": "https://bitwarden.com",
            "action_label": "Get Bitwarden Free →"
        })

    # If on many platforms
    if len(scan_results.platforms) > 15:
        steps.append({
            "priority": "MEDIUM",
            "icon": "🗑️",
            "title": "Delete unused accounts",
            "detail": f"You have accounts on {len(scan_results.platforms)} platforms. Delete ones you no longer use.",
            "action_url": "https://justdeleteme.xyz",
            "action_label": "Find Deletion Guides →"
        })

    # If EXIF found (from prior scan)
    if scan_results.exif_detected:
        steps.append({
            "priority": "MEDIUM",
            "icon": "📸",
            "title": "Strip EXIF from your photos before sharing",
            "detail": "Your photos reveal your GPS location, device model, and timestamp.",
            "action_url": "/exif-tool",
            "action_label": "Use Our EXIF Stripper →"
        })

    return sorted(steps, key=lambda x: ["CRITICAL","HIGH","MEDIUM","LOW"].index(x["priority"]))
```

### UI Layout
```
REMEDIATION CHECKLIST                    4 / 7 completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL
☑  Change your LinkedIn password immediately     [Done]
☐  Enable 2FA on your email account         [Do This →]

🟠 HIGH
☑  Enable a Password Manager                     [Done]
☐  Check for reused passwords                [Do This →]

🟡 MEDIUM
☐  Delete unused accounts on 8 platforms     [Do This →]
☐  Strip EXIF from photos before sharing     [Do This →]

🟢 LOW
☑  Review privacy settings on Instagram          [Done]

[━━━━━━━━━━━━░░░░░░░░] 57% Secured

[📄 Download Full Report]  [📬 Email Report to Me]
```

- Checkbox per item — ticking turns item green with strikethrough
- Progress bar fills as items are checked
- Priority color coding (Critical → Low)
- Each item has a direct action link

---

## Task 8: Legal Takedown Letter Generator

**Goal:** Auto-generate a DPDP Act 2023 compliant legal notice for data broker removal.

### Template Engine
```python
def generate_legal_letter(user_name, data_broker, data_found, date):
    return f"""
TO,
The Data Controller / Data Fiduciary,
{data_broker.name}
{data_broker.address}

SUBJECT: REQUEST FOR ERASURE OF PERSONAL DATA UNDER SECTION 13
         OF THE DIGITAL PERSONAL DATA PROTECTION ACT, 2023

Dear Sir/Madam,

I, {user_name}, hereby formally request the immediate erasure of my 
personal data processed by your organisation, in accordance with my 
rights under Section 13 of the Digital Personal Data Protection Act, 
2023 (DPDP Act).

DATA FOUND:
- Email address: {data_found.email}
- Additional identifiers: {data_found.other}
- Source discovered via: PrivacyRadar OSINT Scan ({date})

I request that you:
1. Immediately cease processing my personal data
2. Permanently erase all records associated with my identity
3. Confirm compliance within 30 days as required under the DPDP Act

Non-compliance may be reported to the Data Protection Board of India.

Regards,
{user_name}
Date: {date}

[This letter was generated in accordance with DPDP Act, 2023 — Section 13]
    """
```

### UI
- User sees pre-filled letter with their data and the broker's name
- Editable text area to personalise
- One-click PDF download (jsPDF)
- Option to copy to clipboard
- Show list of discovered data brokers from scan (if any)

### API Endpoints
```
POST /api/legal-letter
  Body: { scan_id, user_name, broker_name }
  Returns: { letter_text: string }
```

---

## Task 9: Password Breach Checker (k-Anonymity)

**Goal:** Let users safely check if their password has been breached — without ever sending the real password to any server.

### How k-Anonymity Works (Explain in UI)
```
Your password: "MyP@ssw0rd"
         ↓
SHA-1 hash: "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8"
         ↓
Send only first 5 chars: "5BAA6"
         ↓
HIBP returns all hashes starting with "5BAA6" (~500 results)
         ↓
We check locally if your full hash is in the list
         ↓
Result: "This password appears 47,832 times in known breaches"
         ↓ (Your actual password was never sent anywhere)
```

### UI
```
CHECK IF YOUR PASSWORD IS COMPROMISED

[ Enter password here ]          👁 Show/Hide
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Zero-knowledge check — your password never leaves your device

[CHECK PASSWORD]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ This password has been seen 47,832 times in data breaches.
   You should change it EVERYWHERE you use it — immediately.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Technical Note
- SHA-1 hashing done in browser (Web Crypto API)
- Only prefix sent to HIBP Pwned Passwords API
- Zero server involvement — 100% client-side

---

## Task 10: Before vs After Rescan + Score Card

**Goal:** Show measurable improvement after user follows remediation steps.

### Flow
1. User completes initial scan → Score: 74 (HIGH RISK)
2. User follows remediation checklist
3. User clicks "Rescan to check improvement"
4. New scan runs → Score: 31 (LOW RISK)
5. Improvement card displayed

### Improvement Card UI
```
┌─────────────────────────────────────────────┐
│  🏆  PRIVACY IMPROVEMENT REPORT             │
│                                             │
│   BEFORE          AFTER        CHANGE       │
│   [74] ━━━━━━━━━ [31]          ▼ 43 pts     │
│   HIGH RISK       LOW RISK     improved     │
│                                             │
│  ✅ Changed 3 compromised passwords         │
│  ✅ Enabled 2FA on email                    │
│  ✅ Removed data from 2 brokers             │
│  ✅ Stripped EXIF from photos               │
│                                             │
│  You closed 6 attack vectors.               │
│  Your digital identity is significantly     │
│  more protected than 48 hours ago.          │
│                                             │
│  [📤 Share Your Score]  [📄 Download Card] │
└─────────────────────────────────────────────┘
```

- Shareable image card (html2canvas → PNG)
- Judges LOVE seeing measurable outcomes
- Motivates users to continue

---

## Task 11: PDF Report Export

**Goal:** Generate a downloadable, professionally formatted PDF of the full scan results.

### Report Contents
1. Cover page: PrivacyRadar logo, scan date, risk score gauge
2. Executive summary: AI narrative paragraph
3. Breach details: All found breaches with severity
4. Platform exposure: List of all platforms found
5. Remediation checklist: All steps (checked and unchecked)
6. Legal notices: Pre-drafted takedown letters for discovered brokers
7. Footer: "Generated by PrivacyRadar — DPDP Act 2023 Compliant"

### Implementation
```javascript
// jsPDF + html2canvas (both free)
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function exportPDF(reportElement) {
  const canvas = await html2canvas(reportElement, { scale: 2 });
  const pdf = new jsPDF('p', 'mm', 'a4');
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
  pdf.save('PrivacyRadar_Report.pdf');
}
```

---

## Task 12: Live Scan Counter + Social Proof

**Goal:** Make the app look active and trusted from the moment anyone opens it.

### Implementation
```python
# Supabase: scan_count table, incremented on every scan
# Displayed on homepage in real-time via SSE or polling every 30s

GET /api/stats
  Returns: {
    total_scans: 14832,
    scans_today: 247,
    active_now: 3,
    breaches_found_today: 1847,
    countries: 23
  }
```

### UI Display
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  14,832 scans completed
  1,847 breaches surfaced today
  3 people scanning right now
  23 countries protected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
- Numbers animate/count up on page load
- "Active now" counter updates every 30 seconds

---

## API Architecture Summary

### Backend Routes
```
POST   /api/scan                    Start new scan
GET    /api/scan/:id                Get scan status + partial results
GET    /api/scan/:id/complete       Get full results
GET    /api/score/:id               Get risk score + breakdown
POST   /api/narrative               Generate AI risk narrative
POST   /api/legal-letter            Generate takedown letter
GET    /api/stats                   Global scan statistics
GET    /api/health                  Health check
```

### Caching Strategy (Upstash Redis)
```
scan:{input}          → Full results    TTL: 24 hours
score:{scan_id}       → Risk score      TTL: 24 hours
narrative:{scan_id}   → AI narrative    TTL: 24 hours
stats:global          → Counters        TTL: 60 seconds
ratelimit:{ip}:{date} → Scan count      TTL: 24 hours
```

---

## Security & Privacy Requirements

- **Zero log policy:** No scan inputs stored in logs
- **No PII in database:** Only scan_id, timestamp, score stored (not the email/username)
- **Client-side password hashing:** SHA-1 in browser via Web Crypto API
- **Client-side EXIF:** Photos never reach server
- **HTTPS only:** Enforce SSL everywhere
- **Rate limiting:** 3 scans/day/IP, 1 scan/minute/IP
- **DPDP 2023 compliant:** No personal data stored without consent
- **Content Security Policy:** Strict CSP headers
- **No third-party trackers:** No Google Analytics, no Facebook Pixel

---

## Demo Day Checklist

- [ ] Pre-scan organiser's email and cache result (for instant demo)
- [ ] Test EXIF extractor with a phone photo containing GPS
- [ ] Test password checker with "password123"
- [ ] Verify all 14 sources respond without errors
- [ ] Load test with 10 concurrent scans
- [ ] Prepare a "before" email with known breaches for dramatic live demo
- [ ] Mobile responsive check on actual phone
- [ ] PDF export produces clean, professional output
- [ ] Rate limiter works (test 4th scan on same IP gets blocked)
- [ ] AI narrative generates in under 5 seconds

---

## Build Priority Order

| Priority | Task | Time Estimate | Impact |
|----------|------|--------------|--------|
| 🔴 P0 | Core scan engine (HIBP + 3 sources) | 4 hours | Critical |
| 🔴 P0 | Risk score + results dashboard | 3 hours | Critical |
| 🔴 P0 | Landing page + scan progress UI | 3 hours | Critical |
| 🟠 P1 | EXIF extractor | 2 hours | Demo wow |
| 🟠 P1 | AI narrative (Gemini) | 1 hour | High impact |
| 🟠 P1 | Remediation checklist | 2 hours | High impact |
| 🟡 P2 | Password breach checker | 1 hour | Trust builder |
| 🟡 P2 | PDF report export | 2 hours | Professional |
| 🟡 P2 | Legal letter generator | 1 hour | Differentiator |
| 🟢 P3 | Before/After rescan card | 1 hour | Nice to have |
| 🟢 P3 | Live scan counter | 30 mins | Nice to have |
| 🟢 P3 | Add remaining 10 sources | 2 hours | Completeness |

**Total estimated build time: ~22 hours**

---

*PrivacyRadar — Know Your Exposure. Own Your Privacy.*
*Built for CIPHATHO 26' | Team CipherX | CIPH-PS-007*