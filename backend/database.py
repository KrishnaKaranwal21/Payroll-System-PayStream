import motor.motor_asyncio
import os
from dotenv import load_dotenv

# Load the secret .env file
load_dotenv()

# Get the URL from the environment variable
MONGO_DETAILS = os.getenv("MONGO_URL")

if not MONGO_DETAILS:
    print("Error: MONGO_URL not found. Check your .env file.")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)

database = client.payroll_db

user_collection = database.get_collection("users")
salary_collection = database.get_collection("salary_slips")
expense_collection = database.get_collection("expenses")

def pydantic_encoder(item) -> dict:
    if item:
        item["id"] = str(item["_id"])
        del item["_id"]
    return item