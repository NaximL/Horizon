import React from "react";
import styles from "../MenuBar.module.css";

const Profile: React.FC = () => {
  return (
    <div className={styles.Page}>
      <div className={styles.PageHeader}>
        <div>
          <div className={styles.PageTitle}>Profile</div>
          <div className={styles.PageSubtitle}>User details and preferences</div>
        </div>
      </div>

      <div className={styles.PageContent}>
        <div className={styles.ProfileCard}>
          <div className={styles.Avatar}>AB</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 700 }}>Alex B.</div>
            <div className={styles.PageSubtitle}>alex@example.com</div>
          </div>
        </div>
      </div>

      <div className={styles.ActionRow}>
        <button className={styles.Btn}>Edit</button>
        <button className={styles.Btn}>Sign out</button>
      </div>
    </div>
  );
};

export default Profile;
