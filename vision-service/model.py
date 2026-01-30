import torch
import torch.nn as nn
from torchvision import models

CLASSES = [
    "fire",
    "flood",
    "accident",
    "injury",
    "infrastructure_damage",
    "normal"
]

def load_model():
    model = models.resnet50(pretrained=True)

    # Freeze pretrained layers
    for param in model.parameters():
        param.requires_grad = False

    # Replace final layer
    model.fc = nn.Linear(model.fc.in_features, len(CLASSES))

    model.eval()
    return model