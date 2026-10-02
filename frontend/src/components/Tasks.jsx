import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTask, removeTask, toggleTask } from "../features/tasksSlice";

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "No date");

export default function Tasks() {
  const dispatch = useDispatch();
  const customers = useSelector((s) => s.customers.items);
  const { items, error } = useSelector((s) => s.tasks);
  const [form, setForm] = useState({ title: "", due: "", customer_id: "" });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const res = await dispatch(
      addTask({
        title: form.title.trim(),
        due_date: form.due ? new Date(form.due).toISOString() : null,
        customer_id: Number(form.customer_id),
      })
    );
    if (addTask.fulfilled.match(res)) setForm({ title: "", due: "", customer_id: "" });
  };

  return (
    <section>
      <h1>Tasks</h1>

      <form className="card form-grid" onSubmit={submit}>
        <label>
          Task
          <input required value={form.title} onChange={set("title")} />
        </label>
        <label>
          Due date
          <input type="date" value={form.due} onChange={set("due")} />
        </label>
        <label>
          Customer
          <select required value={form.customer_id} onChange={set("customer_id")}>
            <option value="">Choose a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn primary" type="submit">
          Add task
        </button>
        {error && <p className="error span-all">{error}</p>}
      </form>

      {items.length === 0 && <p className="muted">No tasks yet. Adding a customer creates one automatically.</p>}

      <ul className="tasks">
        {items.map((t) => (
          <li key={t.id} className={t.done ? "done" : ""}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => dispatch(toggleTask({ id: t.id, done: !t.done }))}
              aria-label={`Mark "${t.title}" ${t.done ? "open" : "done"}`}
            />
            <div className="grow">
              <div>{t.title}</div>
              <div className="muted small">
                Due {fmt(t.due_date)}
                {t.auto_generated && <span className="pill auto">automated</span>}
              </div>
            </div>
            <button className="btn small danger" onClick={() => dispatch(removeTask(t.id))}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
