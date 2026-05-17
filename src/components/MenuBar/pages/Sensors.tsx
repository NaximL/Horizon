import React, { useEffect, useState } from "react";
import styles from "../MenuBar.module.css";
import useNodesStore from "../../../store/NodesStore";
import { RiGpsLine } from "react-icons/ri";

type NodePoint = {
    isHub: boolean;
    ID: string;
    bmpTemperature?: string;
    bmpPressure?: string;
    soilHumidity: number;
    dsTemperature?: string;
    Vbat: number;
    x?: number;
    y?: number;
    z?: number;
    realLat?: number;
    realLng?: number;
    gpsSats?: number;
    status: number | string;
};

const statusColorsHub: Record<string, string> = {
    0: "rgb(0, 130, 0)",
    warn: "yellow",
    error: "red",
    offline: "gray",
};

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

function getNodeColor(status: number | string, isHub: boolean): string {
    if (isHub) {
        return statusColorsHub[status] || "rgb(0, 130, 0)";
    }
    if (status === 99 || status === "99" || status === "offline") return "gray";
    
    const problems = getProblems(status);
    if (problems.some(p => p.type === "error")) {
        return "red";
    }
    if (problems.some(p => p.type === "warn")) {
        return "#ffb74d";
    }
    return "rgb(0, 206, 0)";
}

function getStatusLabel(status: number | string, isHub: boolean): string {
    if (isHub) {
        if (status === "offline" || status === 99 || status === "99") return "Офлайн";
        if (status === "error") return "Помилка";
        if (status === "warn") return "Попередження";
        return "Онлайн";
    }
    if (status === 99 || status === "99" || status === "offline") return "Офлайн";
    const problems = getProblems(status);
    if (problems.some(p => p.type === "error")) return "Помилка";
    if (problems.some(p => p.type === "warn")) return "Попередження";
    return "Онлайн";
}

const getBatteryColor = (percent: number) => {
    if (percent > 60) return "#4caf50";
    if (percent > 25) return "#ffb74d";
    return "#ff6b6b";
};

const getSatsColor = (sats: number) => {
    if (sats >= 6) return "#4caf50";
    if (sats >= 3) return "#ffb74d";
    return "#ff6b6b";
};

const NodeMap: React.FC = ({ Menu, Connection }: any) => {
    const [error, setError] = useState<string | null>(null);
    const { Nodes, SetNodes } = useNodesStore();

    const load = async () => {
        setError(null);
        SetNodes(Nodes);
    };

    useEffect(() => {
        load();
    }, [Menu, Connection]);

    return (
        <div className={`${styles.Page} ${!Connection && styles.Center}`} style={{ padding: 8 }}>
            {error && <div className={styles.NodeItem}>Помилка: {error}</div>}

            {!Connection ? (
                <div className={styles.SensorsConnectingBox}>
                    <div className={styles.SensorsConnectingSpinner}>⏳</div>
                    <span className={styles.SensorsConnectingText}>Встановлення з'єднання з хабом...</span>
                </div>
            ) : (
                <div className={styles.NodeGrid} style={{ opacity: Connection ? 1 : 0.5, pointerEvents: Connection ? "all" : "none" }}>
                    {Nodes.slice()
                        .sort((a, b) => Number(a.ID) - Number(b.ID))
                        .map((n: NodePoint) => {
                            const statusColor = getNodeColor(n.status, n.isHub);
                            const batteryPercent = Math.min(100, Math.max(0, Math.round(((n.Vbat - 3.0) / (4.2 - 3.0)) * 100)));
                            const soilPercent = Math.min(100, Math.max(0, Math.round(((1023 - n.soilHumidity) / 1023) * 100)));
                            const batteryColor = getBatteryColor(batteryPercent);
                            const sats = n.gpsSats ?? 0;
                            const satsColor = getSatsColor(sats);
                            const hasGps = n.realLat !== undefined && n.realLat !== 0;

                            return (
                                <div key={n.ID} className={styles.SensorCard}>
                                    <div className={styles.SensorHeader}>
                                        <div className={styles.SensorIconWrapper}>
                                            <div
                                                className={styles.SensorIconBox}
                                                style={{
                                                    background: `linear-gradient(135deg, ${statusColor}22, ${statusColor}11)`,
                                                    border: `1px solid ${statusColor}33`,
                                                    fontSize: n.isHub ? "1.1rem" : "0.95rem",
                                                }}
                                            >
                                                {n.isHub ? "📡" : "🔗"}
                                            </div>
                                            <div>
                                                <div className={styles.SensorTitle}>
                                                    {n.isHub ? "Хаб" : `Сенсор #${n.ID}`}
                                                </div>
                                                <div style={{
                                                    fontSize: "0.68rem",
                                                    color: statusColor,
                                                    fontWeight: 600,
                                                    letterSpacing: "0.4px",
                                                    marginTop: 1,
                                                }}>
                                                    {getStatusLabel(n.status, n.isHub)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {!n.isHub && (
                                        <>
                                            <div className={styles.SensorDataItem}>
                                                <div className={styles.SensorDataLabel}>Статус</div>
                                                {(() => {
                                                    const problems = getProblems(n.status);
                                                    return problems.length === 0 ? (
                                                        <div className={styles.StatusNormal}>
                                                            <span className={styles.StatusDotNormal} />
                                                            <span className={styles.SensorDataValue} style={{ color: statusColor, marginTop: 0 }}>Нормальний</span>
                                                        </div>
                                                    ) : (
                                                        <div className={styles.ProblemsList}>
                                                            {problems.map((prob, idx) => (
                                                                <div key={idx} className={styles.ProblemItem}>
                                                                    <span className={`${styles.ProblemDot} ${prob.type === "error" ? styles.Error : styles.Warning}`} />
                                                                    <span className={styles.ProblemText}>{prob.text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            <div className={styles.SensorDataGrid}>
                                                <div className={styles.SensorDataItem}>
                                                    <div className={styles.SensorDataLabel}>🌡 Темп.</div>
                                                    <div className={styles.SensorDataValue}>{n.dsTemperature ?? "—"}°C</div>
                                                </div>
                                                <div className={styles.SensorDataItem}>
                                                    <div className={styles.SensorDataLabel}>💧 Ґрунт</div>
                                                    <div className={styles.SensorDataValue}>{soilPercent}%</div>
                                                </div>

                                                {/* Батарея */}
                                                <div className={styles.SensorDataItem} style={{ gridColumn: "span 2" }}>
                                                    <div className={styles.SensorBatteryRow}>
                                                        <div className={styles.SensorDataLabel}>🔋 Батарея</div>
                                                        <div className={styles.SensorBatteryValue} style={{ color: batteryColor }}>
                                                            {batteryPercent}% | {n.Vbat}V
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        width: "100%", height: 5, borderRadius: 3,
                                                        background: "var(--BatteryTrackBg)",
                                                        overflow: "hidden",
                                                        marginTop: 6,
                                                    }}>
                                                        <div style={{
                                                            width: `${batteryPercent}%`,
                                                            height: "100%",
                                                            borderRadius: 3,
                                                            background: `linear-gradient(90deg, ${batteryColor}cc, ${batteryColor})`,
                                                            boxShadow: `0 0 6px ${batteryColor}66`,
                                                            transition: "width 0.5s ease",
                                                        }} />
                                                    </div>
                                                </div>

                                                {/* GPS */}
                                                <div className={styles.SensorDataItem} style={{ gridColumn: "span 2" }}>
                                                    <div className={styles.SensorBatteryRow}>
                                                        <div className={styles.SensorDataLabel}>📍 GPS</div>
                                                        {(() => {
                                                            const statusNum = typeof n.status === "string" ? parseInt(n.status, 10) : n.status;
                                                            const isGpsDisconnected = !n.isHub && !!(statusNum & (1 << 5));
                                                            return (
                                                                <div className={styles.SensorBatteryValue} style={{ color: isGpsDisconnected ? "#ff6b6b" : satsColor }}>
                                                                    {isGpsDisconnected ? "НЕ ПІДКЛЮЧЕНО" : (
                                                                        <>
                                                                            <RiGpsLine /> {sats} СУПУТНИКІВ
                                                                        </>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                    {/* Координати */}
                                                    {(() => {
                                                        const statusNum = typeof n.status === "string" ? parseInt(n.status, 10) : n.status;
                                                        const isGpsDisconnected = !n.isHub && !!(statusNum & (1 << 5));
                                                        if (isGpsDisconnected) return null;
                                                        return (
                                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                                                <div>
                                                                    <div style={{ fontSize: "0.55rem", color: "var(--ColorTextMuted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>LAT</div>
                                                                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ColorText)", fontFamily: "monospace" }}>
                                                                        {hasGps ? n.realLat!.toFixed(6) : "—"}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: "0.55rem", color: "var(--ColorTextMuted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>LNG</div>
                                                                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ColorText)", fontFamily: "monospace" }}>
                                                                        {hasGps ? n.realLng!.toFixed(6) : "—"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {n.isHub && (
                                        <div style={{
                                            background: "var(--CardBgSolid)",
                                            borderRadius: 10,
                                            padding: "10px 12px",
                                            fontSize: "0.78rem",
                                            color: "var(--ColorTextSub)",
                                            fontWeight: 500,
                                            textAlign: "center",
                                        }}>
                                            Центральний пристрій мережі
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
};

export default NodeMap;