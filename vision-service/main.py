from fastapi import FastAPI, UploadFile, File
import tempfile
import os
import shutil

from model import load_model
from inference import predict_image

app = FastAPI()
model = load_model()

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    # Use tempfile for cross-platform compatibility (Windows + Linux)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    temp_path = temp_file.name
    
    try:
        # Write uploaded file to temp location
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Run inference
        result = predict_image(model, temp_path)
        return result
    finally:
        # Clean up temp file after analysis
        if os.path.exists(temp_path):
            os.remove(temp_path)