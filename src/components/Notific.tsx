import { useEffect, useRef, useState } from "react";

type NodeEntry = {
  id: number;
  parentID: number;
};

type Toast = {
  id: string;
  nodeID: number;
  parentID: number;
  ts: number;
};

const POLL_MS = 3000;
const TOAST_TTL = 5000;

export default function RegisterNotifier({ serverURL }: { serverURL: string }) {
  const knownIDs = useRef<Set<number>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setToasts(prev => prev.filter(t => now - t.ts < TOAST_TTL));
    }, 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`http://${serverURL}/nodes`);
        if (!res.ok) return;
        const data: NodeEntry[] = await res.json();

        const newToasts: Toast[] = [];
        for (const node of data) {
          if (!knownIDs.current.has(node.id)) {
            knownIDs.current.add(node.id);
            if (knownIDs.current.size > data.length) continue;
            newToasts.push({
              id: `${node.id}-${Date.now()}`,
              nodeID: node.id,
              parentID: node.parentID,
              ts: Date.now(),
            });
          }
        }

        if (newToasts.length > 0) {
          setToasts(prev => [...prev, ...newToasts]);
        }
      } catch {}
    };
    fetch(`http://${serverURL}/nodes`)
      .then(r => r.json())
      .then((data: NodeEntry[]) => {
        data.forEach(n => knownIDs.current.add(n.id));
      })
      .catch(() => {});

    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [serverURL]);

  if (toasts.length === 0) return null;

  return (
    <div style={styles.container}>
      {toasts.map(toast => (
        <div key={toast.id} className="shine" style={{...styles.toast, animationDelay: `${toasts.indexOf(toast) * 0.1}s`}}>
      <div style={styles.iconWrap}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#4ade80" strokeWidth="2" />
          <path d="M8 12l3 3 5-5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div style={styles.title}>Новий сенсор</div>
        <div style={styles.body}>
          ID: <b>{toast.nodeID}</b> &nbsp;·&nbsp; Батько: <b>{toast.parentID === 0 ? "Хаб" : `ID ${toast.parentID}`}</b>
        </div>
      </div>
      <div
        style={styles.progress}
        key={toast.id + "-bar"}
      />
    </div>
  ))
}
    </div >
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    bottom: 24,
    right: 24,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    zIndex: 9999,
    pointerEvents: "none",
  },
  toast: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#1C1C1E",
    
    borderRadius: 20,
    padding: "12px 16px",
    minWidth: 240,
    backdropFilter: "blur(12px)",
    
    position: "relative",
    overflow: "hidden",
    animation: "slideIn 0.3s ease",
  } as React.CSSProperties,
  iconWrap: {
    flexShrink: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    color: "#e2e8f0",
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: "#94a3b8",
  },
  progress: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    background: "rgba(74, 222, 128, 0.5)",
    animation: `shrink ${TOAST_TTL}ms linear forwards`,
    width: "100%",
  },
};




