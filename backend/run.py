# backend/run.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",  # points to main.py and app instance
        host="127.0.0.1",
        port=5000,
        reload=True
    )
