# Model and Dependency License Gates

No dependency becomes a bundled production dependency until it passes all gates.

## Gate A — Code
- license identified
- attribution requirements captured
- redistribution permitted
- modification permitted where needed

## Gate B — Weights
- weight license identified separately from code
- commercial use verified
- redistribution/bundling verified
- prohibited-use clauses reviewed

## Gate C — Data / Voice
- training/data provenance understood where material
- user voice requires explicit authorization
- no third-party identity cloning without authorization

## Gate D — Distribution
- Windows packaging allowed
- macOS/App Store implications understood
- model download mechanism compliant
- notices included

## Gate E — Runtime
- supported GPU backends
- memory requirements
- performance benchmark
- deterministic failure handling

## Enforcement in C6 core

- A model manifest must identify its id, version, license, and provenance before registration.
- Hardware eligibility and commercial eligibility are separate decisions.
- ModelRegistry.eligible(...) evaluates local-inference and hardware compatibility; it does **not** mean a model is cleared for commercial distribution.
- ModelRegistry.commercialReady(...) requires commercialRedistribution, licenseVerified, weightsLicenseVerified, and provenanceVerified to be explicitly true.
- Missing review flags fail closed. Do not infer verification from a license name, model card, or provider identity.
- No model manifests are currently pre-approved or auto-registered by the application. The empty model inventory is intentional until evidence is reviewed.

A model may be used for local development while being blocked from the commercial distribution bundle until all gates pass.
