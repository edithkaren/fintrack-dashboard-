import { Transaction } from '../types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2024-03-01', amount: 5000, category: 'Salary', type: 'income', description: 'Monthly Salary' },
  { id: '2', date: '2024-03-02', amount: 120, category: 'Food', type: 'expense', description: 'Grocery Store' },
  { id: '3', date: '2024-03-05', amount: 45, category: 'Transport', type: 'expense', description: 'Uber Ride' },
  { id: '4', date: '2024-03-10', amount: 800, category: 'Rent', type: 'expense', description: 'Monthly Rent' },
  { id: '5', date: '2024-03-12', amount: 200, category: 'Freelance', type: 'income', description: 'Logo Design Project' },
  { id: '6', date: '2024-03-15', amount: 60, category: 'Entertainment', type: 'expense', description: 'Netflix & Spotify' },
  { id: '7', date: '2024-03-18', amount: 150, category: 'Food', type: 'expense', description: 'Dinner with friends' },
  { id: '8', date: '2024-03-20', amount: 300, category: 'Shopping', type: 'expense', description: 'New Shoes' },
  { id: '9', date: '2024-03-22', amount: 1000, category: 'Bonus', type: 'income', description: 'Quarterly Bonus' },
  { id: '10', date: '2024-03-25', amount: 50, category: 'Health', type: 'expense', description: 'Pharmacy' },
  { id: '11', date: '2024-02-28', amount: 4800, category: 'Salary', type: 'income', description: 'Feb Salary' },
  { id: '12', date: '2024-02-15', amount: 900, category: 'Rent', type: 'expense', description: 'Feb Rent' },
  { id: '13', date: '2024-01-25', amount: 4800, category: 'Salary', type: 'income', description: 'Jan Salary' },
  { id: '14', date: '2024-01-10', amount: 850, category: 'Rent', type: 'expense', description: 'Jan Rent' },
];

export const CATEGORIES = [
  'Salary',
  'Food',
  'Transport',
  'Rent',
  'Freelance',
  'Entertainment',
  'Shopping',
  'Bonus',
  'Health',
  'Utilities',
  'Insurance',
  'Education',
  'Travel',
  'Investments',
  'Gifts',
  'Other'
];
