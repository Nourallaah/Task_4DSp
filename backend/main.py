# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Allow React frontend (Vite) to call API
origins = ["http://localhost:5173"]  # React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Models ----------
class Settings(BaseModel):
    gain: float

class MixerRequest(BaseModel):
    inputSignal: List[float]
    settings: Settings

# ---------- Endpoints ----------
@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI backend!"}

@app.post("/api/mixer")
def mixer(request: MixerRequest):
    # Example processing: multiply each element by gain
    processed_signal = [x * request.settings.gain for x in request.inputSignal]
    return {"status": "success", "processed": processed_signal}
