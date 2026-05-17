import React from "react";
import styles from "./MapToggle.module.css";
import { RiBox3Line, RiMap2Line } from "react-icons/ri";

type Props = {
  mode: "3d" | "google";
  setMode: (m: "3d" | "google") => void;
};

const MapToggle = ({ mode, setMode }: Props) => {
  return (
    <div className={styles.ToggleWrapper}>
      <div
        className={`${styles.ToggleBtn} ${mode === "3d" ? styles.Active : ""}`}
        onClick={() => setMode("3d")}
      >
        <RiBox3Line size={16} /> 3D
      </div>

      <div
        className={`${styles.ToggleBtn} ${mode === "google" ? styles.Active : ""}`}
        onClick={() => setMode("google")}
      >
        <RiMap2Line size={16} /> Карта
      </div>

      <div
        className={`${styles.Slider} ${
          mode === "google" ? styles.Right : styles.Left
        }`}
      />
    </div>
  );
};

export default MapToggle;