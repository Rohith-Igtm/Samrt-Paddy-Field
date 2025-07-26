from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os, shutil
from .ml.predict import predict_image

app = FastAPI()

# Enable CORS so your standalone frontend can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # allow any origin in dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload folder (stores incoming images)
BASE_DIR = os.path.dirname(__file__)
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Save the file
    target = os.path.join(UPLOAD_DIR, file.filename)
    with open(target, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    # Run inference
    predicted_class, confidence = predict_image(target)

    return {
        "class": predicted_class,
        "confidence": f"{confidence}%",
        "filename": file.filename
    }
