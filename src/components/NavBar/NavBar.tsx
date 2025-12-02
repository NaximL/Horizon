import React, { useEffect } from "react";
import styles from "./NavBar.module.css";

const navItems = [
  { emoji: "📡", label: "Sensors" },
  { emoji: "📊", label: "Stats" },
  { emoji: "⚙️", label: "Settings" },
];

type Props = {
  MenuNum: number;
  SetMenuNum: (num: number) => void;
  SetMenuVisible: (vis: boolean) => void;
  MenuVisible: boolean;
};

const NavBar = ({ SetMenuNum, SetMenuVisible, MenuVisible: _MenuVisible }: Props) => {
  const [bubbleFor, setBubbleFor] = React.useState<number | null>(null);

  useEffect(() => {
    setBubbleFor(_MenuVisible ? 1 : null);
  }, [_MenuVisible])

  const handleClick = (index: number) => {
    SetMenuNum(index + 1);
    SetMenuVisible(true);


    try {
      const key = `nav_bubble_shown_${index + 1}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        setBubbleFor(index + 1);
        setTimeout(() => setBubbleFor(null), 4000);
      }
    } catch (e) { }
  };

  return (
    <div className={styles.NavBar}>
      <div className={styles.NavBarLineLeft} />
      <div className={styles.NavBarLineRight} />


      <div
        id="bubble"
        className={`${styles.Bubble} ${bubbleFor === 1 ? styles.Visible : ""}`}
      >
        <div className={styles.NavBarLineLeftCircle} />
        <div className={styles.NavBarLineRightCircle} />
        <button
          className={styles.BubbleClose}
          onClick={() => {
            SetMenuVisible(false);
            setBubbleFor(null);
          }}
          aria-label="close menu"
        >
          ✕
        </button>
      </div>


      {navItems.map((item, index) => (
        <div
          key={index}
          onClick={() => handleClick(index)}
          className={styles.NavItem}
          style={{ position: "relative" }}
        >
          <span>{item.emoji}</span>
          <div>{item.label}</div>



        </div>
      ))}
    </div>
  );
};

export default NavBar;