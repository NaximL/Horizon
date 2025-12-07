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
    <div className={`${styles.StatsBar} BlurView`}>
      <div
        id="bubble"
        className={`${styles.BubbleClose} BlurView`}
        onClick={() => {
          OnRefresh();
        }}
        aria-label="close menu"
      >
        <span>🔄️</span>
      </div>

      
      <div className={`${styles.NavItem} ColorText`}>
        <span>{bind ? "Бинд нових сенсорів..." : Connection ? `${IP}` : "Немає підключення"}</span>
      </div>

      <div className={`${styles.NavItem} ColorText`}>
        <span>Статус: {bind ? "🔄 " : Connection ? "✅" : "❌"}</span>
      </div>
    </div>
  );
};

export default StatsBar;