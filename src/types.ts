export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  type: TransactionType;
  description: string;
}

export type UserRole = 'admin' | 'viewer';

export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  categoryBreakdown: { name: string; value: number }[];
  monthlyTrend: { month: string; balance: number; income: number; expenses: number }[];
  sankeyData: { nodes: { name: string }[]; links: { source: number; target: number; value: number }[] };
  radarData: { subject: string; A: number; fullMark: number }[];
  categoryComparison: { name: string; current: number; previous: number }[];
  comparison: {
    incomeChange: number;
    expenseChange: number;
  };
}
