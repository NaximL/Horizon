import React, { useEffect, useState } from "react";
import styles from "../MenuBar.module.css";

type ThemeMode = "system" | "dark" | "light";
type StartMode = "3d" | "maps";

const Settings: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [startMode, setStartMode] = useState<StartMode>("3d");
  const [ip, setIp] = useState("192.168.0.100");

  useEffect(() => {
    // если тема как в системе
    if (theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = systemDark ? "dark" : "light";
    } else {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  const apply = () => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("startMode", startMode);
    localStorage.setItem("ip", ip);

    alert("Settings saved ✅");
  };

  const reset = () => {
    setTheme("system");
    setStartMode("3d");
    setIp("192.168.0.100");
    localStorage.clear();
  };

  return (
    <div className={`${styles.Page}`}>

      <div className={styles.SettingsGrid}>

        {/* THEME */}
        <div className={styles.SettingsTile}>
          <div className={styles.TileIcon}>🎨</div>
          <div className={styles.TileTitle}>Theme</div>
          <div className={styles.ThemeGroup}>
            {["system", "dark", "light"].map(m => (
              <button
                key={m}
                className={`${styles.ThemeBtn} ${theme === m ? styles.ActiveBtn : ""}`}
                onClick={() => setTheme(m as ThemeMode)}
              >
                {m === "system" ? "System" : m === "dark" ? "Dark" : "Light"}
              </button>
            ))}
          </div>
        </div>

        {/* START MODE */}
        <div className={styles.SettingsTile}>
          <div className={styles.TileIcon}>🚀</div>
          <div className={styles.TileTitle}>Start mode</div>
          <div className={styles.ThemeGroup}>
            {["3d", "maps"].map(m => (
              <button
                key={m}
                className={`${styles.ThemeBtn} ${startMode === m ? styles.ActiveBtn : ""}`}
                onClick={() => setStartMode(m as StartMode)}
              >
                {m === "3d" ? "3D Mode" : "Maps"}
              </button>
            ))}
          </div>
        </div>

        
        <div className={`${styles.SettingsTile} ${styles.Full}`}>
          <div className={styles.TileIcon}>🌐</div>
          <div className={styles.TileTitle}>Server IP</div>
          <input
            value={ip}
            onChange={e => setIp(e.target.value)}
            placeholder="192.168.0.1"
            className={styles.Input}
          />
        </div>

      </div>

      <div className={styles.TileFooter}>
        
          <button className={styles.Btn} onClick={apply}>Apply</button>

        

      </div>

    </div>
  );
};

export default Settings;