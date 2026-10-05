import type { C6MusicProject } from "../../../c6-core/src/project";

type Props = {
  project: C6MusicProject;
  onTrackChange: (id: string, patch: Partial<C6MusicProject["tracks"][number]>) => void;
};

export function MixerPanel({ project, onTrackChange }: Props) {
  return (
    <section className="mixer-panel">
      <div className="section-title">MIXER <small>Track gain · pan · mute · solo</small></div>
      <div className="mixer-strips">
        {project.tracks.length === 0 ? (
          <div className="mixer-empty">Add or generate audio to populate the mixer.</div>
        ) : project.tracks.map(track => {
          const meter = Math.max(4, Math.min(100, 42 + Math.abs(track.gainDb) * 2));
          return (
            <div className="mixer-strip" key={track.id}>
              <div className="mixer-meter"><i style={{ height: `${meter}%` }} /></div>
              <div className="mixer-name" title={track.name}>{track.name}</div>
              <input
                aria-label={`${track.name} gain`}
                type="range"
                min="-24"
                max="12"
                step="0.5"
                value={track.gainDb}
                onChange={event => onTrackChange(track.id, { gainDb: Number(event.target.value) })}
              />
              <strong>{track.gainDb.toFixed(1)} dB</strong>
              <input
                aria-label={`${track.name} pan`}
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={track.pan}
                onChange={event => onTrackChange(track.id, { pan: Number(event.target.value) })}
              />
              <span className="mixer-pan">{track.pan === 0 ? "C" : track.pan < 0 ? `L ${Math.round(Math.abs(track.pan) * 100)}` : `R ${Math.round(track.pan * 100)}`}</span>
              <div className="mixer-buttons">
                <button className={track.muted ? "active" : ""} onClick={() => onTrackChange(track.id, { muted: !track.muted })}>M</button>
                <button className={track.solo ? "active" : ""} onClick={() => onTrackChange(track.id, { solo: !track.solo })}>S</button>
              </div>
            </div>
          );
        })}
        <div className="mixer-strip master">
          <div className="mixer-meter"><i style={{ height: "76%" }} /></div>
          <div className="mixer-name">MASTER</div>
          <strong>0.0 dB</strong>
          <span className="mixer-pan">C</span>
          <div className="mixer-master-status">SAFE</div>
        </div>
      </div>
    </section>
  );
}
