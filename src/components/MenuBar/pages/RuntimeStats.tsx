import React from "react";
import styles from "../MenuBar.module.css";
import {
  RiPulseLine,
  RiTempHotLine,
  RiNodeTree,
  RiWaterFlashLine,
  RiBattery2ChargeLine,
  RiErrorWarningLine,
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
  
  // Check for legacy status codes first
  if (statusNum === 10) {
    problems.push({ text: "Проблема з Барометром", type: "warn" });
  } else if (statusNum === 11) {
    problems.push({ text: "Критична проблема з Барометром", type: "error" });
  } else if (statusNum === 21) {
    problems.push({ text: "Критична проблема з Датчиком Температури", type: "error" });
  } else if (statusNum === 30) {
    problems.push({ text: "Проблема з Вологістю Ґрунту", type: "warn" });
  } else {
    // Otherwise, treat as bitmask flags
    if (statusNum & (1 << 0)) problems.push({ text: "Проблема з Барометром", type: "warn" });
    if (statusNum & (1 << 1)) problems.push({ text: "Критична проблема з Барометром", type: "error" });
    if (statusNum & (1 << 2)) problems.push({ text: "Критична проблема з Датчиком Температури", type: "error" });
    if (statusNum & (1 << 3)) problems.push({ text: "Проблема з Вологістю Ґрунту", type: "warn" });
    if (statusNum & (1 << 4)) problems.push({ text: "Слабкий сигнал GPS (<5 супутників)", type: "warn" });
    if (statusNum & (1 << 5)) problems.push({ text: "Модуль GPS не підключено", type: "error" });
  }
  
  return problems;
}

const RuntimeStats: React.FC = () => {
  const { Nodes } = useNodesStore();

  const sensors = Nodes.filter(n => !n.isHub);
  const totalSensors = sensors.length;
  const onlineSensors = sensors.filter(n => n.status !== 99).length;

  const validTempSensors = sensors.filter(n => n.dsTemperature !== undefined && n.status !== 99);
  const avgTemp = validTempSensors.length
    ? (validTempSensors.reduce((acc, n) => acc + Number(n.dsTemperature), 0) / validTempSensors.length).toFixed(1)
    : "—";

  const validSoilSensors = sensors.filter(n => n.soilHumidity !== undefined && n.status !== 99);
  const avgSoilPercent = validSoilSensors.length
    ? Math.round(validSoilSensors.reduce((acc, n) => acc + Math.min(100, Math.max(0, ((1023 - n.soilHumidity) / 1023) * 100)), 0) / validSoilSensors.length)
    : "—";

  const validBatterySensors = sensors.filter(n => n.Vbat !== undefined && n.status !== 99);
  const avgBattery = validBatterySensors.length
    ? (validBatterySensors.reduce((acc, n) => acc + Number(n.Vbat), 0) / validBatterySensors.length).toFixed(2)
    : "—";

  const issues = sensors.flatMap(n => {
    const problems = getProblems(n.status);
    return problems.map(p => ({
      id: n.ID,
      status: n.status,
      msg: p.text,
      type: p.type === "warn" ? "warning" : "error"
    }));
  });

  return (
    <div className={`${styles.Page} ${styles.StatsPage}`}>
      <div className={styles.StatsDashboard}>
        <div className={styles.StatsSidebarCol}>
          {[
            { id: 'nodes', icon: <RiNodeTree />, label: "Вузли", val: `${onlineSensors} / ${totalSensors}`, color: "#3b82f6", unit: "" },
            { id: 'temp', icon: <RiTempHotLine />, label: "Температура", val: avgTemp, color: "#f59e0b", unit: "°C" },
            { id: 'humidity', icon: <RiWaterFlashLine />, label: "Вологість", val: avgSoilPercent, color: "#10b981", unit: "%" },
            { id: 'battery', icon: <RiBattery2ChargeLine />, label: "Напруга", val: avgBattery, color: "#a855f7", unit: "V" },
          ].map((c, i) => (
            <div key={i} className={styles.StatsLargeCard}>
              <div className={styles.StatsCardHeader}>
                <div className={styles.StatsCardTitle}>{c.label}</div>
                <div className={styles.StatsCardIconBox} style={{ color: c.color, background: `${c.color}15` }}>
                  {c.icon}
                </div>
              </div>
              <div className={styles.StatsCardMainValue}>
                {c.val}<span style={{ fontSize: "1rem", color: "#64748b", fontWeight: 500, marginLeft: "4px" }}>{c.val !== "—" ? c.unit : ""}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.StatsMainCol}>
          <div className={styles.StatsLogPanel} style={{ height: "100%" }}>
            <div className={styles.StatsLogHeader}>
              <div className={styles.StatsLogTitle}>Журнал проблем та сповіщень</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{issues.length} проблем знайдено</div>
            </div>

            <div className={styles.StatsLogContent} style={{ flex: 1, overflowY: "auto" }}>
              {issues.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#10b981", opacity: 0.8, minHeight: "300px" }}>
                  <RiCheckboxCircleLine size={48} style={{ marginBottom: "16px" }} />
                  <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>Система працює стабільно</div>
                  <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "8px" }}>Усі підключені сенсори знаходяться в нормі.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {issues.map((issue, idx) => (
                    <div key={idx} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "16px",
                      borderRadius: "12px",
                      background: issue.type === "error" ? "rgba(239, 68, 68, 0.05)" : "rgba(245, 158, 11, 0.05)",
                      border: `1px solid ${issue.type === "error" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)"}`
                    }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: issue.type === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: issue.type === "error" ? "#ef4444" : "#f59e0b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <RiErrorWarningLine size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ColorText)", marginBottom: "4px" }}>
                          Сенсор #{issue.id}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: issue.type === "error" ? "#ef4444" : "#f59e0b" }}>
                          {issue.msg}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", color: "var(--ColorTextSub)" }}>
                        Код: {issue.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuntimeStats;
