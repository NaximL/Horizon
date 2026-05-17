import React from "react";
import styles from "./StatsBar.module.css";
import { RiRefreshLine } from "react-icons/ri";

type Props = {
  Connection: boolean;
  IP: string;
  bind?: boolean;
  OnRefresh: () => void;
};

const StatsBar = ({ Connection, IP, bind, OnRefresh }: Props) => {
  return (
    <div className={styles.StatsBar}>
      <div 
        className={`${styles.StatusIndicator} ${
          bind ? styles.StatusBind : Connection ? styles.StatusOnline : styles.StatusOffline
        }`} 
        title={bind ? "Режим приєднання..." : Connection ? "Підключено" : "Немає підключення"}
      />
      
      <div className={styles.IpText}>
        {bind ? "BIND MODE" : IP}
      </div>

      <button
        className={styles.RefreshBtn}
        onClick={OnRefresh}
        title="Оновити з'єднання"
      >
        <RiRefreshLine size={18} />
      </button>
    </div>
  );
};

export default StatsBar;