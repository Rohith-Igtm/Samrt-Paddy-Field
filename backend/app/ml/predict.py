import tensorflow as tf
import numpy as np
from PIL import Image

#Load model
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "model.keras")

model = tf.keras.models.load_model(MODEL_PATH)


#match class orders
class_names=['Healthy','Mild','Moderate','Severe']

def predict_image(image_path):
    img = Image.open(image_path).convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0  # Normalize the image
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension

    predictions= model.predict(img_array)
    predicted_class = class_names[np.argmax(predictions)]
    confidence = round(100 * np.max(predictions), 2)

    return predicted_class, confidence