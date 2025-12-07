import { useState } from "react";
import { Line, Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { NodePoint } from "../../../utils/data";
import { AxesHelper, GridHelper } from "three";
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
    warn: "yellow",
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


export default function NodeBase({ nodes }: { nodes: NodePoint[] }) {
    const [hoveredNodeID, setHoveredNodeID] = useState<string | null>(null);
    const { isDark } = useTheme();

    const hoveredNode = hoveredNodeID ? nodes.find(n => n.ID === hoveredNodeID) || null : null;

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <Canvas camera={{ position: [50, 80, 220], fov: 60 }}>
                <ambientLight intensity={0.5} />
                <primitive
                    object={
                        new GridHelper(
                            200,
                            20,
                            isDark ? "#ffffff" : "#000000",
                            isDark ? "#454545" : "#9f9f9f"
                        )
                    }
                />


                {nodes.map((node) => (

                    <mesh
                        key={node.ID}
                        position={[node.x, node.y, node.z]}
                        onPointerOver={(e) => { e.stopPropagation(); setHoveredNodeID(node.ID); }}
                        onPointerOut={() => setHoveredNodeID(null)}
                    >
                        <sphereGeometry args={node.isHub ? [5, 20, 20] : [3, 20, 20]} />
                        <meshBasicMaterial
                            color={node.isHub ? statusColorsHub[node.status] : statusColors[node.status]}
                        />
                    </mesh>

                ))}


                {nodes.map((node, i) => {
                    const nearest = nodes
                        .filter((_, j) => j !== i)
                        .sort(
                            (a, b) =>
                                (a.x - node.x) ** 2 + (a.y - node.y) ** 2 + (a.z - node.z) ** 2 -
                                ((b.x - node.x) ** 2 + (b.y - node.y) ** 2 + (b.z - node.z) ** 2)
                        )
                        .slice(0, 3);

                    return nearest.map((n, k) => (
                        <Line
                            key={`line-${node.ID}-${k}`}
                            points={[[node.x, node.y, node.z], [n.x, n.y, n.z]]}
                            color={isDark ? "#ffffff" : "#000000"}
                            lineWidth={1}
                        />
                    ));
                })}

                {hoveredNode && (

                    <Html position={[hoveredNode.x, hoveredNode.y + 5, hoveredNode.z]} center>
                        {hoveredNode.isHub ?
                            <div className={styles.Modal} style={{ ...popupStyle }}>
                                <div style={{ marginBottom: "4px" }}>
                                    <div><b style={{ fontSize: 24 }}>Хаб</b></div>
                                    <b style={{ fontSize: 16 }}>Стан:</b>{" "}
                                    <span style={{ fontSize: 16, color: statusColors[hoveredNode.status] }}>
                                        {statusNum[hoveredNode.status]}
                                    </span>

                                </div>
                            </div>
                            :
                            <div className={styles.Modal} style={{ ...popupStyle }}>
                                <div style={{ marginBottom: "4px" }}>
                                    <b>Стан:</b>{" "}
                                    <span style={{ color: statusColors[hoveredNode.status] }}>
                                        {statusNum[hoveredNode.status]}
                                    </span>
                                </div>
                                <div><b>ID вузла:</b> {hoveredNode.ID}</div>
                                <br />

                                <div><b>Температура:</b> {hoveredNode.dsTemperature} °C</div>
                                <div>
                                    <b>Вологість ґрунту:</b>{" "}
                                    {Math.min(100, Math.max(0, Math.round((hoveredNode.soilHumidity / 1023) * 100)))}%
                                </div>
                                <br />
                                {/* <div><b>Тиск:</b> {hoveredNode.bmpPressure} hPa</div>
                                <div><b>Темп. Бар.</b> {hoveredNode.bmpTemperature} °C</div>
                                <br /> */}

                                <div><b>Кординати:</b> X:{hoveredNode.x} Y:{hoveredNode.y} Z:{hoveredNode.z}</div>
                            </div>
                        }
                    </Html>
                )}

                <OrbitControls
                    // enablePan={false}
                    // enableZoom={true}
                    minDistance={80}
                    maxDistance={350}
                    maxPolarAngle={Math.PI - Math.PI / 3}
                />
            </Canvas>
        </div>
    );
}

const popupStyle: React.CSSProperties = {
    position: "fixed",
    left: 10,
    top: 10,
    minWidth: "200px",
    backdropFilter: "blur(6px)",
    padding: "12px 16px",
    borderRadius: "14px",
    fontSize: "13px",
    pointerEvents: "none",
    boxShadow: "0 0 1rem rgba(0,0,0,0.4)",
};