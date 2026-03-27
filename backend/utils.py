from typing import Dict, Any
from models import RiskScore

def calculate_risk_score(aggregated: Dict[str, Any]) -> RiskScore:
    score = 0
    breakdown = {}

    # CREDENTIAL LEAKS (max 35 points)
    breaches = aggregated.get("breaches", [])
    breach_count = len(breaches)
    cred_score = 0
    if breach_count >= 1: cred_score += 10
    if breach_count >= 3: cred_score += 10
    if breach_count >= 7: cred_score += 10
    if any(b.has_passwords for b in breaches): cred_score += 5
    breakdown["credentials"] = min(cred_score, 35)

    # PII EXPOSURE (max 25 points)
    pii_score = 0
    pii = aggregated.get("pii_found", {})
    if pii.get("phone"):    pii_score += 8
    if pii.get("address"):  pii_score += 8
    if pii.get("dob"):      pii_score += 9
    breakdown["pii"] = pii_score

    # DARK WEB PRESENCE (max 25 points)
    dw_score = 0
    if aggregated.get("paste_hits", 0) > 0: dw_score += 10
    if aggregated.get("ahmia_hits", 0) > 0: dw_score += 15
    breakdown["dark_web"] = dw_score

    # DIGITAL FOOTPRINT (max 15 points)
    fp_score = 0
    platforms = aggregated.get("platforms_found", [])
    platform_count = len(platforms)
    if platform_count > 10:  fp_score += 5
    if platform_count > 25:  fp_score += 5
    if aggregated.get("exif_found"):   fp_score += 5
    breakdown["footprint"] = fp_score

    total = sum(breakdown.values())
    return RiskScore(total=min(total, 100), breakdown=breakdown)

def get_risk_label(total: int) -> str:
    if total <= 20: return "MINIMAL RISK"
    if total <= 40: return "LOW RISK"
    if total <= 60: return "MODERATE RISK"
    if total <= 80: return "HIGH RISK"
    return "CRITICAL"
