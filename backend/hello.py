"""
Simple hello world FastAPI application for testing the setup.

Run with: uv run uvicorn hello:app --reload
"""

from fastapi import FastAPI

app = FastAPI(title="Hello World Test")


@app.get("/")
def read_root():
    """Root endpoint."""
    return {"message": "Hello, World!", "status": "working"}


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
