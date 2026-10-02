import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchCustomers } from "./features/customersSlice";
import { fetchDeals } from "./features/dealsSlice";
import { fetchTasks } from "./features/tasksSlice";
import { fetchDashboard } from "./features/dashboardSlice";
import Dashboard from "./components/Dashboard";
import Customers from "./components/Customers";
import Pipeline from "./components/Pipeline";
import Tasks from "./components/Tasks";

const VIEWS = [
  ["dashboard", "Overview", Dashboard],
  ["customers", "Customers", Customers],
  ["pipeline", "Pipeline", Pipeline],
  ["tasks", "Tasks", Tasks],
];

export default function App() {
  const dispatch = useDispatch();
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchDeals());
    dispatch(fetchTasks());
    dispatch(fetchDashboard());
  }, [dispatch]);

  const Current = VIEWS.find(([id]) => id === view)[2];

  return (
    <div className="shell">
      <nav className="rail" aria-label="Main">
        <div className="brand">Pulse CRM</div>
        {VIEWS.map(([id, label]) => (
          <button
            key={id}
            className={`rail-item ${view === id ? "on" : ""}`}
            onClick={() => setView(id)}
            aria-current={view === id ? "page" : undefined}
          >
            {label}
          </button>
        ))}
      </nav>
      <main className="panel">
        <Current />
      </main>
    </div>
  );
}
