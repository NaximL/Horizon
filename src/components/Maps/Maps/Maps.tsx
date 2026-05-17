import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { RiRadarLine } from "react-icons/ri";
import styles from "./Maps.module.css";
import type { LatLngExpression } from "leaflet";
import type { NodePoint } from "../../../utils/data";


const emojiIcon = (emoji: string) =>
  new L.DivIcon({
    html: `<div style="
      font-size: 24px;
      border-radius: 50%;
      width:40px;
      height:40px;
      background-color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 6px rgba(0,0,0,0.3);
    ">${emoji}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

const statusColorsHub: Record<string, string> = {
  0: "rgb(0, 130, 0)",
  warn: "#ffb74d",
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

function getMarkerEmoji(status: number | string, isHub: boolean): string {
  if (isHub) return "🏠";
  if (status === 99 || status === "99" || status === "offline") return "⚫";
  const problems = getProblems(status);
  if (problems.some(p => p.type === "error")) return "❌";
  if (problems.some(p => p.type === "warn")) return "⚠️";
  return "✅";
}

type MapsProps = {
  nodes: NodePoint[];
};

const Maps: React.FC<MapsProps> = ({ nodes }) => {
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  const center: LatLngExpression = nodes.length > 0 ? [nodes[0].realLat, nodes[0].realLng] : [0, 0];

  const popupStyle: React.CSSProperties = {
    fontSize: "13px",
    lineHeight: 1.25,
    fontFamily: "inherit",
  };

  return (
    
      <MapContainer
        center={center}
        zoom={18}
        maxZoom={21}
        style={{
          position: "absolute",
          left: 64,
          width: "calc(100vw - 64px)",
          height: "100vh",
          zIndex: 0
        }
        }
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          maxZoom={21}
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          attribution="&copy; Google Maps"
        />

        {
          nodes.map((node) => {
            const icon = emojiIcon(getMarkerEmoji(node.status, node.isHub));
            return (
              <Marker
                key={node.ID}
                icon={icon}
                position={[node.realLat, node.realLng] as LatLngExpression}
                eventHandlers={{
                  mouseover: () => setHoveredMarker(node.ID),
                  mouseout: () => setHoveredMarker(null),
                }}
              >
                {hoveredMarker === node.ID && (
                  <Popup closeButton={false} autoClose={false} closeOnEscapeKey={false} closeOnClick={false}>
                    <div style={popupStyle}>
                      {node.isHub ? (
                        <>
                          <div style={{ marginBottom: 4 }}>
                            <b style={{ fontSize: 15 }}>Центральний Хаб</b>
                          </div>
                          <div>
                            <b>Стан:</b>{" "}
                            <span style={{ color: getNodeColor(node.status, node.isHub), fontWeight: 700 }}>
                              {getStatusLabel(node.status, node.isHub)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ marginBottom: 4 }}>
                            <b style={{ fontSize: 14 }}>Датчик #{node.ID}</b>
                          </div>
                          <div>
                            <b>Стан:</b>{" "}
                            <span style={{ color: getNodeColor(node.status, node.isHub), fontWeight: 700 }}>
                              {getStatusLabel(node.status, node.isHub)}
                            </span>
                          </div>
                          
                          {/* Список помилок датчика */}
                          {(() => {
                            const problems = getProblems(node.status);
                            if (problems.length === 0) return null;
                            return (
                              <div style={{ marginTop: 5, marginBottom: 5, display: "flex", flexDirection: "column", gap: 3 }}>
                                {problems.map((prob, idx) => (
                                  <div key={idx} style={{ 
                                    fontSize: "11px", 
                                    color: prob.type === "error" ? "red" : "#ffb74d",
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5
                                  }}>
                                    <span style={{
                                      width: 5,
                                      height: 5,
                                      borderRadius: "50%",
                                      backgroundColor: prob.type === "error" ? "red" : "#ffb74d",
                                      boxShadow: `0 0 4px ${prob.type === "error" ? "red" : "#ffb74d"}`,
                                      display: "inline-block",
                                      flexShrink: 0
                                    }} />
                                    {prob.text}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          <div><b>Температура:</b> {node.dsTemperature ?? "—"} °C</div>
                          <div>
                            <b>Вологість ґрунту:</b>{" "}
                            {Math.min(100, Math.max(0, Math.round(((1023 - node.soilHumidity) / 1023) * 100)))}%
                          </div>
                          
                          {/* GPS та Координати */}
                          {(() => {
                            const statusNum = typeof node.status === "string" ? parseInt(node.status, 10) : node.status;
                            const isGpsDisconnected = !node.isHub && !!(statusNum & (1 << 5));
                            if (isGpsDisconnected) {
                              return <div style={{ color: "red", fontWeight: 700, marginTop: 4 }}>📍 GPS: НЕ ПІДКЛЮЧЕНО</div>;
                            }
                            return (
                              <div style={{ marginTop: 4 }}>
                                <div><b>📍 GPS:</b> {node.gpsSats} супутників</div>
                                <div style={{ fontSize: "11px", color: "gray", marginTop: 2 }}>
                                  <b>Координати:</b> {node.realLat.toFixed(6)}, {node.realLng.toFixed(6)}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })
        }
      </MapContainer >
  );
};

export default Maps;
