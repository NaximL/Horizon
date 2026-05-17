import React, { useEffect, useState } from "react";
import styles from "../MenuBar.module.css";
import useNodesStore from "../../../store/NodesStore";

const hexToRgba = (hex: string, alpha = 1) => {
    const sanitized = hex.replace("#", "");
    const bigint = parseInt(sanitized.length === 3 ? sanitized.split("").map(c => c + c).join("") : sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

const getColorForStatus = (status: number | string, isHub: boolean) => {
    if (isHub) {
        if (status === "offline" || status === 99 || status === "99") return "#9e9e9e";
        if (status === "error") return "#ff6b6b";
        if (status === "warn") return "#ffb74d";
        return "#4caf50";
    }
    if (status === 99 || status === "99" || status === "offline") return "#9e9e9e";
    
    const problems = getProblems(status);
    if (problems.some(p => p.type === "error")) {
        return "#ff6b6b";
    }
    if (problems.some(p => p.type === "warn")) {
        return "#ffb74d";
    }
    return "#4caf50";
};

const getNeonStyle = (status: number | string, isHub: boolean) => {
    const base = getColorForStatus(status, isHub);
    const glowA = hexToRgba(base, 0.85);
    const glowB = hexToRgba(base, 0.45);
    const boxShadow = [
        `0 0 6px ${glowA}`,
        `0 0 12px ${glowA}`,
        `0 0 20px ${glowB}`,
        `0 0 40px ${glowB}`,
        `0 0 80px ${hexToRgba(base, 0.18)}`,
    ].join(", ");
    return { backgroundColor: base, boxShadow };
};

const NodeMap: React.FC<{ SetBinding: (bind: boolean) => void, Bind: boolean }> = ({ SetBinding, Bind }) => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { Nodes, SetNodes } = useNodesStore();

    const load = async () => {
        setLoading(true);
        setError(null);
        SetNodes(Nodes);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, [Nodes]);

    return (
        <div className={styles.Page}>

            <div className={styles.MapPageHeader} style={{ background: "transparent", padding: 0, borderBottom: "none", paddingBottom: 16 }}>
                <div>
                    <div className={styles.MapPageTitle}>Вузли</div>
                </div>
            </div>

            <div className={styles.PageContent}>
                <div className={styles.MapNodeList}>
                    {error && <div className={styles.MapNodeItem}>Error: {error}</div>}
                    {!loading && Nodes.length === 0 && <div className={styles.MapNodeItem}>No nodes found</div>}
                    {Nodes.map((n) => {
                        const neon = getNeonStyle(n.status, n.isHub);
                        const statusNumVal = typeof n.status === "string" ? parseInt(n.status, 10) : n.status;
                        const isGpsDisconnected = !n.isHub && !!(statusNumVal & (1 << 5));
                        
                        return (
                            <div key={n.ID} className={styles.MapNodeItem}>
                                <div className={styles.MapNodeIcon}>
                                    {n.isHub ? "📡" : "🔗"}
                                </div>
                                <div className={styles.MapNodeInfo}>
                                    <div className={styles.MapNodeHeader}>
                                        <div className={styles.MapNodeName}>
                                            {n.isHub ? "Hub" : `Sensor ${n.ID}`}
                                        </div>
                                        <div style={{
                                            width: 12, height: 12, borderRadius: 6, ...neon
                                        }} />
                                    </div>
                                    {!n.isHub && (
                                        <div className={styles.MapNodeCoords}>
                                            ID: {n.ID} • Темп: {n.dsTemperature ?? "—"}°C • Волог: {Math.min(100, Math.max(0, Math.round(((1023 - n.soilHumidity) / 1023) * 100)))}% • GPS: {isGpsDisconnected ? "Не підкл." : `${n.gpsSats} суп.`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={styles.ActionRow}>
                <button className={styles.Btn} onClick={load} disabled={loading}>
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
                <button
                    className={styles.Btn}
                    onClick={() => {
                        SetBinding(!Bind);
                    }}
                >
                    {Bind? "Cancel Binding" : "Bind New Sensors"}
                </button>
            </div>
        </div>
    );
};

export default NodeMap;
