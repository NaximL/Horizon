import React from "react";
import styles from "./InfoBar.module.css";

interface InfoBarProps {
  value?: string;
  status?: string;
  color?: string
}

const InfoBar: React.FC<InfoBarProps> = ({ value = "100%", status = "Стан в нормі", color = "#00ff99" }) => {
  return (
    <div className={styles.InfoBar}>
      <span className={styles.value} style={{ color: color }}>{value}</span>
      <span className={styles.status}>{status}</span>
    </div>
  );
};

export default InfoBar;