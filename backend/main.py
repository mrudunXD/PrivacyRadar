from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pydantic import BaseModel
import uuid

from models import ScanRequest, ScanResult
from scanners import run_parallel_scan
from utils import calculate_risk_score, get_risk_label
from narrative import generate_narrative

app = FastAPI(title="PrivacyRadar API")

# Live scan counter — seeded with realistic demo value
SCAN_COUNT_SEED = 47_312
_scan_count = 0

# Add CORS middleware to allow frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/stats")
async def get_stats():
    return {"scans_completed": SCAN_COUNT_SEED + _scan_count}

@app.post("/api/scan")
async def start_scan(request: ScanRequest):
    # This is a simplified version. PRD calls for status polling.
    # For now, we perform the scan and return results immediately to match the demo flow.
    
    global _scan_count
    _scan_count += 1
    scan_id = str(uuid.uuid4())
    start_time = datetime.utcnow().isoformat()
    
    # Run scan
    results = await run_parallel_scan(request.value, request.type)
    
    # Calculate score
    score = calculate_risk_score(results)
    
    scan_data = {**results, "score_total": score.total}
    ai_narrative = generate_narrative(scan_data)
    
    return ScanResult(
        scan_id=scan_id,
        status="complete",
        input=request.value,
        type=request.type,
        score=score,
        breaches=results.get("breaches", []),
        platforms_found=results.get("platforms_found", []),
        paste_hits=results.get("paste_hits", 0),
        ahmia_hits=results.get("ahmia_hits", 0),
        pii_found=results.get("pii_found", {}),
        exif_found=results.get("exif_found", False),
        narrative=ai_narrative,
        timestamp=start_time
    )

class NarrativeRequest(BaseModel):
    scan_results: dict
    score_total: int = 0

@app.post("/api/narrative")
async def get_narrative(request: NarrativeRequest):
    data = {**request.scan_results, "score_total": request.score_total}
    return {"narrative": generate_narrative(data), "generated_at": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
