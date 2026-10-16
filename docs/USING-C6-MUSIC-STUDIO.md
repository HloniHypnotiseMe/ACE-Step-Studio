# Using C6 Music Studio

## Current usable path

The studio is a local-first browser workstation inside `ACE-Step-Studio/app`.

### Start the UI

From the repository root:

```bash
cd app
npm install
npm run dev
```

Open the Vite address printed by the terminal (normally `http://localhost:5173`).

### Start the local AI server

The UI's AI generation and stem separation features use the local server.

```bash
cd app
npm start
```

For normal development, the server can be started separately from the Vite UI. The server exposes the C6 local bridge under `/api/c6-local`.

## What works in the current build

- Import local audio.
- Record microphone audio in the browser.
- Generate audio through the local ACE-Step integration when the local generation runtime is available.
- Play audio through the browser audio engine.
- Create persistent project tracks and timeline clips.
- Drag clips on the arrangement timeline.
- Resize clips from the right edge.
- Snap clip movement and resizing to the project BPM's one-beat grid.
- Mute and solo tracks.
- Send audio to the local StemDeck bridge and add returned stems as editable project tracks when StemDeck is running.
- Autosave and reload project state through IndexedDB.
- Save/load the project from the studio controls.

## Local AI dependencies

### Music generation

The C6 bridge uses the actual ACE-Step local generation service. The generation runtime must be installed/configured according to the ACE-Step repository's own requirements.

### Stem separation

Set:

```env
C6_STEMDECK_ENABLED=true
C6_STEMDECK_URL=http://127.0.0.1:8000
# Optional: only set this when your configured API actually exposes a health endpoint
C6_STEMDECK_HEALTH_URL=http://127.0.0.1:8000/health
```

Then run the StemDeck-compatible local API. The health dashboard does not assume that a standalone StemDeck desktop build exposes `/health`; set `C6_STEMDECK_HEALTH_URL` only when your configured API provides that endpoint. Without it, health is reported as unverified rather than claiming StemDeck is reachable. If stem separation is unavailable, the rest of the studio remains usable.

## Important boundary

The browser UI is not the final packaged desktop product yet. The current build is the **functional local workstation vertical slice** used to validate the C6 architecture before packaging the same core into a desktop shell.

The next productization layers are:

1. desktop shell and packaged local runtime;
2. project package export/import;
3. model/hardware manager;
4. richer mixer and routing;
5. multi-clip arrangement and track-to-track editing;
6. AI Producer workspace and variation workflows;
7. deterministic offline render/export;
8. crash recovery and production-grade diagnostics.

## Definition of usable

The build is considered usable when a user can:

`Launch → Import/Generate/Record → Edit timeline → Play → Split stems → Save → Reload`

without requiring a cloud service for the core editing workflow.

## Model inventory configuration

The Model Manager reads a local JSON manifest only when `C6_MODEL_MANIFEST_PATH` is explicitly set in the server environment. It does not download models, infer licenses, or mark weights as installed. The manifest may be a JSON array or an object with a `models` array.

Example entry (replace with evidence-backed values before use):

```json
{
  "models": [
    {
      "id": "your-model-id",
      "version": "1.0",
      "providerId": "your-provider-adapter",
      "license": "review required",
      "weightsLicense": "review required",
      "commercialRedistribution": false,
      "localInference": true,
      "backends": ["cpu"],
      "provenance": "URL or local evidence reference",
      "licenseVerified": false,
      "weightsLicenseVerified": false,
      "provenanceVerified": false
    }
  ]
}
```

A manifest entry is inventory metadata, not proof that the model weights are installed. Commercial clearance requires all three review flags to be explicitly true, in addition to commercial redistribution being permitted. Missing or malformed manifest files fail closed and are surfaced in the Model Manager.
