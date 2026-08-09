import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware


model = joblib.load('Mental Health Predictor.pkl')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,    #cors = Cross origin resource sharing = used to combine frontend and backend
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentData(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: Literal['Male', 'Female']
    country: str
    academic_level: Literal['Undergraduate', 'Graduate', 'High School']
    most_used_platform: Literal[
        'Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter',
        'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte',
        'WhatsApp', 'WeChat'
    ]
    purpose_of_use: Literal[
        'Networking', 'Education', 'Entertainment', 'News'
    ]
    avg_daily_usage_hours: float = Field(..., ge=0, le=24)
    daily_unlocks: int = Field(..., ge=0)
    study_hours: float = Field(..., ge=0, le=24)
    physical_activity_hours: float = Field(..., ge=0, le=24)
    sleep_hours_per_night: float = Field(..., ge=0, le=24)
    stress_level: Literal['Medium', 'Low', 'Very High', 'High']

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "age": 21,
                    "gender": "Male",
                    "country": "India",
                    "academic_level": "Undergraduate",
                    "most_used_platform": "Instagram",
                    "purpose_of_use": "Entertainment",
                    "avg_daily_usage_hours": 5.5,
                    "daily_unlocks": 80,
                    "study_hours": 4.0,
                    "physical_activity_hours": 1.5,
                    "sleep_hours_per_night": 7.0,
                    "stress_level": "Medium"
                }
            ]
        }
    }


class PredictionResponse(BaseModel):
    predicted_mental_health_score: float


@app.get("/")
def greet():
    return {"Welcome": "Mental Health Predictor API"}


top_countries = [
    'Other', 'India', 'USA', 'Canada', 'Australia',
    'UK', 'Germany', 'Mexico', 'Turkey', 'France'
]


@app.post("/Predict", response_model=PredictionResponse)
def predict(data: StudentData):

    country_group = (
        data.country
        if data.country in top_countries
        else "Other"
    )

    input_row = pd.DataFrame([{
        'Age': data.age,
        'Gender': data.gender,
        'Country': data.country,
        'Academic_Level': data.academic_level,
        'Most_Used_Platform': data.most_used_platform,
        'Purpose_Of_Use': data.purpose_of_use,
        'Avg_Daily_Usage_Hours': data.avg_daily_usage_hours,
        'Daily_Unlocks': data.daily_unlocks,
        'Study_Hours': data.study_hours,
        'Physical_Activity_Hours': data.physical_activity_hours,
        'Sleep_Hours_Per_Night': data.sleep_hours_per_night,
        'Stress_Level': data.stress_level,
        'Grouped_country': country_group,
    }])

    prediction = model.predict(input_row)[0]

    return PredictionResponse(
        predicted_mental_health_score=round(float(prediction), 2)
    )