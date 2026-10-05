import { useEffect, useState } from "react";
import { getRuntimeReadiness, type RuntimeReadiness } from "./api/RuntimeClient";

export function ModelManagerPanel() {
  const [state, setState] = useState<RuntimeReadiness>();
  const [error, setError] = useState<string>();

  const refresh = () => {
    setError(undefined);
    void getRuntimeReadiness().then(setState).catch(e => setError(e instanceof Error ? e.message : "Model manager check failed"));
  };

  useEffect(() => { refresh(); }, []);

  return <section className="model-manager card">
    <div className="runtime-header"><strong>MODEL MANAGER</strong><button onClick={refresh}>Refresh</button></div>
    {error && <small>{error}</small>}
    {!state && !error && <small>Checking hardware and model eligibility…</small>}
    {state && <>
      <div className="hardware-summary">
        <strong>{state.hardware.backend.toUpperCase()}</strong>
        <small>{state.hardware.vramGb == null ? "VRAM unknown" : state.hardware.vramGb.toFixed(1) + " GB VRAM"} · {state.hardware.source} · {state.hardware.confidence} confidence</small>
      </div>
      <div className="readiness-grid">
        <span className={state.checks.aceStep ? "ok" : "warn"}>ACE-Step {state.checks.aceStep ? "READY" : "OFFLINE"}</span>
        <span className={state.checks.stemSeparation ? "ok" : "warn"}>STEMS {state.checks.stemSeparation ? "READY" : "OFFLINE"}</span>
        <span className={state.checks.modelsAvailable ? "ok" : "warn"}>MODELS {state.checks.modelsAvailable ? "READY" : "NONE REGISTERED"}</span>
      </div>
      {state.models.length === 0 ? <small>No model manifests are registered yet. Eligibility stays license/provenance gated.</small> :
        state.models.map(model => <div className="model-row" key={model.id}>
          <div><strong>{model.id}</strong><small>{model.providerId} · v{model.version} · {model.license}</small></div>
          <span>{model.commercialRedistribution ? "Commercial-ready" : "Non-commercial"}</span>
        </div>)}
    </>}
  </section>;
}
