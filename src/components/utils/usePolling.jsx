import { useEffect } from "react";

/**
 * Executa callback imediatamente e depois a cada intervalMs, somente quando a aba estiver visível.
 */
export function usePolling(callback, intervalMs = 10000, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof callback !== "function") return;

    let timer;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      Promise.resolve(callback());
    };

    // run now
    tick();
    // schedule
    timer = setInterval(tick, intervalMs);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callback, intervalMs, enabled]);
}