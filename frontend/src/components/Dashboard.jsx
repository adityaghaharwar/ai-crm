import { useDispatch, useSelector } from "react-redux";
import { runSweep } from "../features/dashboardSlice";

const money = (n) => `$${Math.round(n).toLocaleString()}`;

export default function Dashboard() {
  const dispatch = useDispatch();
  const { data, status, error, lastSweep } = useSelector((s) => s.dashboard);

  if (status === "failed")
    return <p className="error">Could not load the overview: {error}. Is the API running on port 8000?</p>;
  if (!data) return <p className="muted">Loading overview…</p>;

  const manual = data.total_tasks - data.automated_tasks;

  return (
    <section>
      <h1>Overview</h1>

      <div className="readouts">
        <Readout label="Customers" value={data.customers} />
        <Readout label="Open deals" value={data.open_deals} />
        <Readout label="Pipeline value" value={money(data.pipeline_value)} />
        <Readout label="Won value" value={money(data.won_value)} />
        <Readout label="Open tasks" value={data.open_tasks} />
      </div>

      <div className="card meter-card">
        <div className="row between">
          <div>
            <h2>Automation meter</h2>
            <p className="muted">Share of tasks created by the automation layer instead of by hand.</p>
          </div>
          <div className="big">{data.automation_share}%</div>
        </div>
        <div className="meter" role="img" aria-label={`${data.automation_share} percent of tasks automated`}>
          <div className="meter-fill" style={{ width: `${data.automation_share}%` }} />
        </div>
        <div className="row between small muted">
          <span>{data.automated_tasks} automated</span>
          <span>{manual} manual</span>
        </div>
        <div className="row gap">
          <button className="btn" onClick={() => dispatch(runSweep())}>
            Check for idle deals
          </button>
          {lastSweep !== null && (
            <span className="muted small">
              {lastSweep === 0 ? "No idle deals found." : `Created ${lastSweep} follow-up task(s).`}
            </span>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Deals by stage</h2>
        {data.stages.map((s) => {
          const max = Math.max(1, ...data.stages.map((x) => x.count));
          return (
            <div className="stage-row" key={s.stage}>
              <span className="stage-name">{s.stage}</span>
              <div className="bar">
                <div className={`bar-fill ${s.stage}`} style={{ width: `${(s.count / max) * 100}%` }} />
              </div>
              <span className="stage-num">
                {s.count} · {money(s.value)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Readout({ label, value }) {
  return (
    <div className="readout">
      <div className="readout-value">{value}</div>
      <div className="readout-label">{label}</div>
    </div>
  );
}
