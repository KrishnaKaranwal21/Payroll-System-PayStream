import asyncio
from database import user_collection
from main import get_password_hash

async def seed():
    print("Starting Database Seed (Users Only)...\n")

    # --- 1. CREATE ADMIN USER ---
    admin_email = "hire-me@anshumat.org"
    admin = await user_collection.find_one({"email": admin_email})
    
    if not admin:
        await user_collection.insert_one({
            "email": admin_email,
            "hashed_password": get_password_hash("HireMe@2025!"),
            "role": "admin"
        })
        print(f"Created Master Admin: {admin_email}")
        print("   Password: HireMe@2025!")
    else:
        print(f"Master Admin already exists: {admin_email}")

    # --- 2. CREATE EMPLOYEE USER ---
    emp_email = "employee@anshumat.org"
    employee = await user_collection.find_one({"email": emp_email})
    
    if not employee:
        await user_collection.insert_one({
            "email": emp_email,
            "hashed_password": get_password_hash("Employee@2025!"),
            "role": "employee"
        })
        print(f"Created Employee: {emp_email}")
        print("   Password: Employee@2025!")
    else:
        print(f"Employee already exists: {emp_email}")

    print("\nSeed Complete!") 
    print("   -> No sample operations (salary/expenses) were added.")
    print("   -> Please log in to the website to create data manually.")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(seed())