import motor.motor_asyncio

# PASTE YOUR CONNECTION STRING BELOW
# It should look like: mongodb+srv://admin:admin123@cluster0...
MONGO_DETAILS = "mongodb+srv://admin:admin123@cluster0.6ti3phs.mongodb.net/?retryWrites=true&w=majority"
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)

database = client.payroll_db

user_collection = database.get_collection("users")
salary_collection = database.get_collection("salary_slips")
expense_collection = database.get_collection("expenses")

# Helper to fix MongoDB _id issue
def pydantic_encoder(item) -> dict:
    if item:
        item["id"] = str(item["_id"])
        del item["_id"]
    return item

