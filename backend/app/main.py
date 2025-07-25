from fastapi import FastAPI, UploadFile, File
import shutil
import os
from .ml.predict import predict_image

app = FastAPI()

UPLOAD_DIR = "backend/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Predict using model
    predicted_class, confidence = predict_image(file_path)

    return {
        "class": predicted_class,
        "confidence": f"{confidence}%",
        "filename": file.filename  # optional but nice
    }


