from fastapi import FastAPI, UploadFile, File
import uuid, shutil

from model import load_model
from inference import predict_image

app = FastAPI()
model = load_model()

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    temp_path = f"/tmp/{uuid.uuid4()}.jpg"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = predict_image(model, temp_path)
    return result