import os
import google.generativeai as genai

# Initialize Gemini — key loaded from env, or use a placeholder for demo
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def configure_gemini():
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        return True
    return False

def generate_narrative(scan_results: dict) -> str:
    """Generate a plain-English AI risk narrative from scan results."""
    if not configure_gemini():
        # Return a high-quality fallback when no API key is configured
        return _fallback_narrative(scan_results)

    breaches = scan_results.get("breaches", [])
    platforms = scan_results.get("platforms_found", [])
    dark_web = scan_results.get("ahmia_hits", 0)
    score = scan_results.get("score_total", 0)
    breach_names = [getattr(b, 'name', b.get('name', '')) if hasattr(b, 'name') else b.get('name', '') for b in breaches]

    prompt = f"""You are a cybersecurity expert explaining digital exposure risk to a non-technical person.

Scan results:
- Risk score: {score}/100
- Breaches found: {len(breaches)}
- Breach names: {', '.join(breach_names) if breach_names else 'None'}
- Data types exposed: {list(set(dt for b in breaches for dt in (getattr(b, 'data_types', None) or [])))}
- Platforms found: {len(platforms)}
- Dark web hits: {dark_web}

Write a 3-sentence plain English explanation of:
1. What was found and how serious it is
2. What an attacker could specifically do with this data TODAY
3. The single most important action this person should take RIGHT NOW

Be specific, not generic. Be honest about severity.
Do not use technical jargon. Write like you are talking to someone's parent.
Keep it under 120 words."""

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return _fallback_narrative(scan_results)

def _fallback_narrative(scan_results: dict) -> str:
    """Rule-based narrative when Gemini API is unavailable."""
    breaches = scan_results.get("breaches", [])
    platforms = scan_results.get("platforms_found", [])
    dark_web = scan_results.get("ahmia_hits", 0)
    score_total = scan_results.get("score_total", 0)
    # Handle both Breach Pydantic objects and plain dicts
    breach_names = [getattr(b, 'name', None) or (b.get('name', '') if isinstance(b, dict) else '') for b in breaches]

    n = len(breaches)

    if n == 0 and dark_web == 0:
        return (
            f"Your digital footprint appears relatively clean — no breaches were found in the databases we checked. "
            f"However, your username was identified on {len(platforms)} platforms, which increases your attack surface. "
            f"Your most important action right now is to enable two-factor authentication on your email and primary accounts."
        )

    breach_str = f"{n} data breach{'es' if n > 1 else ''}"
    name_str = f" — including {', '.join(breach_names[:2])}" if breach_names else ""

    if score_total >= 61:
        urgency = "Attackers with this data are likely already using automated tools to access your bank, email, and social media accounts right now."
        action = "Your single most urgent action is to change your email account password immediately and enable two-factor authentication."
    elif score_total >= 41:
        urgency = "This data can be combined with other sources to impersonate you or reset your account passwords."
        action = "Start by enabling two-factor authentication on your email account, which protects all your other accounts."
    else:
        urgency = "While exposure is limited, old passwords in these breaches may still be in use on other accounts."
        action = "Review the breached accounts and change passwords you reuse anywhere else."

    return (
        f"Your information was found in {breach_str}{name_str}, exposing data like passwords and personal details to criminals. "
        f"{urgency} "
        f"{action}"
    )
