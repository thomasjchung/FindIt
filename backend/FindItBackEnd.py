from ultralytics import YOLO
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
import cv2, base64, random, hmac, time

app = Flask(__name__)
model = YOLO("yolov8n.pt")
CORS(app, resources={r"/process_frame": {"origins": "*"}})

@app.route('/process_frame', methods=['POST'])
def process_frame():
    try:
        data = request.json
        keyword = data['word']
        frame_data = data['frame']

        # Check if frame_data is valid
        if not frame_data:
            raise ValueError("Frame data is missing")

        # Convert base64 string to bytes
        frame_bytes = base64.b64decode(frame_data.split(',')[1])

        # Check if frame_bytes is valid
        if not frame_bytes:
            raise ValueError("Failed to decode base64 string")

        # Convert bytes to numpy array
        np_arr = np.frombuffer(frame_bytes, np.uint8)

        # Check if np_arr is valid
        if np_arr.size == 0:
            raise ValueError("Numpy array is empty after conversion")

        # Convert numpy array to image
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        # Check if frame is valid
        if frame is None:
            raise ValueError("Failed to decode image from numpy array")

        # Process the frame using YOLO model
        results = model(frame)

        class_names = []
        class_names_list = model.names

        for result in results:
            for box in result.boxes:
                if box.conf > 0.3:
                    class_index = box.cls.item()
                    class_name = class_names_list[int(class_index)]
                    class_names.append(class_name)

        class_names_lower = list(map(lambda x: x.lower(), class_names))
        word_in_image = keyword.lower() in class_names_lower

        return jsonify({'word_in_image': word_in_image})

    except Exception as e:
        print(f"Error processing frame: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/')
def hello():
    return "Hello World!"

if __name__ == '__main__':
    app.run(debug=True, port=5000)
