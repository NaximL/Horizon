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

const NavBar = ({ SetMenuNum, SetMenuVisible, MenuVisible }: Props) => {
  const [bubbleFor, setBubbleFor] = React.useState<number | null>(null);

  useEffect(() => {
    setBubbleFor(MenuVisible ? 1 : null);
  }, [MenuVisible]);

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
    <div className={`${styles.NavBar} BlurView`}>

      <div
        id="bubble"
        className={`${styles.BubbleClose} BlurView ${bubbleFor === 1 ? styles.Visible : ""}`}
        onClick={() => {
          SetMenuVisible(false);
          setBubbleFor(null);
        }}
        aria-label="close menu"
      >
        ✕
      </div>

      {navItems.map((item, index) => (
        <div
          key={index}
          onClick={() => handleClick(index)}
          className={styles.NavItem}
        >
          <span>{item.emoji}</span>
          <div>{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default NavBar;