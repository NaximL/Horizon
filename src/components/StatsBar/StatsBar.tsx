import React, { useEffect } from "react";
import styles from "./StatsBar.module.css";

type Props = {
  Connection: boolean;
  IP: string;
  bind?: boolean;
  OnRefresh: () => void;
};

const StatsBar = ({ Connection, IP, bind, OnRefresh }: Props) => {

  return (
    <div className={styles.StatsBar}>
      <div className={styles.NavBarLineLeft} />
      <div className={styles.NavBarLineRight} />

      <div
        id="bubble"
        className={`${styles.Bubble}`}
      >
        <div className={styles.NavBarLineLeftCircle} />
        <div className={styles.NavBarLineRightCircle} />
        <button
          className={styles.BubbleClose}
          onClick={() => {
            OnRefresh();
          }}
          aria-label="close menu"
        >
          🔄️
        </button>
      </div>


      <div className={styles.NavItem}>
        <span>{bind ? "Бинд нових сенсорів..." : Connection ? `${IP}` : "Немає підключення"}</span>
      </div>

      <div className={styles.NavItem}>
        <span>Статус: {bind ? "🔄 " : Connection ? "✅" : "❌"}</span>
      </div>
    </div>
  );
};

export default StatsBar;