import styles from "./LoadBar.module.css";

type Props = {
  loaded: number;  
  total: number;
};

const LoadBar = ({ loaded, total }: Props) => {
  const isConnecting = loaded === -1;
  const percent = !isConnecting && total > 0
    ? Math.round((loaded / total) * 100)
    : 0;

  return (
    <div className={`${styles.LoadBar} shine BlurView`}>
      <div
        className={styles.progressLine}
        style={{ width: isConnecting ? "0%" : `${percent}%` }}
      />

      <div className={styles.spinSection}>
        <svg className={styles.spinner} viewBox="0 0 20 20">
          <circle className={`${styles.spinnerCircle} ColorText`} cx="10" cy="10" r="7" />
        </svg>
      </div>

      <div className={styles.vDivider} />

      <div className={`${styles.textSection} ColorText`}>
        {isConnecting ? (
          <>
            <span className={styles.connectingText}>Підключення</span>
            
          </>
        ) : (
          <>
            <div className={styles.counterRow}>
              <span className={styles.loadedNum}>{loaded}</span>
              <span className={styles.slash}>/</span>
              <span className={styles.totalNum}>{total}</span>
            </div>
            <div className={styles.subRow}>
              <span className={styles.statusText}>
                {loaded === total && total > 0 ? "Готово" : "Сенсори"}
              </span>
              {loaded < total && (
                <>
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoadBar;