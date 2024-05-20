from ultralytics import YOLO
from flask import Flask, request, jsonify, render_template
import numpy as np
import cv2, base64, random, hmac, time

app = Flask(__name__)
model = YOLO("yolov8n.pt")

#what are these?
APP_ID = 
APP_CERTIFICATE = 

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/token')
def generate_token():
    channel_name = 'test-channel'
    uid = random.randint(1, 10000)  # Unique user ID for each request
    role = 1  # 1 for publisher, 2 for subscriber
    expiration_time_in_seconds = 3600
    current_timestamp = int(time.time())
    privilege_expired_ts = current_timestamp + expiration_time_in_seconds
    
    token = generate_agora_token(APP_ID, APP_CERTIFICATE, channel_name, uid, role, privilege_expired_ts)
    return jsonify({'token': token, 'uid': uid})

def generate_agora_token(app_id, app_certificate, channel_name, uid, role, privilege_expired_ts):
    # Token generation logic using Agora SDK
    # This is a simplified version; refer to Agora's docs for production usage
    return hmac.new(app_certificate.encode(), f'{app_id}{channel_name}{uid}{privilege_expired_ts}'.encode(), hashlib.sha256).hexdigest()

@app.route('/process_frame', methods=['Post'])
def process_frame():
    data = request.json()
    keyword = data['word']
    frame_data = data['frame']

    #converts base64 string to bytes, then to numpy array, then to image using OpenCV
    frame_bytes = base64.b64decode(frame_data.split(',')[1])
    np_arr = np.frombuffer(frame_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    results = model(frame)

    #what is this stuff (everything below)
    confidences = []
    class_ids = []

    for result in results:
        boxes = result.boxes.cpu().numpy()
        if boxes.conf > .65:
            confidences.append(boxes.xyxy)
            class_ids.append(boxes.cls)
    
    #detections = results.pandas().xyxy[0]
    #detected_objects = detections['name'].unique()

    #word_in_image = keyword.lower() in map(str.lower, detected_objects)

    word_in_image = keyword.lower() in map(str.lower, class_ids)

    return jsonify({'word_in_image': word_in_image})

if __name__ == '__main__':
    app.run(debug=True)