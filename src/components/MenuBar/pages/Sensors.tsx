import React, { useEffect, useState } from "react";
import styles from "../MenuBar.module.css";
import useNodesStore from "../../../store/NodesStore";
import LoadSpin from "../../LoadSpin/LoadSpin";

type NodePoint = {
    isHub: boolean;
    ID: string;
    bmpTemperature?: string;
    bmpPressure?: string;
    soilHumidity: number;
    dsTemperature?: string;
    x?: number;
    y?: number;
    z?: number;
    status: number;
};

const hexToRgba = (hex: string, alpha = 1) => {
    const sanitized = hex.replace("#", "");
    const full = sanitized.length === 3 ? sanitized.split("").map(c => c + c).join("") : sanitized;
    const bigint = parseInt(full, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getColorForStatus = (status: number) => {
    switch (status) {
        case 0:
            return "#4caf50"; // OK
        case 10:
            return "#ffb74d"; // warning
        case 11:
        case 21:
        case 30:
            return "#ff6b6b"; // error
        case 99:
            return "#9e9e9e"; // unknown/offline
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
    return { backgroundColor: base, boxShadow } as React.CSSProperties;
};

const NodeMap: React.FC = ({ Menu }: any) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { Nodes, SetNodes } = useNodesStore();

    const load = async () => {
        setLoading(true);
        setError(null);

        SetNodes(Nodes);
        setTimeout(() => {
            setLoading(false);
        }, 300);
    };

    useEffect(() => {
        load();

    }, [Menu]);
    return loading ?
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} >
            <LoadSpin Load={loading} one={true} />
        </div >
        :

        <div className={styles.Page}>



            <div className={styles.PageContent}>


                <div style={{ flex: "1 1 40%" }}>
                    {error && <div className={styles.NodeItem}>Error: {error}</div>}


                    <div className={styles.NodeGrid}>
                        {Nodes.slice()
                            .sort((a, b) => Number(a.ID) - Number(b.ID))
                            .map((n: NodePoint) => {
                                const neon = getNeonStyle(n.status);
                                const soilPercent = Math.min(100, Math.max(0, Math.round((n.soilHumidity / 1023) * 100)));
                                return (
                                    <div key={n.ID} className={styles.NodeCard}>
                                        <div className={styles.NodeCardHeader}>
                                            <div style={{ fontWeight: 700, fontSize: n.isHub ? 18 : 15 }}>
                                                {n.isHub ? "Hub" : `Sensor ${n.ID}`}
                                            </div>
                                            <div className={styles.StatusDot} style={neon} title={`Status: ${n.status}`} />
                                        </div>

                                        <div className={styles.NodeCardBody}>
                                            {n.isHub ? (
                                                <div className={styles.SmallLabel}>Hub device</div>
                                            ) : (
                                                <>
                                                    <div className={styles.SmallLabel}><b>ID:</b> {n.ID}</div>
                                                    <div className={styles.SmallLabel}><b>Темп:</b> {n.dsTemperature ?? "—"} °C</div>
                                                    <div className={styles.SmallLabel}><b>Давл:</b> {n.bmpPressure ?? "—"}</div>
                                                    <div className={styles.SmallLabel}><b>Вологість ґрунту:</b> {soilPercent}%</div>
                                                    <div className={styles.SmallLabel}><b>Кординати:</b> X:{n.x ?? '-'} Y:{n.y ?? '-'} Z:{n.z ?? '-'}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </div >
};

export default NodeMap;
