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

A model may be used for local development while being blocked from the commercial distribution bundle until all gates pass.
