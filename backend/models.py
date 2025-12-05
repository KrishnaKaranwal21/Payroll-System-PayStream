from pydantic import BaseModel, EmailStr, Field, BeforeValidator
from typing import Optional, Annotated
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "employee"

class SalarySlip(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    employee_id: str
    amount: float
    month: str
    year: int

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str

class Expense(ExpenseCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    employee_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    status: str = "Pending"
    rejection_reason: Optional[str] = None