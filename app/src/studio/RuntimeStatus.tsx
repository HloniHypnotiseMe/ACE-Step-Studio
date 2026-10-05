import { useEffect, useState } from "react";
import { getRuntimeHealth, type RuntimeHealth } from "./api/RuntimeClient";

export function RuntimeStatus() {
  const [health, setHealth] = useState<RuntimeHealth>();
  const [error, setError] = useState<string>();

  const refresh = () => {
    setError(undefined);
    void getRuntimeHealth().then(setHealth).catch(e => setError(e instanceof Error ? e.message : "Runtime check failed"));
  };

  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 10000); return () => window.clearInterval(timer); }, []);

  return <section className="runtime-status card">
    <div className="runtime-header"><strong>LOCAL RUNTIMES</strong><button onClick={refresh}>Refresh</button></div>
    {error && <small>{error}</small>}
    {!health && !error && <small>Checking local AI runtimes…</small>}
    {health && <div className="runtime-list">
      {health.runtimes.map(runtime => <div className="runtime-item" key={runtime.id}>
        <span className={`runtime-dot runtime-${runtime.status}`} />
        <div><strong>{runtime.label}</strong><small>{runtime.detail}</small></div>
      </div>)}
    </div>}
  </section>;
}
