import React, { useState, useEffect } from "react";
import styles from "../MenuBar.module.css";
import {
  RiPaletteLine,
  RiMap2Line,
  RiTimeLine,
  RiGlobalLine,
  RiGpsLine,
  RiSettings3Line,
  RiMoonLine,
  RiSunLine,
  RiBox3Line,
} from "react-icons/ri";

type ThemeMode = "system" | "dark" | "light";
type MapMode = "3d" | "google";

const Settings: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem("theme") as ThemeMode) || "system");
  const [mapMode, setMapMode] = useState<MapMode>(() => (localStorage.getItem("mapMode") as MapMode) || "3d");

  const [LocalIp, SetLocalIp] = useState<string>(() => localStorage.getItem("ip") || "192.168.4.1");

  const [saveInterval, setSaveInterval] = useState(() => localStorage.getItem("saveInterval") || "1");
  const [isCustomMode, setIsCustomMode] = useState(() => !["1", "5", "15"].includes(localStorage.getItem("saveInterval") || "1"));

  const handleApplyIP = () => {
    const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (!ipPattern.test(LocalIp)) {
      alert("Будь ласка, введіть коректну IP адресу!");
      return;
    }
    const ar = confirm(`Ви впевнені, що хочете змінити IP адресу? 
      Нова адреса: ${LocalIp}`);
    if (!ar) {
      return;
    }
    localStorage.setItem("ip", LocalIp);
    window.location.reload();
  };

  const updateTheme = (m: ThemeMode) => {
    setTheme(m);
    localStorage.setItem("theme", m);
  };

  const updateMapMode = (m: MapMode) => {
    setMapMode(m);
    localStorage.setItem("mapMode", m);
  };

  const updateSaveInterval = (val: string) => {
    setSaveInterval(val);
    localStorage.setItem("saveInterval", val);
  };

  const handlePresetClick = (val: string) => {
    setIsCustomMode(false);
    updateSaveInterval(val);
  };

  const handleCustomClick = () => {
    setIsCustomMode(true);
    const current = !["1", "5", "15"].includes(saveInterval) ? saveInterval : "10";
    updateSaveInterval(current);
  };

  const reset = () => {
    if (window.confirm("Скинути всі налаштування?")) {
      setTheme("system");
      setMapMode("3d");
      SetLocalIp("192.168.1.13");
      handleApplyIP();
      setSaveInterval("1");
      setIsCustomMode(false);
      localStorage.clear();
    }
  };

  return (
    <div className={`${styles.Page} ${styles.SettingsPage}`}>

      <SettingRow label="Вигляд" icon={<RiPaletteLine />} color="#3b82f6" desc="Тема інтерфейсу">
        <div className={styles.SegmentRow}>
          <div
            className={styles.SegBubble}
            style={{
              width: `calc((100% - 8px) / 3)`,
              transform: `translateX(${theme === 'system' ? '0%' : theme === 'dark' ? '100%' : '200%'})`
            }}
          />
          {(["system", "dark", "light"] as ThemeMode[]).map((m) => (
            <button
              key={m}
              className={`${styles.SegBtn} ${theme === m ? styles.SegBtnActive : ""}`}
              onClick={() => updateTheme(m)}
            >
              {m === "system" ? <><RiSettings3Line /> Авто</> : m === "dark" ? <><RiMoonLine /> Темний</> : <><RiSunLine /> Світлий</>}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Карта" icon={<RiMap2Line />} color="#10b981" desc="Режим відображення">
        <div className={styles.SegmentRow}>
          <div
            className={styles.SegBubble}
            style={{
              width: `calc(50% - 4px)`,
              transform: `translateX(${mapMode === '3d' ? '0%' : '100%'})`
            }}
          />
          <button
            className={`${styles.SegBtn} ${mapMode === "3d" ? styles.SegBtnActive : ""}`}
            onClick={() => updateMapMode("3d")}
          ><RiBox3Line /> 3D</button>
          <button
            className={`${styles.SegBtn} ${mapMode === "google" ? styles.SegBtnActive : ""}`}
            onClick={() => updateMapMode("google")}
          ><RiMap2Line /> Google</button>
        </div>
      </SettingRow>

      <SettingRow label="Статистика" icon={<RiTimeLine />} color="#f59e0b" desc="Інтервал збереження">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
          <div className={styles.SegmentRow}>
            <div
              className={styles.SegBubble}
              style={{
                width: `calc((100% - 8px) / 4)`,
                transform: `translateX(${isCustomMode ? '300%' :
                    saveInterval === '1' ? '0%' :
                      saveInterval === '5' ? '100%' : '200%'
                  })`
              }}
            />
            {["1", "5", "15"].map(val => (
              <button
                key={val}
                className={`${styles.SegBtn} ${!isCustomMode && saveInterval === val ? styles.SegBtnActive : ""}`}
                onClick={() => handlePresetClick(val)}
              >{val} хв</button>
            ))}
            <button
              className={`${styles.SegBtn} ${isCustomMode ? styles.SegBtnActive : ""}`}
              onClick={handleCustomClick}
            >Інший</button>
          </div>

          {isCustomMode && (
            <div className={styles.InputWrapper} style={{ marginTop: "4px" }}>
              <input
                type="number"
                min="1"
                max="1440"
                className={styles.Input}
                value={saveInterval}
                onChange={e => {
                  const val = e.target.value;
                  updateSaveInterval(val);
                }}
                placeholder="Введіть інтервал..."
                spellCheck={false}
              />
              <span className={styles.InputPrefix} style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: "12px", borderRight: "none" }}>хв</span>
            </div>
          )}
        </div>
      </SettingRow>

      <SettingRow label="IP сервера" icon={<RiGlobalLine />} color="#8b5cf6" desc="Адреса підключення">
        <div className={styles.InputWrapper}>
          <span className={styles.InputPrefix}>http://</span>
          <input
            className={styles.Input}
            value={LocalIp}
            onChange={e => SetLocalIp(e.target.value)}
            placeholder="192.168.1.13"
            spellCheck={false}
          />

        </div>
        <button onClick={handleApplyIP} className={styles.BtnApply}>Зберегти IP</button>
      </SettingRow>

      <div className={styles.SettingsActionsWrapper}>
        <button className={styles.BtnGPS} onClick={() => { localStorage.removeItem("horizon_last_known_gps"); document.location.reload(); }}>
          <RiGpsLine size={20} /> Оновити дані GPS
        </button>

        <div className={styles.FooterActions}>
          <button onClick={reset} className={styles.BtnReset}>Скинути все</button>
        </div>
      </div>
    </div>
  );
};

function SettingRow({ label, icon, color, desc, children }: { label: string; icon: React.ReactNode; color: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className={styles.SettingCard}>
      <div className={styles.SettingHeader}>
        <div className={styles.SettingIcon} style={{ background: color }}>{icon}</div>
        <div>
          <div className={styles.SettingTitle}>{label}</div>
          {desc && <div className={styles.SettingDesc}>{desc}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default Settings;
