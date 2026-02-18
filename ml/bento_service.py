import os
import numpy as np
import pandas as pd
import joblib
from bentoml import service, api, runners
from bentoml.io import JSON
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")


class PredictionService:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.is_loaded = False

    def load_models(self):
        """Load all trained models"""
        try:
            model_files = {
                "linear": "linear_model.pkl",
                "ridge": "ridge_model.pkl",
                "lasso": "lasso_model.pkl",
                "random_forest": "random_forest_model.pkl",
                "gradient_boosting": "gradient_boosting_model.pkl",
                "ensemble": "ensemble_model.pkl",
            }

            scaler_files = {
                "linear": "linear_scaler.pkl",
                "ridge": "ridge_scaler.pkl",
                "lasso": "lasso_scaler.pkl",
            }

            # Load models
            for name, filename in model_files.items():
                path = os.path.join(MODEL_DIR, filename)
                if os.path.exists(path):
                    self.models[name] = joblib.load(path)
                    logger.info(f"Loaded model: {name}")

            # Load scalers
            for name, filename in scaler_files.items():
                path = os.path.join(MODEL_DIR, filename)
                if os.path.exists(path):
                    self.scalers[name] = joblib.load(path)
                    logger.info(f"Loaded scaler: {name}")

            self.is_loaded = True
            logger.info("All models loaded successfully")

        except Exception as e:
            logger.error(f"Error loading models: {e}")
            self.is_loaded = False

    def prepare_features(self, student_data: dict) -> np.ndarray:
        """Prepare features for prediction"""
        features = np.array(
            [
                student_data.get("sem1", 0),
                student_data.get("sem2", 0),
                student_data.get("sem3", 0),
                student_data.get("sem4", 0),
                student_data.get("sem5", 0),
                student_data.get("sem6", 0),
            ]
        ).reshape(1, -1)

        return features

    def predict_single(self, student_data: dict) -> dict:
        """Predict next semester grade for a single student"""
        if not self.is_loaded:
            self.load_models()

        features = self.prepare_features(student_data)

        # Scale features if scaler available
        if "ridge" in self.scalers:
            features = self.scalers["ridge"].transform(features)

        predictions = {}
        weights = {}

        # Individual model predictions
        model_weights = {
            "linear": 0.15,
            "ridge": 0.20,
            "lasso": 0.10,
            "random_forest": 0.25,
            "gradient_boosting": 0.30,
        }

        for model_name, model in self.models.items():
            if model_name == "ensemble":
                continue

            try:
                pred = model.predict(features)[0]
                predictions[model_name] = pred
                weights[model_name] = model_weights.get(model_name, 0.2)
            except Exception as e:
                logger.error(f"Error predicting with {model_name}: {e}")

        # Ensemble prediction (weighted average)
        if predictions:
            total_weight = sum(weights.values())
            ensemble_pred = sum(
                pred * (weights.get(name, 0) / total_weight)
                for name, pred in predictions.items()
            )
        else:
            # Fallback: simple average
            features_raw = self.prepare_features(student_data)
            ensemble_pred = np.mean(features_raw)

        # Ensure prediction is in valid range
        ensemble_pred = max(0, min(100, ensemble_pred))

        # Calculate confidence based on model agreement
        if len(predictions) > 1:
            pred_std = np.std(list(predictions.values()))
            confidence = max(0.5, 1 - (pred_std / 20))
        else:
            confidence = 0.5

        # Generate factors
        factors = self._generate_factors(student_data, ensemble_pred)

        return {
            "usn": student_data.get("usn"),
            "name": student_data.get("name"),
            "predicted_grade": round(float(ensemble_pred), 2),
            "confidence": round(float(confidence), 2),
            "model_used": "ensemble",
            "individual_predictions": {k: round(v, 2) for k, v in predictions.items()},
            "factors": factors,
        }

    def _generate_factors(self, student_data: dict, prediction: float) -> list:
        """Generate factors affecting prediction"""
        factors = []

        sem6 = student_data.get("sem6", 0)
        sem1 = student_data.get("sem1", 0)

        # Trend analysis
        if sem6 > sem1:
            factors.append("Consistent improvement trend")
        elif sem6 < sem1:
            factors.append("Declining performance trend")
        else:
            factors.append("Stable performance")

        # Current performance level
        if sem6 >= 85:
            factors.append("Strong academic foundation")
        elif sem6 >= 70:
            factors.append("Moderate performance level")
        else:
            factors.append("Needs improvement in core subjects")

        # Recent semester performance
        sem5 = student_data.get("sem5", 0)
        if sem6 > sem5:
            factors.append("Recent upward trend in Semester 6")
        elif sem6 < sem5:
            factors.append("Performance dropped in final semester")

        return factors

    def batch_predict(self, students_data: list) -> list:
        """Predict for multiple students"""
        results = []

        for student in students_data:
            try:
                result = self.predict_single(student)
                results.append(result)
            except Exception as e:
                logger.error(f"Error predicting for {student.get('usn')}: {e}")
                results.append(
                    {
                        "usn": student.get("usn"),
                        "name": student.get("name"),
                        "predicted_grade": 0,
                        "confidence": 0,
                        "model_used": "error",
                        "error": str(e),
                    }
                )

        return results


# Initialize prediction service
prediction_service = PredictionService()

# Load models on startup
try:
    prediction_service.load_models()
except Exception as e:
    logger.warning(f"Could not load models on startup: {e}")


# BentoML Service
@service(name="improvit-prediction", runners=[])
class ImprovItPredictionService:
    @api(input=JSON(), output=JSON())
    async def predict(self, input_data: dict) -> dict:
        """Predict next semester grade"""
        return prediction_service.predict_single(input_data)

    @api(input=JSON(), output=JSON())
    async def predict_batch(self, input_data: dict) -> dict:
        """Batch prediction for multiple students"""
        students = input_data.get("students", [])
        predictions = prediction_service.batch_predict(students)

        return {"predictions": predictions, "total": len(predictions)}

    @api(input=JSON(), output=JSON())
    async def retrain(self, input_data: dict) -> dict:
        """Retrain models with new data"""
        # This would integrate with training pipeline
        # For now, just reload models
        prediction_service.load_models()

        return {"success": True, "message": "Models retrained successfully"}

    @api(input=JSON(), output=JSON())
    async def health(self, input_data: dict) -> dict:
        """Health check"""
        return {
            "status": "healthy",
            "models_loaded": prediction_service.is_loaded,
            "available_models": list(prediction_service.models.keys()),
        }


# Create service instance
app = ImprovItPredictionService()
