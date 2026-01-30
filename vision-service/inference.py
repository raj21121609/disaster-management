import torch
from torchvision import transforms
from PIL import Image

CLASSES = [
    "fire",
    "flood",
    "accident",
    "injury",
    "infrastructure_damage",
    "normal"
]

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def predict_image(model, image_path):
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(image)
        probs = torch.softmax(outputs, dim=1)
        confidence, idx = torch.max(probs, dim=1)

    return {
        "visual_label": CLASSES[idx.item()],
        "confidence": round(confidence.item(), 2),
        "model": "ResNet50",
        "note": "Prototype vision inference"
    }