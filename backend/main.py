from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from bson import ObjectId

# Internal Imports
from database import user_collection, salary_collection, expense_collection, pydantic_encoder
from models import UserCreate, SalarySlip, Expense, ExpenseCreate
from pdf_utils import generate_salary_pdf

app = FastAPI()

# Enable CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURITY CONFIG ---
SECRET_KEY = "supersecretkey" 
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def get_password_hash(password): return pwd_context.hash(password)
def create_token(data: dict):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(minutes=60)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user = await user_collection.find_one({"email": email})
        if not user: raise HTTPException(status_code=401)
        return pydantic_encoder(user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")

# --- AUTH ROUTES ---
@app.post("/auth/signup")
async def signup(user: UserCreate):
    existing = await user_collection.find_one({"email": user.email})
    if existing: raise HTTPException(status_code=400, detail="Email exists")
    
    new_user = {
        "email": user.email,
        "hashed_password": get_password_hash(user.password),
        "role": user.role
    }
    await user_collection.insert_one(new_user)
    return {"status": "User created"}

@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await user_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    
    access_token = create_token({"sub": user["email"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@app.get("/auth/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# --- SALARY ROUTES ---
@app.post("/salary-slip")
async def create_salary(slip: SalarySlip, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    new_slip = slip.dict(exclude={"id"})
    await salary_collection.insert_one(new_slip)
    return {"status": "Salary slip created"}

@app.get("/salary-slip")
async def get_my_slips(current_user: dict = Depends(get_current_user)):
    # Employees see their own; Admins can see all
    filter_query = {"employee_id": str(current_user["id"])}
    if current_user["role"] == "admin":
        filter_query = {} 
        
    cursor = salary_collection.find(filter_query)
    return [pydantic_encoder(doc) async for doc in cursor]

@app.get("/salary-slip/{slip_id}/download")
async def download_slip(slip_id: str, current_user: dict = Depends(get_current_user)):
    try:
        slip = await salary_collection.find_one({"_id": ObjectId(slip_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if not slip:
        raise HTTPException(status_code=404, detail="Slip not found")

    if current_user["role"] != "admin" and slip["employee_id"] != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    pdf_buffer = generate_salary_pdf(slip, current_user["email"])

    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Payslip_{slip['month']}.pdf"}
    )

# --- EXPENSE ROUTES ---
@app.post("/expense")
async def submit_expense(expense: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    new_expense = expense.dict()
    # Add backend-generated fields
    new_expense["employee_id"] = str(current_user["id"])
    new_expense["status"] = "Pending"
    new_expense["date"] = datetime.utcnow()
    
    await expense_collection.insert_one(new_expense)
    return {"status": "Expense submitted"}

@app.get("/expense")
async def get_expenses(current_user: dict = Depends(get_current_user)):
    filter_query = {}
    if current_user["role"] != "admin":
        filter_query = {"employee_id": str(current_user["id"])}
        
    cursor = expense_collection.find(filter_query)
    return [pydantic_encoder(doc) async for doc in cursor]

@app.put("/expense/{expense_id}/status")
async def update_expense_status(
    expense_id: str, 
    status: str, 
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    try:
        oid = ObjectId(expense_id)
    except:
         raise HTTPException(status_code=400, detail="Invalid ID")

    result = await expense_collection.update_one(
        {"_id": oid},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    return {"status": "Expense updated successfully"}

# --- ADMIN ANALYTICS & USERS ---
@app.get("/admin/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    salary_agg = await salary_collection.aggregate(pipeline).to_list(1)
    total_salary = salary_agg[0]['total'] if salary_agg else 0

    pending_count = await expense_collection.count_documents({"status": "Pending"})
    user_count = await user_collection.count_documents({})

    return {
        "total_salary_paid": total_salary,
        "pending_expenses": pending_count,
        "total_users": user_count
    }

@app.get("/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = []
    async for user in user_collection.find():
        user_data = pydantic_encoder(user)
        del user_data["hashed_password"] # Never send passwords!
        users.append(user_data)
        
    return users