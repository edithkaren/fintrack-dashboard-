# FinTrack - Personal Finance Dashboard

FinTrack is a modern, responsive personal finance management application built to help users track their income, expenses, and overall financial health with ease. It features real-time data visualization, dark mode support, and a role-based access system.

## 🚀 Framework & Technology Stack

- **Framework**: [React 18](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/).
- **Build Tool**: [Vite](https://vitejs.dev/) for fast development and optimized production builds.
- **Language**: TypeScript for type safety and better developer experience.

## 🎨 Styling Approach

- **Tailwind CSS**: We utilized Tailwind CSS for a utility-first styling approach. This allowed for rapid UI development and easy maintenance of a consistent design system.
- **Responsive Design**: The app is fully responsive, featuring a mobile-bottom navigation that transforms into a desktop sidebar.
- **Dark Mode**: Implemented using Tailwind's `dark` class strategy. It includes:
  - System preference detection.
  - Persistent storage in `localStorage`.
  - Smooth color transitions via global CSS rules in `index.css`.
- **Icons**: [Lucide React](https://lucide.dev/) for a clean and consistent iconography set.

## 📊 Data Visualization

We chose **Recharts** for its declarative nature and seamless integration with React. The dashboard includes:
- **Sankey Diagram**: Visualizes the flow of funds from Income to Balance to Expenses and Categories.
- **Radar Chart**: Displays the distribution of spending across different categories.
- **Bar & Area Charts**: Track monthly trends and income vs. expense comparisons.

## 🧠 State Management

- **React Hooks**: We opted for native React state management using `useState` and `useEffect` to keep the application lightweight and avoid unnecessary dependencies.
- **Derived State**: `useMemo` is heavily utilized to calculate complex financial statistics (total balance, income/expense changes, chart data) in real-time as the transaction list updates.
- **Persistence**: Application state (transactions, user role, theme preference) is persisted using the browser's `localStorage` API.

## 🛠️ Key Features

- **Transaction Management**: Add, edit, and delete transactions with category and type (Income/Expense) selection.
- **Advanced Filtering**: Filter transactions by search query, type, category, and date ranges (Last Month, Last 3 Months, etc.).
- **Insights Dashboard**: Deep-dive visualizations into spending patterns and monthly comparisons.
- **Role-Based Access**: Switch between 'Admin' (full access) and 'Viewer' (read-only) roles to simulate different user permissions.
- **Data Export**: Export your transaction history to CSV format for external analysis.

## 📦 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

---

