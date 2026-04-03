import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  TrendingUp, 
  UserCircle, 
  Moon, 
  Sun, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart as PieChartIcon,
  BarChart2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  Sankey,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { Transaction, UserRole, DashboardStats, TransactionType } from './types';
import { MOCK_TRANSACTIONS, CATEGORIES } from './data/mockData';
import { cn } from './lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

function StatCard({ title, value, icon, trend, color }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  trend: string;
  color: 'blue' | 'emerald' | 'rose';
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
    rose: "bg-rose-50 dark:bg-rose-900/20 text-rose-600",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClasses[color])}>
          {icon}
        </div>
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          color === 'rose' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
        )}>
          {trend}
        </span>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
      <h4 className="text-2xl font-bold tracking-tight">${value.toLocaleString()}</h4>
    </div>
  );
}

export default function App() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fintrack_transactions');
    return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
  });
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('fintrack_role');
    return (saved as UserRole) || 'admin';
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('fintrack_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'insights'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('fintrack_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('fintrack_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('fintrack_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Derived Stats
  const stats = useMemo((): DashboardStats => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryData = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const categoryBreakdown = Object.entries(categoryData).map(([name, value]) => ({
      name,
      value: value as number
    })).sort((a, b) => b.value - a.value);

    // Monthly Trend (Last 6 months)
    const monthlyTrend = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const monthStr = format(date, 'MMM');
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthTransactions = transactions.filter(t => 
        isWithinInterval(parseISO(t.date), { start, end })
      );

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: monthStr,
        income,
        expenses,
        balance: income - expenses,
        fullDate: date
      };
    });

    // Monthly Comparison Insight
    const currentMonth = monthlyTrend[5];
    const lastMonth = monthlyTrend[4];
    
    const incomeChange = lastMonth.income > 0 
      ? ((currentMonth.income - lastMonth.income) / lastMonth.income) * 100 
      : 0;
    const expenseChange = lastMonth.expenses > 0 
      ? ((currentMonth.expenses - lastMonth.expenses) / lastMonth.expenses) * 100 
      : 0;

    // Sankey Data
    const sankeyNodes = [
      { name: 'Total Income' },
      { name: 'Balance' },
      { name: 'Total Expenses' },
      ...categoryBreakdown.map(c => ({ name: c.name }))
    ];

    const sankeyLinks = [
      { source: 0, target: 1, value: totalIncome },
      { source: 1, target: 2, value: totalExpenses },
      ...categoryBreakdown.map((c, i) => ({
        source: 2,
        target: 3 + i,
        value: c.value
      }))
    ];

    // Radar Data
    const radarData = categoryBreakdown.slice(0, 6).map(c => ({
      subject: c.name,
      A: c.value,
      fullMark: Math.max(...categoryBreakdown.map(cat => cat.value))
    }));

    // Category Comparison (Current vs Previous Month)
    const prevMonthDate = subMonths(new Date(), 1);
    const prevMonthStart = startOfMonth(prevMonthDate);
    const prevMonthEnd = endOfMonth(prevMonthDate);
    const prevMonthTransactions = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start: prevMonthStart, end: prevMonthEnd })
    );

    const prevCategoryData = prevMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const categoryComparison = CATEGORIES.map(cat => ({
      name: cat,
      current: categoryData[cat] || 0,
      previous: prevCategoryData[cat] || 0
    })).filter(c => c.current > 0 || c.previous > 0);

    return {
      totalBalance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      categoryBreakdown,
      monthlyTrend,
      sankeyData: { nodes: sankeyNodes, links: sankeyLinks },
      radarData,
      categoryComparison,
      comparison: {
        incomeChange,
        expenseChange
      }
    };
  }, [transactions]);

  // Handlers
  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role !== 'admin') return;

    const formData = new FormData(e.currentTarget);
    const newTransaction: Transaction = {
      id: editingTransaction?.id || Math.random().toString(36).substr(2, 9),
      date: formData.get('date') as string,
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as string,
      type: formData.get('type') as TransactionType,
      description: formData.get('description') as string,
    };

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? newTransaction : t));
    } else {
      setTransactions(prev => [newTransaction, ...prev]);
    }
    
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (role !== 'admin') return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (role !== 'admin') return;
    setTransactions(prev => prev.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    if (selectedIds.size === ids.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ids));
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = transactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.type,
      t.amount
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "transactions.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      
      let matchesDate = true;
      const tDate = parseISO(t.date);
      if (dateRangeFilter === 'this-month') {
        matchesDate = isWithinInterval(tDate, { start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
      } else if (dateRangeFilter === 'last-month') {
        const lastMonth = subMonths(new Date(), 1);
        matchesDate = isWithinInterval(tDate, { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
      } else if (dateRangeFilter === 'last-3-months') {
        matchesDate = isWithinInterval(tDate, { start: startOfMonth(subMonths(new Date(), 2)), end: endOfMonth(new Date()) });
      }

      return matchesSearch && matchesType && matchesCategory && matchesDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar / Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-64 bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 z-50">
        <div className="flex flex-col h-full p-4">
          <div className="hidden md:flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Wallet size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FinTrack</h1>
          </div>

          <div className="flex md:flex-col gap-2 flex-1 justify-around md:justify-start">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === 'dashboard' 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <LayoutDashboard size={20} />
              <span className="hidden md:block">Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('insights')}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === 'insights' 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <BarChart2 size={20} />
              <span className="hidden md:block">Insights</span>
            </button>
            <button 
              onClick={() => setActiveTab('transactions')}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === 'transactions' 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <ReceiptText size={20} />
              <span className="hidden md:block">Transactions</span>
            </button>
          </div>

          <div className="hidden md:block pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <UserCircle size={20} className="text-slate-400" />
                <span className="text-sm font-medium">{role === 'admin' ? 'Administrator' : 'Viewer'}</span>
              </div>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-white dark:bg-slate-900 border-none rounded-lg text-xs p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Switch to Admin</option>
                <option value="viewer">Switch to Viewer</option>
              </select>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {activeTab === 'dashboard' ? 'Financial Overview' : activeTab === 'transactions' ? 'Transaction History' : 'Financial Insights'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {activeTab === 'dashboard' 
                ? 'Track your spending and balance trends.' 
                : activeTab === 'transactions'
                ? 'Manage and filter your financial records.'
                : 'Deep dive into your spending patterns.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400">
              <UserCircle size={14} />
              {role === 'admin' ? 'Admin' : 'Viewer'}
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download size={18} />
              Export
            </button>
            {role === 'admin' && (
              <button 
                onClick={() => {
                  setEditingTransaction(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Plus size={18} />
                Add Transaction
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Balance" 
                  value={stats.totalBalance} 
                  icon={<Wallet className="text-blue-600" />}
                  trend="+2.5% from last month"
                  color="blue"
                />
                <StatCard 
                  title="Monthly Income" 
                  value={stats.totalIncome} 
                  icon={<ArrowUpRight className="text-emerald-600" />}
                  trend="+12% vs last month"
                  color="emerald"
                />
                <StatCard 
                  title="Monthly Expenses" 
                  value={stats.totalExpenses} 
                  icon={<ArrowDownRight className="text-rose-600" />}
                  trend="-4% vs last month"
                  color="rose"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold flex items-center gap-2">
                      <TrendingUp size={20} className="text-blue-500" />
                      Balance Trend
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.monthlyTrend}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: darkMode ? '#0f172a' : '#fff',
                            borderColor: darkMode ? '#1e293b' : '#e2e8f0',
                            borderRadius: '12px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorBalance)" 
                          isAnimationActive={true}
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold flex items-center gap-2">
                      <PieChartIcon size={20} className="text-purple-500" />
                      Spending Breakdown
                    </h3>
                  </div>
                  <div className="h-[300px] w-full flex flex-col md:flex-row items-center">
                    <div className="h-full w-full md:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.categoryBreakdown}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            isAnimationActive={true}
                            animationBegin={0}
                            animationDuration={1500}
                          >
                            {stats.categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 space-y-2 mt-4 md:mt-0">
                      {stats.categoryBreakdown.slice(0, 5).map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                          </div>
                          <span className="font-semibold">${item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights Section */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Financial Insights</h3>
                  <button 
                    onClick={() => setActiveTab('insights')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View Detailed Analysis →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Highest Expense</p>
                    <p className="text-lg font-bold">{stats.categoryBreakdown[0]?.name || 'N/A'}</p>
                    <p className="text-sm text-blue-500 mt-1">Focus on reducing this category next month.</p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Savings Rate</p>
                    <p className="text-lg font-bold">
                      {stats.totalIncome > 0 ? Math.round((stats.totalBalance / stats.totalIncome) * 100) : 0}%
                    </p>
                    <p className="text-sm text-emerald-500 mt-1">You're saving a healthy portion of your income.</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">Income vs Last Month</p>
                    <p className={cn(
                      "text-lg font-bold",
                      stats.comparison.incomeChange >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {stats.comparison.incomeChange >= 0 ? '+' : ''}{stats.comparison.incomeChange.toFixed(1)}%
                    </p>
                    <p className="text-sm text-purple-500 mt-1">Compared to previous month's earnings.</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">Expenses vs Last Month</p>
                    <p className={cn(
                      "text-lg font-bold",
                      stats.comparison.expenseChange <= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {stats.comparison.expenseChange >= 0 ? '+' : ''}{stats.comparison.expenseChange.toFixed(1)}%
                    </p>
                    <p className="text-sm text-amber-500 mt-1">Spending trend compared to last month.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'insights' ? (
            <motion.div 
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Insights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Highest Expense</p>
                  <p className="text-2xl font-bold">{stats.categoryBreakdown[0]?.name || 'N/A'}</p>
                  <p className="text-sm text-blue-500 mt-2">Focus on reducing this category next month.</p>
                </div>
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Savings Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.totalIncome > 0 ? Math.round((stats.totalBalance / stats.totalIncome) * 100) : 0}%
                  </p>
                  <p className="text-sm text-emerald-500 mt-2">You're saving a healthy portion of your income.</p>
                </div>
                <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">Income vs Last Month</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    stats.comparison.incomeChange >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {stats.comparison.incomeChange >= 0 ? '+' : ''}{stats.comparison.incomeChange.toFixed(1)}%
                  </p>
                  <p className="text-sm text-purple-500 mt-2">Compared to previous month's earnings.</p>
                </div>
                <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">Expenses vs Last Month</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    stats.comparison.expenseChange <= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {stats.comparison.expenseChange >= 0 ? '+' : ''}{stats.comparison.expenseChange.toFixed(1)}%
                  </p>
                  <p className="text-sm text-amber-500 mt-2">Spending trend compared to last month.</p>
                </div>
              </div>

              {/* Monthly Comparison Graph */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold flex items-center gap-2">
                      <TrendingUp size={20} className="text-blue-500" />
                      Monthly Income vs Expenses
                    </h3>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: darkMode ? '#0f172a' : '#fff',
                            borderColor: darkMode ? '#1e293b' : '#e2e8f0',
                            borderRadius: '12px'
                          }} 
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                        <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold flex items-center gap-2">
                      <PieChartIcon size={20} className="text-purple-500" />
                      Category Distribution (Radar)
                    </h3>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.radarData}>
                        <PolarGrid stroke={darkMode ? "#334155" : "#e2e8f0"} />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: darkMode ? "#94a3b8" : "#64748b" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar
                          name="Spending"
                          dataKey="A"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.6}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: darkMode ? '#0f172a' : '#fff',
                            borderColor: darkMode ? '#1e293b' : '#e2e8f0',
                            borderRadius: '12px'
                          }} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Transaction Flow (Sankey) */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <ArrowUpRight size={20} className="text-emerald-500" />
                    Transaction Flow (Income to Categories)
                  </h3>
                </div>
                <div className="h-[400px] w-full overflow-x-auto">
                  <div className="min-w-[600px] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <Sankey
                        data={stats.sankeyData}
                        node={{ stroke: '#3b82f6', strokeWidth: 2 }}
                        link={{ stroke: darkMode ? '#1e293b' : '#f1f5f9' }}
                        margin={{ top: 20, left: 20, right: 100, bottom: 20 }}
                      >
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: darkMode ? '#0f172a' : '#fff',
                            borderColor: darkMode ? '#1e293b' : '#e2e8f0',
                            borderRadius: '12px'
                          }} 
                        />
                      </Sankey>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Category Comparison (Current vs Previous) */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <Filter size={20} className="text-amber-500" />
                    Category Comparison (Current vs Previous Month)
                  </h3>
                </div>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.categoryComparison} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#0f172a' : '#fff',
                          borderColor: darkMode ? '#1e293b' : '#e2e8f0',
                          borderRadius: '12px'
                        }} 
                      />
                      <Legend verticalAlign="top" height={36}/>
                      <Bar dataKey="previous" fill="#94a3b8" radius={[0, 4, 4, 0]} name="Previous Month" />
                      <Bar dataKey="current" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Current Month" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Additional Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold mb-4">Spending Efficiency</h3>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Your spending is most concentrated in <span className="font-bold text-slate-900 dark:text-white">{stats.categoryBreakdown[0]?.name}</span>. 
                      Try to set a budget for this category to increase your savings rate.
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (stats.totalExpenses / (stats.totalIncome || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">Expense to Income Ratio: {Math.round((stats.totalExpenses / (stats.totalIncome || 1)) * 100)}%</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold mb-4">Financial Health Score</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-slate-100 dark:text-slate-800"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={226}
                          strokeDashoffset={226 - (226 * Math.min(100, (stats.totalBalance / (stats.totalIncome || 1)) * 100)) / 100}
                          className="text-emerald-500"
                        />
                      </svg>
                      <span className="absolute text-lg font-bold">
                        {Math.round(Math.min(100, (stats.totalBalance / (stats.totalIncome || 1)) * 100))}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Good Progress!</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Your balance relative to income is growing.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="transactions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Filters & Search */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select 
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="all">All Types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                    <select 
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="all">All Categories</option>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select 
                      value={dateRangeFilter}
                      onChange={(e) => setDateRangeFilter(e.target.value)}
                      className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="all">All Time</option>
                      <option value="this-month">This Month</option>
                      <option value="last-month">Last Month</option>
                      <option value="last-3-months">Last 3 Months</option>
                    </select>
                  </div>
                </div>
                
                <AnimatePresence>
                  {selectedIds.size > 0 && role === 'admin' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl"
                    >
                      <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                        {selectedIds.size} transaction{selectedIds.size > 1 ? 's' : ''} selected
                      </span>
                      <button 
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete Selected
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Transactions Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4 w-10">
                          {role === 'admin' && (
                            <input 
                              type="checkbox" 
                              checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                              onChange={() => toggleSelectAll(filteredTransactions.map(t => t.id))}
                              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                            />
                          )}
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      <AnimatePresence initial={false} mode="popLayout">
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((t) => (
                            <motion.tr 
                              key={t.id} 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                              layout
                              className={cn(
                                "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                selectedIds.has(t.id) && "bg-blue-50/50 dark:bg-blue-900/10"
                              )}
                            >
                            <td className="px-6 py-4">
                              {role === 'admin' && (
                                <input 
                                  type="checkbox" 
                                  checked={selectedIds.has(t.id)}
                                  onChange={() => toggleSelect(t.id)}
                                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                                />
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                              {format(parseISO(t.date), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium">{t.description}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-xs font-medium">
                                {t.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className={cn(
                                "text-sm font-bold",
                                t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                              )}>
                                {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {role === 'admin' ? (
                                  <>
                                    <button 
                                      onClick={() => {
                                        setEditingTransaction(t);
                                        setIsModalOpen(true);
                                      }}
                                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    >
                                      <Edit3 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteTransaction(t.id)}
                                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Read-only</span>
                                )}
                              </div>
                            </td>
                            </motion.tr>
                          ))
                        ) : (
                          <motion.tr
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td colSpan={6} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center gap-2 text-slate-400">
                                <ReceiptText size={48} strokeWidth={1} />
                                <p>No transactions found matching your criteria.</p>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">
                  {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                </h3>
                <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Description</label>
                    <input 
                      name="description"
                      required
                      defaultValue={editingTransaction?.description}
                      placeholder="e.g. Grocery Shopping"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">Amount</label>
                      <input 
                        name="amount"
                        type="number"
                        step="0.01"
                        required
                        defaultValue={editingTransaction?.amount}
                        placeholder="0.00"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">Type</label>
                      <select 
                        name="type"
                        defaultValue={editingTransaction?.type || 'expense'}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">Category</label>
                      <select 
                        name="category"
                        defaultValue={editingTransaction?.category || 'Other'}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">Date</label>
                      <input 
                        name="date"
                        type="date"
                        required
                        defaultValue={editingTransaction?.date || format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                    >
                      {editingTransaction ? 'Save Changes' : 'Add Transaction'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
