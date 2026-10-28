import os
import re
import json
import base64
import numpy as np
import cv2
from config import YUNET_MODEL, SFACE_MODEL, UPLOADS_DIR, COSINE_SIMILARITY_THRESHOLD

class FaceService:
    def __init__(self):
        self.detector = None
        self.recognizer = None
        self._load_models()

    def _load_models(self):
        if not os.path.exists(YUNET_MODEL) or not os.path.exists(SFACE_MODEL):
            raise FileNotFoundError(
                f"Face models not found. Please ensure {YUNET_MODEL} and {SFACE_MODEL} are present."
            )
        
        # SFace model requires inputSize set on detector
        self.detector = cv2.FaceDetectorYN.create(
            YUNET_MODEL,
            "",
            (320, 320),
            score_threshold=0.5,
            nms_threshold=0.3,
            top_k=5000
        )
        self.recognizer = cv2.FaceRecognizerSF.create(SFACE_MODEL, "")
        os.makedirs(os.path.join(UPLOADS_DIR, "faces"), exist_ok=True)

    def decode_base64_image(self, base64_str):
        """Decode a base64 image (with or without data URI prefix) to OpenCV BGR numpy array."""
        try:
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]
            img_bytes = base64.b64decode(base64_str)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Could not decode image from byte buffer")
            return img
        except Exception as e:
            raise ValueError(f"Invalid image data: {str(e)}")

    def extract_face_embedding(self, image_bgr):
        """
        Detect the most prominent face in an image and return its 128-D embedding vector.
        """
        if image_bgr is None or image_bgr.size == 0:
            return {"success": False, "error": "Invalid or empty image provided."}

        h, w = image_bgr.shape[:2]
        self.detector.setInputSize((w, h))

        _, faces = self.detector.detect(image_bgr)
        if faces is None or len(faces) == 0:
            return {
                "success": False,
                "error": "No face detected. Please ensure your face is well-lit and centered in the frame."
            }

        # If multiple faces detected, pick the one with largest area (w * h)
        best_face = None
        max_area = 0
        for face in faces:
            fw, fh = face[2], face[3]
            area = fw * fh
            if area > max_area:
                max_area = area
                best_face = face

        # Align and crop the face using SFace recognizer's alignCrop
        aligned_face = self.recognizer.alignCrop(image_bgr, best_face)
        feature = self.recognizer.feature(aligned_face)

        embedding = feature.flatten().tolist()
        box = [int(best_face[0]), int(best_face[1]), int(best_face[2]), int(best_face[3])]
        score = float(best_face[-1])

        # Also generate a thumbnail preview
        bx, by, bw, bh = box
        # Clip to image boundary
        x1 = max(0, bx)
        y1 = max(0, by)
        x2 = min(w, bx + bw)
        y2 = min(h, by + bh)
        crop = image_bgr[y1:y2, x1:x2] if (x2 > x1 and y2 > y1) else aligned_face
        
        _, buffer = cv2.imencode(".jpg", cv2.resize(crop, (120, 120)))
        thumbnail_base64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

        return {
            "success": True,
            "embedding": embedding,
            "box": box,
            "confidence": score,
            "thumbnail": thumbnail_base64
        }

    def compute_similarity(self, embedding1, embedding2):
        """
        Compute cosine similarity between two 128-D embedding vectors.
        Returns a float between -1.0 and 1.0 (typically 0.0 to 1.0 for faces).
        """
        arr1 = np.array(embedding1, dtype=np.float32).reshape(1, -1)
        arr2 = np.array(embedding2, dtype=np.float32).reshape(1, -1)

        norm1 = np.linalg.norm(arr1)
        norm2 = np.linalg.norm(arr2)
        if norm1 == 0 or norm2 == 0:
            return 0.0

        cosine_sim = float(np.dot(arr1, arr2.T) / (norm1 * norm2))
        return cosine_sim

    def verify_face(self, target_embedding, registered_embedding, threshold=COSINE_SIMILARITY_THRESHOLD):
        """
        Verify if target_embedding matches registered_embedding above the threshold.
        """
        similarity = self.compute_similarity(target_embedding, registered_embedding)
        is_match = similarity >= threshold
        return {
            "is_match": bool(is_match),
            "similarity": round(similarity, 4),
            "threshold": threshold,
            "confidence_percentage": round(min(max((similarity - 0.2) / 0.6 * 100, 0), 100), 1)
        }

# Singleton instance
face_service = FaceService()
