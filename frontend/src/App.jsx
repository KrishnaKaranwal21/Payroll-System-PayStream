import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, DollarSign, Users, FileText, CheckCircle, XCircle, 
  Download, Plus, TrendingUp, AlertCircle, UserPlus, Copy 
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

// --- UI COMPONENTS ---

const Card = ({ children, className = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 ${className}`}
  >
    {children}
  </motion.div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-100 text-rose-700 border-rose-200",
    admin: "bg-purple-100 text-purple-700 border-purple-200", // Special badge for admin role in table
    employee: "bg-blue-100 text-blue-700 border-blue-200"
  };
  // Fallback for role display or status
  const badgeColor = colors[status] || "bg-gray-100 text-gray-700";
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeColor}`}>
      {status}
    </span>
  );
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  
  // Auth State
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupRole, setSignupRole] = useState("employee");

  // Data State
  const [salarySlips, setSalarySlips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]); // NEW: Store list of employees
  
  // Forms State
  const [newSalary, setNewSalary] = useState({ employee_id: "", amount: "", month: "", year: "" });
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "" });

  // --- ACTIONS ---

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLoginMode) {
        // LOGIN
        const formData = new FormData();
        formData.append("username", email);
        formData.append("password", password);
        const res = await axios.post(`${API_URL}/auth/login`, formData);
        
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("role", res.data.role);
        setToken(res.data.access_token);
        setRole(res.data.role);
      } else {
        // SIGNUP
        await axios.post(`${API_URL}/auth/signup`, {
          email: email,
          password: password,
          role: signupRole
        });
        alert("Account Created! Please Login.");
        setIsLoginMode(true);
      }
    } catch (err) { 
      alert(isLoginMode ? "Login Failed" : "Signup Failed (Email might exist)"); 
    }
  };

  const fetchData = async () => {
    if (!token) return;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      if (role === "admin") {
        const statsRes = await axios.get(`${API_URL}/admin/stats`, authHeaders);
        const expRes = await axios.get(`${API_URL}/expense`, authHeaders);
        const usersRes = await axios.get(`${API_URL}/users`, authHeaders); // Get Employee List
        
        setStats(statsRes.data);
        setExpenses(expRes.data);
        setUsers(usersRes.data);
      } else {
        const salaryRes = await axios.get(`${API_URL}/salary-slip`, authHeaders);
        const expRes = await axios.get(`${API_URL}/expense`, authHeaders);
        setSalarySlips(salaryRes.data);
        setExpenses(expRes.data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [token, role]);

  const handleDownload = async (slipId, month) => {
    try {
      const response = await axios.get(`${API_URL}/salary-slip/${slipId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${month}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) { alert("Failed to download PDF"); }
  };

  const updateExpenseStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/expense/${id}/status?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) { alert("Action failed"); }
  };

  const submitSalary = async () => {
    try {
      await axios.post(`${API_URL}/salary-slip`, newSalary, { headers: { Authorization: `Bearer ${token}` } });
      alert("Salary Slip Sent!");
      fetchData(); // Refresh stats
    } catch(err) { alert("Failed to send slip. Check Employee ID."); }
  };

  const submitExpense = async () => {
    try {
      await axios.post(`${API_URL}/expense`, newExpense, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
      alert("Expense Submitted!");
    } catch(err) { alert("Failed to submit expense."); }
  };

  // --- RENDER AUTH PAGE ---
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 font-sans p-4">
        <Card className="w-full max-w-md text-center">
          <motion.div 
            key={isLoginMode ? "login" : "signup"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 rotate-3 hover:rotate-6 transition duration-300">
              {isLoginMode ? <DollarSign className="text-white w-10 h-10" /> : <UserPlus className="text-white w-10 h-10" />}
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-800 mb-2">{isLoginMode ? "Welcome Back" : "Create Account"}</h2>
            <p className="text-gray-500 mb-8">{isLoginMode ? "Enter your credentials to access payroll" : "Join the team today"}</p>
            
            <form onSubmit={handleAuth} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                <input 
                  className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition" 
                  placeholder="name@company.com" 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
                <input 
                  className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition" 
                  type="password" 
                  placeholder="••••••••" 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>

              {!isLoginMode && (
                <div className="flex gap-4 mt-2">
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="role" value="employee" checked={signupRole === "employee"} onChange={() => setSignupRole("employee")} />
                      <span className="text-sm font-medium text-gray-600">Employee</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="role" value="admin" checked={signupRole === "admin"} onChange={() => setSignupRole("admin")} />
                      <span className="text-sm font-medium text-gray-600">Admin</span>
                   </label>
                </div>
              )}

              <button className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition transform hover:scale-[1.02] active:scale-95 mt-4">
                {isLoginMode ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => setIsLoginMode(!isLoginMode)} 
                  className="ml-2 font-bold text-blue-600 hover:text-blue-700 underline"
                >
                  {isLoginMode ? "Sign Up" : "Log In"}
                </button>
              </p>
            </div>
          </motion.div>
        </Card>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-lg shadow-lg">
                <DollarSign className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-purple-700">
              PayStream
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Logged in as</span>
                <span className="text-sm font-bold text-gray-800 capitalize">{role}</span>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 font-bold transition text-sm">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* === ADMIN DASHBOARD === */}
        {role === "admin" && stats && (
          <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="flex items-center gap-4 !p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
                <div className="p-4 bg-blue-50 rounded-2xl"><Users className="text-blue-600 w-8 h-8" /></div>
                <div><p className="text-gray-500 font-medium">Total Employees</p><h3 className="text-3xl font-extrabold text-gray-800">{stats.total_users}</h3></div>
              </Card>
              <Card className="flex items-center gap-4 !p-6 border-l-4 border-emerald-500 hover:shadow-lg transition">
                <div className="p-4 bg-emerald-50 rounded-2xl"><DollarSign className="text-emerald-600 w-8 h-8" /></div>
                <div><p className="text-gray-500 font-medium">Total Disbursed</p><h3 className="text-3xl font-extrabold text-gray-800">${stats.total_salary_paid}</h3></div>
              </Card>
              <Card className="flex items-center gap-4 !p-6 border-l-4 border-amber-500 hover:shadow-lg transition">
                <div className="p-4 bg-amber-50 rounded-2xl"><AlertCircle className="text-amber-600 w-8 h-8" /></div>
                <div><p className="text-gray-500 font-medium">Pending Claims</p><h3 className="text-3xl font-extrabold text-gray-800">{stats.pending_expenses}</h3></div>
              </Card>
            </div>

            {/* Employee Directory (NEW) */}
            <Card className="!p-0 overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Employee Directory</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">User ID (Click to Copy)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-blue-50/50 transition">
                                    <td className="p-4 font-medium text-gray-700">{u.email}</td>
                                    <td className="p-4"><StatusBadge status={u.role} /></td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => {navigator.clipboard.writeText(u.id); alert(`Copied ID: ${u.id}`);}}
                                            className="flex items-center gap-2 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-3 py-1.5 rounded-lg text-sm font-mono transition group"
                                            title="Click to Copy ID"
                                        >
                                            {u.id} <Copy className="w-3 h-3 group-hover:scale-110 transition" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Expense Approvals */}
              <Card className="!p-0 overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-purple-600" /> Expense Requests</h3>
                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-md">{expenses.filter(e => e.status === 'Pending').length} Pending</span>
                </div>
                <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                  {expenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-start p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition">
                      <div>
                        <p className="font-bold text-gray-800">{exp.description}</p>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                           <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{exp.category}</span>
                           <span>•</span>
                           <span className="font-bold text-gray-700">${exp.amount}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">ID: {exp.employee_id.substring(0,8)}...</p>
                      </div>
                      <div className="flex gap-2">
                        {exp.status === "Pending" ? (
                          <>
                            <button onClick={() => updateExpenseStatus(exp.id, "Approved")} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition" title="Approve"><CheckCircle className="w-5 h-5"/></button>
                            <button onClick={() => updateExpenseStatus(exp.id, "Rejected")} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 border border-rose-200 transition" title="Reject"><XCircle className="w-5 h-5"/></button>
                          </>
                        ) : <StatusBadge status={exp.status} />}
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && <p className="text-center text-gray-400 py-4">No expenses found.</p>}
                </div>
              </Card>

              {/* Create Salary Form */}
              <Card>
                 <div className="mb-6 flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><DollarSign className="w-6 h-6"/></div>
                    <div>
                        <h3 className="text-lg font-bold">Issue Salary Slip</h3>
                        <p className="text-sm text-gray-500">Paste an Employee ID to pay them.</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Employee ID</label>
                        <input className="w-full p-3 mt-1 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none font-mono text-sm" placeholder="Paste ID from Directory above..." onChange={e => setNewSalary({...newSalary, employee_id: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Month</label>
                        <input className="w-full p-3 mt-1 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none" placeholder="e.g. October" onChange={e => setNewSalary({...newSalary, month: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Year</label>
                        <input className="w-full p-3 mt-1 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none" type="number" placeholder="2025" onChange={e => setNewSalary({...newSalary, year: parseInt(e.target.value)})} />
                      </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Amount ($)</label>
                        <input className="w-full p-3 mt-1 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none" type="number" placeholder="0.00" onChange={e => setNewSalary({...newSalary, amount: parseFloat(e.target.value)})} />
                    </div>
                    <button onClick={submitSalary} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition mt-2">Generate & Send Slip</button>
                 </div>
              </Card>
            </div>
          </div>
        )}

        {/* === EMPLOYEE DASHBOARD === */}
        {role === "employee" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Col: Expenses */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-xl shadow-indigo-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">New Expense</h2>
                        <p className="text-indigo-100 text-sm">Submit a claim for reimbursement</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg"><Plus className="w-6 h-6 text-white"/></div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-indigo-200 uppercase ml-1">Description</label>
                    <input className="w-full p-3 mt-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:bg-white/20 transition" placeholder="e.g. Client Dinner" onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-indigo-200 uppercase ml-1">Amount ($)</label>
                        <input className="w-full p-3 mt-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:bg-white/20 transition" type="number" placeholder="0.00" onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-indigo-200 uppercase ml-1">Category</label>
                        <input className="w-full p-3 mt-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:bg-white/20 transition" placeholder="e.g. Food" onChange={e => setNewExpense({...newExpense, category: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={submitExpense} className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-50 transition shadow-lg mt-2">Submit Claim</button>
                </div>
              </Card>

              <Card>
                <h3 className="font-bold mb-6 flex items-center gap-2 text-gray-700"><TrendingUp className="w-5 h-5 text-gray-400" /> Recent Activity</h3>
                <div className="space-y-3">
                  {expenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl border border-gray-100 transition group">
                      <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-full ${exp.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : exp.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                            {exp.status === 'Approved' ? <CheckCircle className="w-5 h-5"/> : exp.status === 'Rejected' ? <XCircle className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
                         </div>
                         <div>
                            <p className="font-bold text-gray-800 group-hover:text-blue-600 transition">{exp.description}</p>
                            <p className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString()} • {exp.category}</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">${exp.amount}</p>
                        <StatusBadge status={exp.status} />
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && <p className="text-gray-400 text-center py-4 text-sm">You haven't submitted any expenses yet.</p>}
                </div>
              </Card>
            </div>

            {/* Right Col: Salary Slips */}
            <Card>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800"><FileText className="w-6 h-6 text-blue-600" /> Salary Slips</h3>
                 <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">Secure & Encrypted</span>
              </div>
              
              <div className="space-y-4">
                {salarySlips.map((slip) => (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={slip.id} 
                    className="flex justify-between items-center p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition cursor-pointer group"
                    onClick={() => handleDownload(slip.id, slip.month)}
                  >
                    <div className="flex items-center gap-5">
                      <div className="bg-blue-50 p-4 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition">{slip.month} {slip.year}</p>
                        <p className="text-sm text-gray-400">Processed Payment</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <span className="font-bold text-xl text-emerald-600">${slip.amount}</span>
                      <div className="p-2 bg-gray-50 rounded-full text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                        <Download className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                ))}
                {salarySlips.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400 font-medium">No salary slips generated yet.</p>
                  </div>
                )}
              </div>
            </Card>

          </div>
        )}
      </main>
    </div>
  );
}