import React, { useEffect, useState } from "react";
import styles from "./MenuBar.module.css";

type Props = {
  visible: boolean;
  menuNum: number;
  SetBinding: (bind: boolean) => void;
  Menu: number;
  Bind: boolean;
};

import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import Sensors from "./pages/Sensors";


const pages = [Sensors, Stats, Settings];

const MenuBar = ({ visible, menuNum, SetBinding, Bind }: Props) => {
  const p: Record<number, string> = {
    1: styles.Pages1,
    2: styles.Pages2,
    3: styles.Pages3,
  };


  const titles = ["Сенсори", "Статистика", "Налаштування"];

  return (
    <div
      className={[
        styles.MenuBar,
        visible && styles.MenuBarActive,
        'BlurView'
      ]
        .filter(Boolean)
        .join(" ")}
    >

      <div className={styles.Header}>
        <div className={styles.PageTitle}>{titles[menuNum - 1]}</div>
      </div>

      <div className={[styles.PagesWrapper, p[menuNum]]
        .filter(Boolean)
        .join(" ")}>
        <div key={menuNum}>
          {React.createElement(pages[menuNum - 1] as React.ComponentType<any>, { SetBinding: SetBinding, Bind: Bind, Menu: menuNum })}
        </div>
      </div>
    </div>
  );
};

export default MenuBar;