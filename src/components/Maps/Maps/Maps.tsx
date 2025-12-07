import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import type { NodePoint } from "../../../utils/data";

// Кастомный эмодзи-маркер
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

const statusEmoji: Record<number, string> = {
  0: "✅",
  10: "⚠️",
  11: "❌",
  20: "🌡️",
  21: "🔥",
  30: "💧",
  99: "⚫",
};

const statusColors: Record<number, string> = {
  0: "rgb(0, 206, 0)",
  10: "yellow",
  11: "red",
  20: "yellow",
  21: "red",
  30: "yellow",
  99: "gray",
};

const statusNum: Record<number, string> = {
  0: "Нормальний",
  10: "Проблема з Барометром",
  11: "Критична проблема з Барометром",
  20: "Проблема з Датчиком Температури",
  21: "Критична проблема з Датчиком Температури",
  30: "Проблема з Вологістю Ґрунту",
  99: "Офлайн",
};

type MapsProps = {
  nodes: NodePoint[];
};

const Maps: React.FC<MapsProps> = ({ nodes }) => {
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  const center: LatLngExpression = [nodes[0].x, nodes[0].y];

  const popupStyle: React.CSSProperties = {
    fontSize: "13px",
    lineHeight: 1.2,
  };

  return (
    <MapContainer
      center={center}
      zoom={3}
      style={{
        position: "absolute",
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0
      }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

      {nodes.map((node) => {
        const icon = node.isHub ? emojiIcon("🏠") : emojiIcon(statusEmoji[node.status] || "❓");
        return (
          <Marker
            key={node.ID}
            icon={icon}
            position={[node.x, node.y] as LatLngExpression}
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
                        <b style={{ fontSize: 16 }}>Хаб</b>
                      </div>
                      <div>
                        <b>Стан:</b>{" "}
                        <span style={{ color: statusColors[node.status] }}>
                          {statusNum[node.status]}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div><b>ID:</b> {node.ID}</div>
                      <div>
                        <b>Стан:</b>{" "}
                        <span style={{ color: statusColors[node.status] }}>
                          {statusNum[node.status]}
                        </span>
                      </div>
                      <div><b>Температура:</b> {node.dsTemperature} °C</div>
                      <div>
                        <b>Вологість ґрунту:</b>{" "}
                        {Math.round((node.soilHumidity / 1023) * 100)}%
                      </div>
                      <div><b>Координати:</b> X:{node.x} Y:{node.y} Z:{node.z}</div>
                    </>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default Maps;