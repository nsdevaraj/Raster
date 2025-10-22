import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@store/useAppStore.js';
import { traceRasterToSvg } from '@workers/potraceWorker.js';

export function useTraceWorker() {
  const isPendingRef = useRef(false);
  const { raster, settings, setVector, setStatus } = useAppStore((state) => ({
    raster: state.raster,
    settings: state.settings,
    setVector: state.setVector,
    setStatus: state.setStatus,
  }));

  const runTrace = useCallback(
    async (file) => {
      if (!file || isPendingRef.current) {
        return null;
      }

      isPendingRef.current = true;
      setStatus('processing');

      try {
        const result = await traceRasterToSvg(file, settings);
        setVector(result?.svg ?? null);
        setStatus('success');
        return result;
      } catch (error) {
        console.error('Failed to trace raster source', error);
        setStatus('error');
        throw error;
      } finally {
        isPendingRef.current = false;
      }
    },
    [setStatus, setVector, settings]
  );

  useEffect(() => {
    if (!raster) {
      return;
    }

    runTrace(raster).catch(() => {
      // errors are surfaced via setStatus
    });
  }, [raster, runTrace]);

  return { runTrace };
}
