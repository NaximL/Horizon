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
// import Profile from "./pages/Profile";
import Sensors from "./pages/Sensors";

const pages = [Sensors, Stats, Settings];

const MenuBar = ({ visible, menuNum, SetBinding, Bind }: Props) => {
  const [prevNum, setPrevNum] = useState(menuNum);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const p: Record<number, string> = {
    1: styles.Pages1,
    2: styles.Pages2,
    3: styles.Pages3,
    4: styles.Pages4,
  };

  useEffect(() => {
    if (menuNum > prevNum) setDirection("right");
    else if (menuNum < prevNum) setDirection("left");
    setPrevNum(menuNum);
  }, [menuNum]);

  const titles = ["Сенсори", "Статистика", "Налаштування"];

  return (
    <div
      className={[
        styles.MenuBar,
        visible && styles.MenuBarActive,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.NavBarLineLeft} />
      <div className={styles.NavBarLineRight} />

      <div className={styles.Header}>
        <div>
          <div className={styles.PageTitle}>{titles[menuNum - 1]}</div>
          <div className={styles.PageSubtitle}>{""}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className={styles.Dots}>
            {titles.map((_, i) => (
              <div
                key={i}
                className={`${styles.Dot} ${i === menuNum - 1 ? styles.DotActive : ""}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={[styles.PagesWrapper, p[menuNum]]
        .filter(Boolean)
        .join(" ")}>
        <div
          key={menuNum}
          className={`${direction === "right" ? styles.slideIn_right : styles.slideIn_left
            }`}
        >
          {React.createElement(pages[menuNum - 1] as React.ComponentType<any>, { SetBinding: SetBinding, Bind: Bind, Menu: menuNum })}
        </div>
      </div>
    </div>
  );
};

export default MenuBar;