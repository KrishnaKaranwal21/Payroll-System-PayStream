# Payroll Management System (MVP)

A Full Stack Payroll application built for the Internship Assignment.
Features role-based authentication (Admin/Employee), salary slip management, and expense tracking.

## 🚀 Tech Stack & Justification

* **Backend:** FastAPI (Python)
    * *Why:* Chosen for its high performance (async), automatic documentation (Swagger UI), and type safety with Pydantic.
* **Database:** MongoDB Atlas (NoSQL)
    * *Why:* Flexible schema design allows for easy iteration on Salary and Expense data structures without rigid migrations.
* **Frontend:** React + TailwindCSS
    * *Why:* React handles state management efficiently for the dashboard, and Tailwind allows for rapid, responsive UI development.

## 🛠️ Setup Instructions

### 1. Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac: source venv/bin/activate
pip install -r requirements.txt
python seed.py  # Seeds the mandatory Admin user
uvicorn main:app --reload
2. Frontend
Bash

cd frontend
npm install
npm run dev
🔐 Credentials (Demo User)
Email: hire-me@anshumat.org

Password: HireMe@2025!


---

### **4. Push to GitHub**
Now, push everything to your repository.

```bash
git init
git add .
git commit -m "Initial commit - Full Stack MVP complete"
# Link your repo (Create a new empty repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/payroll-system.git
git push -u origin master
Evaluation Checklist
[x] Login/Signup with Admin & Employee roles.

[x] Admin: Create salary slips.

[x] Employee: View slips & Submit expenses.

[x] Dashboard tables.

[x] Tech Stack Justification in README.

[x] Seeded User works.

You are ready to submit!

If you want to aim for the Bonus Points mentioned in the prompt (Charts or PDF Export), let me know and I can give you the code for that. Otherwise, good luck with the submission!