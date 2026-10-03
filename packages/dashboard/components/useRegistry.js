import { useEffect, useState } from "react";

export const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL;

export function useLiveSummary() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`${REGISTRY_URL}/dashboard/summary`);
        if (!res.ok) throw new Error("unreachable");
        const data = await res.json();
        if (!cancelled) setSummary(data);
      } catch {
        // keep last known value on transient failure
      }
    }
    poll();
    const id = setInterval(poll, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return summary;
}

export function useProviders() {
  const [providers, setProviders] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${REGISTRY_URL}/providers`);
        if (!res.ok) throw new Error("unreachable");
        const data = await res.json();
        if (!cancelled) setProviders(Array.isArray(data) ? data : data.providers || []);
      } catch {
        if (!cancelled) setProviders([]);
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return providers;
}
