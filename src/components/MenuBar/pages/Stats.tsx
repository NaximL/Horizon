import React from "react";
import styles from "../MenuBar.module.css";

const Stats: React.FC = () => {
  return (
    <div className={styles.Page}>
      <div className={styles.PageHeader}>
        <div>
          <div className={styles.PageTitle}>System Overview</div>
          <div className={styles.PageSubtitle}>Live performance and telemetry</div>
        </div>
      </div>

      <div className={styles.PageContent}>
        <div className={styles.StatCard}>
          <div className={styles.PageSubtitle}>🟢 Active Nodes</div>
          <div className={styles.StatValue}>12</div>
        </div>

        <div className={styles.StatCard}>
          <div className={styles.PageSubtitle}>⚠️ Alerts</div>
          <div className={styles.StatValue}>3</div>
        </div>

        <div className={styles.StatCard}>
          <div className={styles.PageSubtitle}>🌡️ Avg. Temperature</div>
          <div className={styles.StatValue}>22.8 °C</div>
        </div>
      </div>

      <div className={styles.ActionRow}>
        <button className={styles.Btn}>Export Data</button>
        <button className={styles.Btn}>View Details</button>
      </div>
    </div>
  );
};

export default Stats;