import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "database", "attendance.db")
MODELS_DIR = os.path.join(BASE_DIR, "models")
YUNET_MODEL = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_MODEL = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-college-attendance-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Face recognition thresholds
# Cosine similarity for SFace: >0.363 is considered matching in OpenCV official benchmark.
# We set threshold at 0.38 for good balance of accuracy and tolerance for illumination/angle.
COSINE_SIMILARITY_THRESHOLD = 0.38
