import { useState, useRef, useMemo } from "react";
import { Line, Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import type { NodePoint } from "../../../utils/data";
import { GridHelper, Vector3, Mesh } from "three";
import { 
    RiRouterLine, 
    RiNodeTree, 
    RiTempColdLine, 
    RiDropLine, 
    RiBattery2ChargeLine,
    RiMapPinLine,
    RiGpsLine
} from "react-icons/ri";
import useTheme from "../../../hooks/useDark";
import styles from "./NodeBase.module.css";

const statusColors: Record<string, string> = {
    0: "rgb(0, 206, 0)",
    10: "yellow",
    20: "yellow",
    30: "yellow",
    11: "red",
    21: "red",
    99: "gray"
};

const statusColorsHub: Record<string, string> = {
    0: "rgb(0, 130, 0)",
    warn: "#ffb74d",
    error: "red",
    offline: "gray",
};

const statusNum: Record<string, string> = {
    0: "Нормальний",
    10: "Проблема з Барометром",
    11: "Критична проблема з Барометром",
    20: "Проблема з Датчиком Температури",
    21: "Критична проблема з Датчиком Температури",
    30: "Проблема з Вологістю Ґрунту",
    99: "Офлайн",
    undefined: "Критична помилка"
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
        return statusColorsHub[status] || statusColorsHub[0];
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

function AnimatedNode({ node, isHovered, setHovered }: { node: NodePoint, isHovered: boolean, setHovered: (id: string | null) => void }) {
    const meshRef = useRef<Mesh>(null!);
    const targetScale = useMemo(() => new Vector3(1, 1, 1), []);
    
    useFrame(() => {
        const s = isHovered ? 1.15 : 1;
        targetScale.set(s, s, s);
        meshRef.current.scale.lerp(targetScale, 0.15);
    });

    return (
        <mesh
            ref={meshRef}
            position={[node.x, node.y, node.z]}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(node.ID); }}
            onPointerOut={() => setHovered(null)}
        >
            <sphereGeometry args={node.isHub ? [5, 32, 32] : [3.5, 32, 32]} />
            <meshBasicMaterial
                color={getNodeColor(node.status, node.isHub)}
            />
        </mesh>
    );
}

const MIN_GRID_SIZE = 200;
const GRID_MARGIN = 2;

export default function NodeBase({ nodes }: { nodes: NodePoint[] }) {
    const [hoveredNodeID, setHoveredNodeID] = useState<string | null>(null);
    const { isDark } = useTheme();

    const hoveredNode = hoveredNodeID ? nodes.find(n => n.ID === hoveredNodeID) || null : null;

    const maxCoord = nodes.reduce((max, n) => {
        return Math.max(max, Math.abs(n.x), Math.abs(n.z));
    }, 0);
    
    const gridSize = Math.max(MIN_GRID_SIZE, Math.ceil((maxCoord + GRID_MARGIN) / 50) * 100);
    const gridDivisions = Math.max(20, gridSize / 10);

    return (
        <div className={styles.Container}>
            <Canvas camera={{ position: [gridSize * 0.6, gridSize * 0.8, gridSize * 1.5], fov: 45, near: 1, far: gridSize * 5 }}>
                <ambientLight intensity={0.5} />
                <primitive
                    object={
                        new GridHelper(
                            gridSize,
                            gridDivisions,
                            isDark ? "#ffffff" : "#000000",
                            isDark ? "#454545" : "#9f9f9f"
                        )
                    }
                    position={[0, -0.1, 0]}
                />

                {nodes.map((node) => (
                    <AnimatedNode 
                        key={node.ID} 
                        node={node} 
                        isHovered={hoveredNodeID === node.ID} 
                        setHovered={setHoveredNodeID} 
                    />
                ))}

                {nodes.map((node) => {
                    if (node.isHub) return null;
                    const problems = getProblems(node.status);
                    if (problems.length === 0) return null;

                    const isHidden = hoveredNodeID !== null && hoveredNodeID !== node.ID;
                    const hasError = problems.some(p => p.type === "error");
                    const badgeClass = `${styles.ErrorBadge3D} ${hasError ? styles.Error : styles.Warning} ${isHidden ? styles.Hidden : ""}`;

                    return (
                        <Html 
                            key={`badge-${node.ID}`} 
                            position={[node.x, node.y + 7, node.z]} 
                            center 
                            transform
                            sprite
                            distanceFactor={60}
                        >
                            <div className={badgeClass}>
                                {problems.map((prob, idx) => (
                                    <div key={idx} className={styles.ErrorBadgeItem}>
                                        <span className={`${styles.ErrorBadgeDot} ${prob.type === "error" ? styles.Error : styles.Warning}`} />
                                        <span>{prob.text}</span>
                                    </div>
                                ))}
                            </div>
                        </Html>
                    );
                })}

                {nodes.map((node) => {
                    if (node.parentID === undefined) return null;
                    const parent = nodes.find(n => n.ID === node.parentID);
                    if (!parent) return null;

                    return (
                        <Line
                            key={`line-${node.ID}-${parent.ID}`}
                            points={[
                                [node.x, node.y, node.z],
                                [parent.x, parent.y, parent.z]
                            ]}
                            color={isDark ? "#ffffff" : "#000000"}
                            lineWidth={2}
                        />
                    );
                })}

                {hoveredNode && (
                    <Html position={[hoveredNode.x, hoveredNode.y + 5, hoveredNode.z]} center>
                        <div className={`${styles.Modal} shine`}>
                            {hoveredNode.isHub ? (
                                <div className={styles.Content}>
                                    <div className={styles.Header}>
                                        <div className={styles.IconWrapper}>
                                            <div className={styles.HubIconBox}>
                                                <RiRouterLine size={20} />
                                            </div>
                                            <div>
                                                <div className={styles.HubTitle}>ХАБ</div>
                                                <div className={styles.Label} style={{ color: statusColorsHub[hoveredNode.status] }}>
                                                    {statusNum[hoveredNode.status]}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.MutedText}>
                                        Центральний пристрій
                                    </div>
                                </div>
                            ) : (() => {
                                const batteryPercent = Math.min(100, Math.max(0, Math.round(((hoveredNode.Vbat - 3.0) / (4.2 - 3.0)) * 100)));
                                const soilPercent = Math.min(100, Math.max(0, Math.round((1 - (hoveredNode.soilHumidity / 1023)) * 100)));
                                const batteryColor = getBatteryColor(batteryPercent);

                                const problems = getProblems(hoveredNode.status);
                                const statusColor = getNodeColor(hoveredNode.status, hoveredNode.isHub);
                                const statusText = problems.length > 0
                                    ? problems.map(p => p.text).join(", ")
                                    : "Нормальний";

                                return (
                                    <div className={styles.Content}>
                                        <div className={styles.Header}>
                                            <div className={styles.IconWrapper}>
                                                <div className={styles.IconBox}>
                                                    <RiNodeTree size={16} />
                                                </div>
                                                <div className={styles.Title}>Сенсор #{hoveredNode.ID}</div>
                                            </div>
                                        </div>

                                        <div className={styles.Divider} />

                                        <div className={styles.StatItem}>
                                            <div className={styles.Label}>Статус</div>
                                            {problems.length === 0 ? (
                                                <div className={styles.StatusNormal}>
                                                    <span className={styles.StatusDotNormal} />
                                                    <span className={styles.Value} style={{ color: statusColor, marginTop: 0 }}>Нормальний</span>
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
                                            )}
                                        </div>

                                        <div className={styles.StatsGrid}>
                                            <div className={styles.StatItem}>
                                                <div className={styles.Label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <RiTempColdLine /> ТЕМПЕРАТУРА
                                                </div>
                                                <div className={styles.StatValue}>{hoveredNode.dsTemperature ?? "—"}°C</div>
                                            </div>
                                            <div className={styles.StatItem}>
                                                <div className={styles.Label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <RiDropLine /> ҐРУНТ
                                                </div>
                                                <div className={styles.StatValue}>{soilPercent}%</div>
                                            </div>
                                        </div>

                                        <div className={styles.BatterySection}>
                                            <div className={styles.BatteryHeader}>
                                                <div className={styles.Label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <RiBattery2ChargeLine /> БАТАРЕЯ 
                                                </div>
                                                <div className={styles.BatteryValue} style={{ color: batteryColor }}>
                                                    {batteryPercent}% | {hoveredNode.Vbat}V
                                                </div>
                                            </div>
                                            <div className={styles.BatteryTrack}>
                                                <div className={styles.BatteryFill} style={{ width: `${batteryPercent}%`, background: batteryColor, boxShadow: `0 0 4px ${batteryColor}88` }} />
                                            </div>
                                        </div>

                                        <div className={styles.GpsSection}>
                                            <div className={styles.GpsSectionHeader}>
                                                <div className={styles.Label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <RiMapPinLine /> GPS
                                                </div>
                                                <div className={styles.Label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <RiGpsLine />
                                                    <span style={{ color: !!(hoveredNode.status & (1 << 5)) ? "#ff6b6b" : getSatsColor(hoveredNode.gpsSats ?? 0) }}>
                                                        {!!(hoveredNode.status & (1 << 5)) ? "НЕ ПІДКЛЮЧЕНО" : `${hoveredNode.gpsSats ?? 0} СУПУТНИКІВ`}
                                                    </span>
                                                </div>
                                            </div>
                                            {!(hoveredNode.status & (1 << 5)) && (
                                                <div className={styles.GpsCoordsRow}>
                                                    <div className={styles.GpsCoordItem}>
                                                        <span className={styles.GpsAxisLabel}>LAT</span>
                                                        <span className={styles.GpsCoordValue}>
                                                            {hoveredNode.realLat !== 0 ? hoveredNode.realLat.toFixed(6) : "—"}
                                                        </span>
                                                    </div>
                                                    <div className={styles.GpsCoordItem}>
                                                        <span className={styles.GpsAxisLabel}>LNG</span>
                                                        <span className={styles.GpsCoordValue}>
                                                            {hoveredNode.realLng !== 0 ? hoveredNode.realLng.toFixed(6) : "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </Html>
                )}

                <OrbitControls
                    minDistance={30}
                    maxDistance={gridSize * 3}
                    maxPolarAngle={Math.PI - Math.PI / 3}
                />
            </Canvas>
        </div>
    );
}