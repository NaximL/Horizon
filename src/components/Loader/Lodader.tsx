import { RiRadarLine } from "react-icons/ri";
import styles from "./Loader.module.css";

const Loader = () => {
    return (
        <div className={styles.EmptyState}>
            <div className={styles.EmptyIcon}>
                <RiRadarLine />
            </div>
            <div className={styles.EmptyTitle}>Система очікує дані</div>
            <div className={styles.EmptyText}>
                На даний момент немає підключених сенсорів. Переконайтеся, що ваші пристрої увімкнені та знаходяться в радіусі дії Хаба.
            </div>
        </div>
    );
}

export default Loader;