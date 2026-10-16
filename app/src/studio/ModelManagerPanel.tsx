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
        <span className={state.checks.stemSeparation ? "ok" : "warn"}>STEMS {state.checks.stemSeparation ? "READY" : "NOT VERIFIED"}</span>
        <span className={state.checks.modelManifestsConfigured ? "ok" : "warn"}>MANIFESTS {state.checks.modelManifestsConfigured ? "REGISTERED" : "NONE REGISTERED"}</span>
      </div>
      {state.modelManifest?.warning && <small>{state.modelManifest.warning}</small>}
      {state.models.length === 0 ? <small>No model manifests are registered. Configure C6_MODEL_MANIFEST_PATH with a reviewed local JSON manifest; models are never auto-approved or downloaded.</small> :
        state.models.map(model => <div className="model-row" key={model.id}>
          <div>
            <strong>{model.id}</strong>
            <small>{model.providerId} · v{model.version} · code: {model.license} · weights: {model.weightsLicense ?? "unreviewed"}</small>
            <small>Hardware: {model.hardwareEligible ? "compatible" : "not eligible / requirements unknown"} · Local inference: {model.localInference ? "yes" : "no"}</small>
            <small>License review: {model.licenseVerified === true ? "passed" : "pending"} · Weight review: {model.weightsLicenseVerified === true ? "passed" : "pending"} · Provenance: {model.provenanceVerified === true ? "verified" : "pending"}</small>
          </div>
          <span>{model.commercialReady ? "Commercial-cleared" : "Review required"}</span>
        </div>)}
    </>}
  </section>;
}
