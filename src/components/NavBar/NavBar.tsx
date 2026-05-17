import React from "react";
import styles from "./NavBar.module.css";
import { RiCompass3Line, RiSensorLine, RiBarChartBoxLine, RiSettings4Line, RiBox3Line, RiMap2Line, RiPulseLine } from "react-icons/ri";

type Props = {
  MenuNum: number;
  SetMenuNum: (num: number) => void;
  SetMenuVisible: (vis: boolean) => void;
  MenuVisible: boolean;
  mapMode: "3d" | "google";
};

const NavBar = ({ SetMenuNum, SetMenuVisible, MenuVisible, MenuNum, mapMode }: Props) => {

  const handleClick = (index: number, isMap?: boolean) => {
    if (isMap) {
      SetMenuVisible(false);
    } else {
      if (MenuVisible && MenuNum === index) {
        SetMenuVisible(false);
      } else {
        SetMenuNum(index);
        SetMenuVisible(true);
      }
    }
  };

  return (
    <nav className={styles.NavBar}>
      <div className={styles.NavGroup}>
        <button
          className={`${styles.NavItem} ${!MenuVisible ? styles.Active : ""}`}
          onClick={() => handleClick(0, true)}
        >
          {mapMode === "3d" ? <RiBox3Line /> : <RiMap2Line />}
          <span className={styles.NavTooltip}>Мапа</span>
        </button>
      </div>

      <div className={styles.Separator} />

      <div className={styles.NavGroup}>
        {[
          { icon: <RiSensorLine />, label: "Сенсори", idx: 1 },
          { icon: <RiBarChartBoxLine />, label: "Запис статистики", idx: 2 },
          { icon: <RiPulseLine />, label: "Моніторинг", idx: 3 },
        ].map(item => (
          <button
            key={item.idx}
            className={`${styles.NavItem} ${MenuVisible && MenuNum === item.idx ? styles.Active : ""}`}
            onClick={() => handleClick(item.idx)}
          >
            {item.icon}
            <span className={styles.NavTooltip}>{item.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.BottomGroup}>
        <button
          className={`${styles.NavItem} ${MenuVisible && MenuNum === 4 ? styles.Active : ""}`}
          onClick={() => handleClick(4)}
        >
          <RiSettings4Line />
          <span className={styles.NavTooltip}>Налаштування</span>
        </button>
      </div>
    </nav>
  );
};

export default NavBar;