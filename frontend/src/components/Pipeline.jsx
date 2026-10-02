import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addDeal, moveDeal, removeDeal } from "../features/dealsSlice";

const STAGES = ["new", "qualified", "proposal", "won", "lost"];

export default function Pipeline() {
  const dispatch = useDispatch();
  const customers = useSelector((s) => s.customers.items);
  const { items: deals, error } = useSelector((s) => s.deals);
  const [form, setForm] = useState({ title: "", value: "", customer_id: "" });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const res = await dispatch(
      addDeal({ title: form.title.trim(), value: Number(form.value) || 0, customer_id: Number(form.customer_id) })
    );
    if (addDeal.fulfilled.match(res)) setForm({ title: "", value: "", customer_id: "" });
  };

  return (
    <section>
      <h1>Pipeline</h1>

      <form className="card form-grid" onSubmit={submit}>
        <label>
          Deal title
          <input required value={form.title} onChange={set("title")} />
        </label>
        <label>
          Value ($)
          <input type="number" min="0" value={form.value} onChange={set("value")} />
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
          Add deal
        </button>
        {error && <p className="error span-all">{error}</p>}
      </form>

      <div className="board">
        {STAGES.map((stage) => {
          const col = deals.filter((d) => d.stage === stage);
          return (
            <div className="column" key={stage}>
              <h2 className="column-head">
                <span className={`dot ${stage}`} /> {stage} <span className="muted">{col.length}</span>
              </h2>
              {col.map((d) => (
                <div className="deal" key={d.id}>
                  <strong>{d.title}</strong>
                  <div className="muted small">{d.customer_name}</div>
                  <div className="num">${Math.round(d.value).toLocaleString()}</div>
                  <div className="row gap">
                    <select
                      aria-label={`Move ${d.title} to stage`}
                      value={d.stage}
                      onChange={(e) => dispatch(moveDeal({ id: d.id, stage: e.target.value }))}
                    >
                      {STAGES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button className="btn small danger" onClick={() => dispatch(removeDeal(d.id))}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {col.length === 0 && <p className="muted small">No deals</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
