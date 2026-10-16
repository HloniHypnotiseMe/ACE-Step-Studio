import { useCallback, useState } from "react";
import type { C6MusicProject } from "../../../../c6-core/src/project";

export function useProjectHistory(initial: C6MusicProject) {
  const [project, setProject] = useState(initial);
  const [past, setPast] = useState<C6MusicProject[]>([]);
  const [future, setFuture] = useState<C6MusicProject[]>([]);

  const apply = useCallback((updater: (project: C6MusicProject) => C6MusicProject) => {
    setProject(current => {
      const next = updater(current);
      if (next === current) return current;
      setPast(history => [...history.slice(-49), current]);
      setFuture([]);
      return next;
    });
  }, []);

  const replace = useCallback((next: C6MusicProject, resetHistory = false) => {
    if (resetHistory) {
      setPast([]);
      setFuture([]);
    } else {
      setPast(history => [...history.slice(-49), project]);
      setFuture([]);
    }
    setProject(next);
  }, [project]);

  const undo = useCallback(() => {
    setPast(history => {
      const previous = history[history.length - 1];
      if (!previous) return history;
      setProject(current => {
        setFuture(f => [current, ...f].slice(0, 50));
        return previous;
      });
      return history.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture(history => {
      const next = history[0];
      if (!next) return history;
      setProject(current => {
        setPast(p => [...p, current].slice(-50));
        return next;
      });
      return history.slice(1);
    });
  }, []);

  return { project, setProject: replace, apply, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}
