import styles from "./MapToggle.module.css";

type Props = {
  mode: "3d" | "google";
  setMode: (m: "3d" | "google") => void;
};

const MapToggle = ({ mode, setMode }: Props) => {
  return (
    <div className={`${styles.ToggleWrapper} BlurView`}>
      <div
        className={`${styles.ToggleBtn} ${mode === "3d" ? styles.Active : ""}`}
        onClick={() => setMode("3d")}
      >
        🌐 3D
      </div>

      <div
        className={`${styles.ToggleBtn} ${mode === "google" ? styles.Active : ""}`}
        onClick={() => setMode("google")}
      >
        🗺 Maps
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