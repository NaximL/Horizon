import React, { useEffect, useState, useRef } from "react";
import styles from "../MenuBar.module.css";
import {
  RiTempHotLine,
  RiNodeTree,
  RiPlayFill,
  RiStopFill,
  RiTimeLine,
  RiHistoryLine,
  RiPulseLine,
  RiErrorWarningLine,
  RiFileListLine,
  RiAddLine,
  RiArrowLeftLine,
  RiEyeLine,
  RiDatabaseLine,
  RiWaterFlashLine,
  RiCheckboxCircleLine
} from "react-icons/ri";
import useNodesStore from "../../../store/NodesStore";

interface Problem {
  text: string;
  type: "warn" | "error";
}

function getProblems(status: number | string): Problem[] {
  if (status === 99 || status === "99" || status === "offline") {
    return [{ text: "Офлайн", type: "error" }];
  }
  
  const statusNum = typeof status === "string" ? parseInt(status, 10) : status;
  if (isNaN(statusNum) || statusNum === 0) return [];
  
  const problems: Problem[] = [];
  
  if (statusNum === 10) {
    problems.push({ text: "Проблема з Барометром", type: "warn" });
  } else if (statusNum === 11) {
    problems.push({ text: "Критична проблема з Барометром", type: "error" });
  } else if (statusNum === 21) {
    problems.push({ text: "Критична проблема з Датчиком Температури", type: "error" });
  } else if (statusNum === 30) {
    problems.push({ text: "Проблема з Вологістю Ґрунту", type: "warn" });
  } else {
    if (statusNum & (1 << 0)) problems.push({ text: "Проблема з Барометром", type: "warn" });
    if (statusNum & (1 << 1)) problems.push({ text: "Критична проблема з Барометром", type: "error" });
    if (statusNum & (1 << 2)) problems.push({ text: "Критична проблема з Датчиком Температури", type: "error" });
    if (statusNum & (1 << 3)) problems.push({ text: "Проблема з Вологістю Ґрунту", type: "warn" });
    if (statusNum & (1 << 4)) problems.push({ text: "Слабкий сигнал GPS (<5 супутників)", type: "warn" });
    if (statusNum & (1 << 5)) problems.push({ text: "Модуль GPS не підключено", type: "error" });
  }
  
  return problems;
}

type StatPoint = { time: string; active: number; temp: number; humidity: number; signals: number; nodes?: any[] };
type SessionData = { id: string, title: string, startTime: string, endTime: string, status: string, dataPoints: any[] };

const getCurvedPath = (pts: { x: number, y: number }[]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2.5;
    const cp2x = p1.x - (p1.x - p0.x) / 2.5;
    d += ` C ${cp1x} ${p0.y}, ${cp2x} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
};

const Stats: React.FC<any> = ({ Connection, onSubViewChange, addTrigger }) => {
  const { Nodes } = useNodesStore();
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isModalExiting, setIsModalExiting] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<StatPoint | null>(null);
  const [view, setView] = useState<'list' | 'record' | 'history'>('list');
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [data, setData] = useState<StatPoint[]>([]);
  const [collecting, setCollecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'temp' | 'humidity'>('temp');
  const [isLeaving, setIsLeaving] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastProcessedTrigger = useRef(addTrigger);

  useEffect(() => {
    if (addTrigger > lastProcessedTrigger.current && view === 'list') {
      setData([]);
      setCollecting(false);
      navigateTo('record');
    }
    lastProcessedTrigger.current = addTrigger;
  }, [addTrigger, view]);

  const navigateTo = (targetView: 'list' | 'record' | 'history', targetSessionId: string | null = null) => {
    setDirection(targetView === 'list' ? 'backward' : 'forward');
    setIsLeaving(true);
    if (onSubViewChange) onSubViewChange(targetView === 'list' ? 'list' : 'detail');
    setTimeout(() => {
      setView(targetView);
      setCurrentSessionId(targetSessionId);
      setIsLeaving(false);
    }, 300);
  };

  const closeModal = () => {
    setIsModalExiting(true);
    setTimeout(() => {
      setShowErrorModal(false);
      setIsModalExiting(false);
      setSelectedPoint(null);
    }, 280);
  };

  const hubUrl = () => {
    const ip = localStorage.getItem("ip") || "192.168.31.12";
    return `http://${ip}`;
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3001/api/sessions`);
      if (res.ok) {
        const json = await res.json();
        setSessions(json);

        const active = json.find((s: any) => s.status === 'recording');
        if (active && view === 'list') {
          setCollecting(true);
        } else if (!active) {
          setCollecting(false);
        }
      }
    } catch (e) {
      console.error("Failed to fetch sessions from Node backend", e);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if ((view !== 'record' && view !== 'history') || !currentSessionId) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:3001/api/sessions/${currentSessionId}`);
      if (!res.ok) return;
      const json = await res.json();

      setCollecting(json.status === 'recording');

      const points = (json.dataPoints || []).map((d: any) => {
        const wallTime = new Date(d.timestamp);
        return {
          time: wallTime.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
          active: d.active,
          temp: d.temp,
          humidity: d.humidity || 0,
          signals: d.signals,
          nodes: d.nodes || [],
        };
      });
      setData(points);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchSessions();
    const listInterval = setInterval(fetchSessions, 10000);
    return () => clearInterval(listInterval);
  }, []);

  useEffect(() => {
    if (view !== 'list') {
      fetchStats();
      if (view === 'record' || (view === 'history' && collecting)) {
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [view, currentSessionId, collecting]);

  const handleToggle = async () => {
    setLoadingAction(true);
    try {
      if (!collecting) {
        const interval = parseInt(localStorage.getItem("saveInterval") || "1", 10) * 60;
        const sessionId = Date.now().toString();
        setCurrentSessionId(sessionId);
        let backendIP = window.location.hostname;

        if (backendIP === "localhost" || backendIP === "127.0.0.1") {
          try {
            const ipRes = await fetch(`http://localhost:3001/api/my-ip`);
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              backendIP = ipData.ip;
            }
          } catch (e) {
            console.error("Failed to auto-detect LAN IP:", e);
          }
        }

        const res = await fetch(`${hubUrl()}/stats/start?interval=${interval}&backendIP=${backendIP}&sessionId=${sessionId}`);
        if ((await res.json()).ok) setCollecting(true);
      } else {
        const res = await fetch(`${hubUrl()}/stats/stop`);
        if ((await res.json()).ok) {
          setCollecting(false);
          fetchSessions();
          navigateTo('list');
        }
      }
    } catch (e) { console.error(e); }
    setLoadingAction(false);
  };

  const handleViewSession = (session: SessionData) => {
    if (session.status === 'recording') {
      navigateTo('record', session.id);
    } else {
      navigateTo('history', session.id);
    }
  };

  if (view === 'list') {
    return (
      <div
        key="list-view"
        className={`${styles.Page} ${styles.StatsPage}`}
        style={{
          animation: isLeaving
            ? (direction === 'forward' ? `${styles.statsExit} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards` : `${styles.statsExitReverse} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`)
            : (direction === 'backward' ? `${styles.statsEnterReverse} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards` : `${styles.statsEnter} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`)
        }}
      >
        <div className={`${styles.StatsContent} ${styles.StatsSessionList}`}>
          {loading ? (
            <div className={styles.StatsEmptyState}>
              <div className={styles.StatsEmptyTitleCollecting}>Завантаження історії...</div>
            </div>
          ) : sessions.length === 0 ? (
            <div className={styles.StatsEmptyState}>
              <RiFileListLine className={styles.StatsEmptyIcon} />
              <div className={styles.StatsEmptyTitle}>Немає збережених сесій</div>
              <div className={styles.StatsEmptyDesc}>Створіть свій перший запис для початку моніторингу даних</div>
            </div>
          ) : (
            [...sessions].reverse().map((s, idx) => (
              <div
                key={s.id || idx}
                className={styles.StatsSessionCard}
                onClick={() => handleViewSession(s)}
                style={{ animation: `statsSessionEnter 0.4s cubic-bezier(0.2, 0, 0, 1) ${idx * 0.05}s backwards` }}
              >
                <div className={styles.StatsSessionInfo}>
                  <div className={styles.StatsSessionTitle}>{s.title}</div>
                  <div className={styles.StatsSessionMeta}>
                    <RiTimeLine size={14} />
                    {new Date(s.startTime).toLocaleString("uk-UA", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    <span style={{ opacity: 0.3 }}>•</span>
                    <RiDatabaseLine size={14} />
                    {s.dataPoints?.length || 0} точок
                  </div>
                </div>
                <div className={`${styles.StatsSessionBadge} ${s.status === 'recording' ? styles.BadgeRecording : styles.BadgeCompleted}`}>
                  {s.status === 'recording' ? (
                    <><RiPulseLine className={styles.StatsEmptyIconCollecting} style={{ fontSize: "1rem", margin: 0 }} /> Запис</>
                  ) : (
                    <>Готово</>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  const latest = data[data.length - 1] || { time: "--:--", active: 0, temp: 0, humidity: 0, signals: 0 };
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const valKey = activeTab === 'temp' ? 'temp' : 'humidity';
  const valUnit = activeTab === 'temp' ? '°C' : '%';
  const valColor = activeTab === 'temp' ? '#f59e0b' : '#3b82f6';

  const maxVal = Math.max(...data.map(d => d[valKey]), activeTab === 'temp' ? 30 : 100);
  const minVal = Math.min(...data.map(d => d[valKey]), activeTab === 'temp' ? 10 : 0);
  const range = (maxVal - minVal) || (activeTab === 'temp' ? 5 : 10);
  const pad = 20, W = 500, H = 200;

  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: H - pad - ((d[valKey] - minVal) / range) * (H - 2 * pad),
  }));
  const dLine = getCurvedPath(pts);
  const dArea = pts.length > 0 ? `${dLine} L ${W} ${H} L 0 ${H} Z` : "";

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current || data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round((x / W) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  };


  const W_DASH = 1000, H_DASH = 300;
  const ptsDash = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W_DASH,
    y: H_DASH - pad - ((d[valKey] - minVal) / range) * (H_DASH - 2 * pad),
  }));
  const dLineDash = getCurvedPath(ptsDash);
  const dAreaDash = ptsDash.length > 0 ? `${dLineDash} L ${W_DASH} ${H_DASH} L 0 ${H_DASH} Z` : "";

  return (
    <div
      key={`detail-${view}-${currentSessionId}`}
      className={`${styles.Page} ${styles.StatsPage}`}
      style={{
        animation: isLeaving
          ? (direction === 'backward' ? `${styles.statsExitReverse} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards` : `${styles.statsExit} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`)
          : (direction === 'forward' ? `${styles.statsEnter} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards` : `${styles.statsEnterReverse} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`)
      }}
    >
      <div className={`${styles.StatsHeader} ${view === 'history' ? styles.StatsArchiveHeader : ""}`}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            className={styles.StatsBackBtn}
            onClick={() => { setData([]); navigateTo('list'); }}
            title="До списку"
          >
            <RiArrowLeftLine size={22} />
          </button>

          <div className={styles.StatsTitleWrapper} style={{ marginLeft: 0 }}>
            <div className={styles.StatsTitle} style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              {view === 'history' ? (
                <><span className={styles.StatsArchiveBadge}>Архів</span> {currentSession?.title}</>
              ) : (
                collecting ? "Панель моніторингу" : "Готовність до сесії"
              )}
            </div>
            <div className={styles.StatsSubtitle}>
              {view === 'history' ? "Перегляд збережених даних" : "Контроль параметрів системи"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {view === 'record' && (
            <button
              onClick={handleToggle}
              disabled={loadingAction}
              className={`${styles.StatsRecordBtn} ${collecting ? styles.StatsRecordBtnStop : styles.StatsRecordBtnStart}`}
              style={{ borderRadius: "12px", padding: "10px 20px", fontWeight: 700 }}
            >
              {loadingAction ? "⏳" : collecting ? <><RiStopFill size={18} /> Зупинити</> : <><RiPlayFill size={18} /> Почати запис</>}
            </button>
          )}
        </div>
      </div>

      <div className={styles.StatsDashboard} style={{padding:"0 20px 20px 20px"}}>
        <div className={styles.StatsSidebarCol}>
        
          {[
            { id: 'temp', icon: <RiTempHotLine />, label: "Температура", val: latest.temp, color: "#f59e0b", unit: "°C" },
            { id: 'humidity', icon: <RiWaterFlashLine />, label: "Вологість", val: latest.humidity, color: "#3b82f6", unit: "%" },
            { id: 'nodes', icon: <RiNodeTree />, label: "Активні вузли", val: latest.active, color: "#a855f7", unit: "" },
            { id: 'errors', icon: <RiErrorWarningLine />, label: "Помилки / Сигнали", val: latest.signals, color: "#ef4444", unit: "" },
          ].map((c, i) => (
            <div
              key={i}
              className={`${styles.StatsLargeCard} ${activeTab === c.id ? styles.StatsLargeCardActive : ""}`}
              onClick={() => { 
                if (c.id === 'temp' || c.id === 'humidity') setActiveTab(c.id as any);
                if (c.id === 'errors') {
                  setSelectedPoint(latest.time !== "--:--" ? latest : null);
                  setShowErrorModal(true);
                  setIsModalExiting(false);
                }
              }}
              style={{ cursor: (c.id === 'temp' || c.id === 'humidity' || c.id === 'errors') ? 'pointer' : 'default' }}
            >
              <div className={styles.StatsCardHeader}>
                <div className={styles.StatsCardTitle}>{c.label}</div>
                <div className={styles.StatsCardIconBox} style={{ color: c.color, background: `${c.color}15` }}>
                  {c.icon}
                </div>
              </div>
              <div className={styles.StatsCardMainValue}>
                {c.val}<span style={{ fontSize: "1rem", color: "#64748b", fontWeight: 500, marginLeft: "4px" }}>{c.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.StatsMainCol}>
          <div className={styles.StatsChartPanel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div className={styles.SegmentRow} style={{ width: "240px" }}>
                <div className={styles.SegBubble} style={{ width: `calc(50% - 4px)`, transform: `translateX(${activeTab === 'temp' ? '0%' : '100%'})` }} />
                <button className={`${styles.SegBtn} ${activeTab === 'temp' ? styles.SegBtnActive : ""}`} onClick={() => setActiveTab('temp')}>Температура</button>
                <button className={`${styles.SegBtn} ${activeTab === 'humidity' ? styles.SegBtnActive : ""}`} onClick={() => setActiveTab('humidity')}>Вологість</button>
              </div>
              
              {hoverIdx !== null && data[hoverIdx] && (
                <div style={{ display: "flex", gap: "16px", fontSize: "0.9rem", fontWeight: 700, color: valColor, background: `${valColor}15`, padding: "8px 16px", borderRadius: "12px", border: `1px solid ${valColor}33` }}>
                  <span>{data[hoverIdx].time}</span>
                  <span>{data[hoverIdx][valKey]}{valUnit}</span>
                </div>
              )}
            </div>

            <div style={{ flex: 1, position: "relative" }} onMouseLeave={() => setHoverIdx(null)}>
              {data.length > 1 ? (
                <svg ref={svgRef} viewBox={`0 0 ${W_DASH} ${H_DASH}`} style={{ width: "100%", height: "100%", overflow: "visible" }} onMouseMove={(e) => {
                  if (!svgRef.current) return;
                  const rect = svgRef.current.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * W_DASH;
                  const idx = Math.round((x / W_DASH) * (data.length - 1));
                  setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
                }}>
                  <defs>
                    <linearGradient id="mainG" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={valColor} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={valColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0, 0.25, 0.5, 0.75, 1].map(f => (
                    <g key={f}>
                      <line x1={0} x2={W_DASH} y1={pad + f * (H_DASH - 2 * pad)} y2={pad + f * (H_DASH - 2 * pad)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                      <text x={-10} y={pad + f * (H_DASH - 2 * pad) + 4} fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="end">{Math.round(maxVal - f * range)}</text>
                    </g>
                  ))}
                  <path d={dAreaDash} fill="url(#mainG)" style={{ transition: "all 0.5s ease" }} />
                  <path d={dLineDash} fill="none" stroke={valColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "all 0.5s ease" }} />
                  
                  {hoverIdx !== null && ptsDash[hoverIdx] && (
                    <g>
                      <line x1={ptsDash[hoverIdx].x} x2={ptsDash[hoverIdx].x} y1={0} y2={H_DASH} stroke="rgba(255,255,255,0.25)" strokeDasharray="5 5" />
                      <circle cx={ptsDash[hoverIdx].x} cy={ptsDash[hoverIdx].y} r="7" fill={valColor} stroke="#fff" strokeWidth="2.5" />
                    </g>
                  )}
                </svg>
              ) : (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                  <RiPulseLine size={64} style={{ opacity: 0.1, marginBottom: "20px" }} />
                  <div>Очікування даних для візуалізації...</div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.StatsLogPanel}>
            <div className={styles.StatsLogHeader}>
              <div className={styles.StatsLogTitle}>Журнал вимірювань</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{data.length} записів</div>
            </div>
            <div className={styles.StatsLogContent}>
              <div className={styles.StatsLogRow} style={{ fontWeight: 800, color: "var(--ColorTextSub)", background: "rgba(255,255,255,0.02)", marginBottom: "4px" }}>
                <span>Час</span>
                <span>Статус системи</span>
                <span>Температура</span>
                <span>Вологість</span>
                <span>Помилок</span>
              </div>
              {[...data].reverse().slice(0, 50).map((d, i) => (
                <div 
                  key={i} 
                  className={styles.StatsLogRow}
                  style={{ cursor: "pointer", transition: "background 0.2s ease" }}
                  onClick={() => {
                    setSelectedPoint(d);
                    setShowErrorModal(true);
                    setIsModalExiting(false);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span className={styles.StatsLogTime}>{d.time}</span>
                  <span className={styles.StatsLogId}>Вузлів: {d.active}</span>
                  <span className={styles.StatsLogVal} style={{ color: "#f59e0b" }}>{d.temp}°C</span>
                  <span className={styles.StatsLogVal} style={{ color: "#3b82f6" }}>{d.humidity}%</span>
                  <span className={styles.StatsLogVal} style={{ color: "#ef4444" }}>{d.signals}</span>
                </div>
              ))}
              {data.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>Лог порожній</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showErrorModal && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            animation: isModalExiting 
              ? "statsBackdropFadeOut 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) forwards" 
              : "statsBackdropFadeIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) forwards"
          }}
          onClick={closeModal}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes statsModalEnter {
              0% { opacity: 0; transform: scale(0.9) translateY(20px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes statsModalExit {
              0% { opacity: 1; transform: scale(1) translateY(0); }
              100% { opacity: 0; transform: scale(0.95) translateY(15px); }
            }
            @keyframes statsBackdropFadeIn {
              from { opacity: 0; backdrop-filter: blur(0px); }
              to { opacity: 1; backdrop-filter: blur(12px); }
            }
            @keyframes statsBackdropFadeOut {
              from { opacity: 1; backdrop-filter: blur(12px); }
              to { opacity: 0; backdrop-filter: blur(0px); }
            }
            @keyframes statsBarGrow {
              from { width: 0%; }
            }
            @keyframes statsCardSlideIn {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}} />

          <div 
            style={{
              background: "linear-gradient(135deg, rgba(20, 25, 30, 0.95), rgba(10, 15, 20, 0.98))",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "24px",
              padding: "26px",
              width: "90%",
              maxWidth: "520px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              color: "#fff",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              animation: isModalExiting
                ? "statsModalExit 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) forwards"
                : "statsModalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: selectedPoint && selectedPoint.signals > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)",
                  color: selectedPoint && selectedPoint.signals > 0 ? "#ef4444" : "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1)"
                }}>
                  <RiErrorWarningLine size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                    {selectedPoint ? `Точка збереження: ${selectedPoint.time}` : "Активні проблеми датчиків"}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                    {selectedPoint ? "Контрольний зріз показників системы" : "Моніторинг несправностей у реальному часі"}
                  </p>
                </div>
              </div>
              
            </div>

            {/* Metrics Dashboard for Selected Point */}
            {selectedPoint && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
                animation: "statsCardSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both"
              }}>
                {/* Temp Card */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)" }}>Температура</span>
                    <RiTempHotLine size={18} style={{ color: "#f59e0b" }} />
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "8px", color: "#f59e0b" }}>
                    {selectedPoint.temp}°C
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", height: "4px", borderRadius: "2px", overflow: "hidden", marginTop: "10px" }}>
                    <div style={{
                      background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                      width: `${Math.max(0, Math.min(100, (selectedPoint.temp / 50) * 100))}%`,
                      height: "100%",
                      borderRadius: "2px",
                      animation: "statsBarGrow 1s cubic-bezier(0.25, 1, 0.5, 1) forwards"
                    }} />
                  </div>
                </div>

                {/* Humidity Card */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)" }}>Вологість</span>
                    <RiWaterFlashLine size={18} style={{ color: "#3b82f6" }} />
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "8px", color: "#3b82f6" }}>
                    {selectedPoint.humidity}%
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", height: "4px", borderRadius: "2px", overflow: "hidden", marginTop: "10px" }}>
                    <div style={{
                      background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
                      width: `${Math.max(0, Math.min(100, selectedPoint.humidity))}%`,
                      height: "100%",
                      borderRadius: "2px",
                      animation: "statsBarGrow 1s cubic-bezier(0.25, 1, 0.5, 1) forwards"
                    }} />
                  </div>
                </div>

                {/* Active Nodes Card */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)" }}>Активні вузли</span>
                    <RiNodeTree size={18} style={{ color: "#a855f7" }} />
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "8px", color: "#a855f7" }}>
                    {selectedPoint.active}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.3)", marginTop: "10px" }}>
                    датчиків в мережі
                  </span>
                </div>

                {/* Errors Count Card */}
                <div style={{
                  background: selectedPoint.signals > 0 ? "rgba(239, 68, 68, 0.03)" : "linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))",
                  border: selectedPoint.signals > 0 ? "1px solid rgba(239, 68, 68, 0.18)" : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: selectedPoint.signals > 0 ? "0 0 15px rgba(239,68,68,0.05)" : "none"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)" }}>Помилки</span>
                    <RiErrorWarningLine size={18} style={{ color: selectedPoint.signals > 0 ? "#ef4444" : "#10b981" }} />
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "8px", color: selectedPoint.signals > 0 ? "#ef4444" : "#10b981" }}>
                    {selectedPoint.signals}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: selectedPoint.signals > 0 ? "#ef4444" : "rgba(255, 255, 255, 0.3)", marginTop: "10px", fontWeight: selectedPoint.signals > 0 ? 600 : 400 }}>
                    {selectedPoint.signals > 0 ? "Потребує уваги!" : "Стан стабільний"}
                  </span>
                </div>
              </div>
            )}

            {/* Title for Hardware Errors section if any */}
            {selectedPoint && selectedPoint.signals > 0 && (
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "10px", marginTop: "10px" }}>
                ДЕТАЛЬНИЙ ЗВІТ ПРО ПОМИЛКИ
              </div>
            )}

            {/* Error List Container */}
            <div style={{ 
              maxHeight: "220px", 
              overflowY: "auto", 
              display: "flex", 
              flexDirection: "column", 
              gap: "10px",
              paddingTop: "2px"
            }}>
              {(() => {
                const nodesSource = (selectedPoint && selectedPoint.nodes && selectedPoint.nodes.length > 0)
                  ? selectedPoint.nodes.map((n: any) => ({ ID: n.id, status: n.status, isHub: false }))
                  : Nodes.filter(n => !n.isHub);

                const problemItems = nodesSource.flatMap(n => {
                  const problems = getProblems(n.status);
                  return problems.map(p => ({
                    id: n.ID,
                    status: n.status,
                    msg: p.text,
                    type: p.type
                  }));
                });

                if (problemItems.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "26px 10px", color: "#10b981", background: "rgba(16, 185, 129, 0.02)", border: "1px dashed rgba(16, 185, 129, 0.15)", borderRadius: "16px" }}>
                      <RiCheckboxCircleLine size={40} style={{ marginBottom: "10px", opacity: 0.8 }} />
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Всі датчики працювали стабільно!</div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "4px" }}>На той момент жодних проблем чи збоїв у роботі не виявлено.</div>
                    </div>
                  );
                }

                return problemItems.map((err, idx) => (
                  <div key={idx} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "14px",
                    background: err.type === "error" ? "rgba(239, 68, 68, 0.06)" : "rgba(245, 158, 11, 0.06)",
                    border: `1px solid ${err.type === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)"}`,
                    animation: `statsCardSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s both`
                  }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: err.type === "error" ? "rgba(239, 68, 68, 0.12)" : "rgba(245, 158, 11, 0.12)",
                      color: err.type === "error" ? "#ef4444" : "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <RiErrorWarningLine size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>Сенсор #{err.id}</div>
                      <div style={{ fontSize: "0.75rem", color: err.type === "error" ? "#ef4444" : "#f59e0b", marginTop: "2px" }}>{err.msg}</div>
                    </div>
                    <div style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", color: "var(--ColorTextSub)" }}>Код: {err.status}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;