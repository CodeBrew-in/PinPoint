from fastapi import FastAPI

app = FastAPI(title="PinPoint API")


@app.get("/health")
def health_check():
    return {"status": "ok"}