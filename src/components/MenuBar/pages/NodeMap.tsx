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

const getColorForStatus = (status: number) => {
    switch (status) {
        case 0:
            return "#4caf50";
        case 11 | 21 | 30:
            return "#ff6b6b";
        case 10 | 11:
            return "#ffb74d";
        case 99:
            return "#9e9e9e";
        default:
            return "#9e9e9e";
    }
};

const getNeonStyle = (status: number) => {
    const base = getColorForStatus(status);
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


            <div className={styles.PageTitle}>Nodes:</div>
            {/* <div className={styles.PageSubtitle}>Overview of nodes and topology</div> */}

            <div className={styles.PageContent}>
                <div className={styles.NodeList}>
                    {error && <div className={styles.NodeItem}>Error: {error}</div>}
                    {!loading && Nodes.length === 0 && <div className={styles.NodeItem}>No nodes found</div>}
                    {Nodes.map((n) => {
                        const neon = getNeonStyle(n.status);
                        return (
                            <div key={n.ID} className={styles.NodeItem}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontWeight: 700, fontSize: n.isHub ? "20px" : "16px" }}>{n.isHub ? "Hub" : `Sensor ${n.ID}`}</div>
                                    <div
                                        style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 6,
                                            ...neon,
                                        }}
                                    />
                                </div>
                                {n.isHub ? null
                                    :
                                    <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
                                        <div><b>ID:</b> {n.ID}</div>
                                        <div><b>Температура:</b> {n.dsTemperature} °C</div>
                                        <div>
                                            <b>Вологість ґрунту:</b>{" "}
                                            {Math.min(100, Math.max(0, Math.round((n.soilHumidity / 1023) * 100)))}%
                                        </div>
                                    </div>
                                }

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
