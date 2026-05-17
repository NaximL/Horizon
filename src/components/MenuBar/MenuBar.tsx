import React, { useState, useEffect } from "react";
import styles from "./MenuBar.module.css";

type Props = {
  visible: boolean;
  menuNum: number;
  SetBinding: (bind: boolean) => void;
  Menu: number;
  Bind: boolean;
  Connection: boolean;
};

import Settings from "./pages/Settings";
import Sensors from "./pages/Sensors";
import Stats from "./pages/Stats";
import RuntimeStats from "./pages/RuntimeStats";

import { RiAddLine } from "react-icons/ri";

const pages = [Sensors, Stats, RuntimeStats, Settings];

const MenuBar = ({ visible, menuNum, SetBinding, Bind, Connection }: Props) => {
  const [subView, setSubView] = useState<string>("list");
  const [addTrigger, setAddTrigger] = useState(0);

  const sizeClass: Record<number, string> = {
    1: styles.Pages1,
    2: subView === "list" ? styles.StatsListWidth : styles.StatsDetailWidth,
    3: styles.StatsDetailWidth,
    4: styles.Pages4,
  };
  const titles = ["Сенсори", "Запис статистики", "Моніторинг", "Налаштування"];


  useEffect(() => {
    setSubView("list");
    setAddTrigger(0);
  }, [menuNum, visible]);

  return (
    <div
      className={[
        styles.MenuBar,
        visible && styles.MenuBarActive,
        sizeClass[menuNum],
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.Header}>
        <div className={styles.PageTitle}>{titles[menuNum - 1]}</div>
        
        {menuNum === 2 && subView === "list" && (
          <button 
            className={styles.HeaderAddBtn}
            onClick={() => setAddTrigger(prev => prev + 1)}
          >
            <RiAddLine size={20} />
            <span>Новий запис</span>
          </button>
        )}
      </div>

      <div className={styles.PagesWrapper}>
        <div key={menuNum}>
          {React.createElement(pages[menuNum - 1] as React.ComponentType<any>, {
            SetBinding,
            Bind,
            Menu: menuNum,
            Connection,
            onSubViewChange: setSubView,
            addTrigger: addTrigger,
          })}
        </div>
      </div>
    </div>
  );
};

export default MenuBar;