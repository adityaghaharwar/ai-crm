import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCustomer,
  clearError,
  fetchCustomers,
  fetchInsight,
  removeCustomer,
} from "../features/customersSlice";

const EMPTY = { name: "", email: "", phone: "", company: "" };

export default function Customers() {
  const dispatch = useDispatch();
  const { items, insights, error, status } = useSelector((s) => s.customers);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => dispatch(fetchCustomers(search)), 250);
    return () => clearTimeout(t);
  }, [search, dispatch]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() || null]));
    const res = await dispatch(addCustomer(body));
    if (addCustomer.fulfilled.match(res)) setForm(EMPTY);
  };

  return (
    <section>
      <h1>Customers</h1>

      <form className="card form-grid" onSubmit={submit}>
        <label>
          Name
          <input required value={form.name} onChange={set("name")} />
        </label>
        <label>
          Email
          <input required type="email" value={form.email} onChange={set("email")} />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={set("phone")} />
        </label>
        <label>
          Company
          <input value={form.company} onChange={set("company")} />
        </label>
        <button className="btn primary" type="submit">
          Add customer
        </button>
        {error && <p className="error span-all">{error}</p>}
      </form>

      <input
        className="search"
        placeholder="Search by name, email or company"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search customers"
      />

      {status === "ready" && items.length === 0 && (
        <p className="muted">No customers found. Add one above to get started.</p>
      )}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Status</th>
              <th>Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <FragmentRow key={c.id} c={c} insight={insights[c.id]} dispatch={dispatch} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FragmentRow({ c, insight, dispatch }) {
  return (
    <>
      <tr>
        <td>
          <strong>{c.name}</strong>
          <div className="muted small">{c.email}</div>
        </td>
        <td>{c.company || "—"}</td>
        <td>
          <span className={`pill ${c.status}`}>{c.status}</span>
        </td>
        <td className="num">{c.score}</td>
        <td className="actions">
          <button className="btn small" onClick={() => dispatch(fetchInsight(c.id))}>
            Next action
          </button>
          <button
            className="btn small danger"
            onClick={() => window.confirm(`Delete ${c.name} and their deals and tasks?`) && dispatch(removeCustomer(c.id))}
          >
            Delete
          </button>
        </td>
      </tr>
      {insight && (
        <tr className="insight-row">
          <td colSpan={5}>
            {insight.text} <span className="muted small">({insight.source === "groq" ? "AI" : "rules"})</span>
          </td>
        </tr>
      )}
    </>
  );
}
