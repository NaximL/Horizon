import React, { useState } from "react";
import styles from "../MenuBar.module.css";

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className={styles.Page}>
      {/* Заголовок */}
      <div className={styles.PageHeader}>
        <div>
          <div className={styles.PageTitle}>Settings</div>
          <div className={styles.PageSubtitle}>Customize your Horizon experience</div>
        </div>
      </div>

      {/* Основные настройки */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
        {[
          { label: "🌙 Dark Mode", state: darkMode, setter: setDarkMode },
          { label: "🧩 Show Grid", state: showGrid, setter: setShowGrid },
          { label: "🔄 Auto Refresh", state: autoRefresh, setter: setAutoRefresh },
          { label: "🔔 Notifications", state: notifications, setter: setNotifications },
        ].map((item, index) => (
          <label
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            <span className={styles.PageSubtitle}>{item.label}</span>
            <div
              onClick={() => item.setter(!item.state)}
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                background: item.state
                  ? "linear-gradient(90deg, #57d8ff, #6a5cff)"
                  : "rgba(255,255,255,0.1)",
                position: "relative",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 2,
                  left: item.state ? 20 : 2,
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              />
            </div>
          </label>
        ))}
      </div>

      {/* Дополнительные действия */}
      <div className={styles.ActionRow} style={{ marginTop: 24 }}>
        <button className={styles.Btn} style={{ flex: 1, marginRight: 8 }}>
          💾 Save
        </button>
        <button className={styles.Btn} style={{ flex: 1, marginLeft: 8 }}>
          ↩ Reset
        </button>
      </div>

      {/* Информация */}
      <div style={{ marginTop: 20, fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>
        ⚡ Horizon v1.2 — Your smart network dashboard
      </div>
    </div>
  );
};

export default Settings;