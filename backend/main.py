# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import images, mixer, Beamforming

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(images.router, prefix="/api", tags=["images"])
app.include_router(mixer.router, prefix="/api", tags=["mixer"])
app.include_router(Beamforming.router, tags=["beamforming"])

@app.get("/")
def root():
    return {"message": "Fourier Mixer API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "API is healthy"}