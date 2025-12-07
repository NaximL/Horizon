import React, { useState } from "react";
import styles from "./Setup.module.css";

const Setup = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const [step, setStep] = useState(0);
    const [hubIP, setHubIP] = useState("");
    const [maxSensors] = useState(5);
    const [sensorsConfig, setSensorsConfig] = useState({
        thermometer: true,
        barometer: false,
        soilHumidity: true,
        lightSensor: false,
    });
    const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto");
    const [manualIP, setManualIP] = useState(false);
    const [foundHubs, setFoundHubs] = useState<string[]>([]);

    const toggleSensor = (key: string) => {
        setSensorsConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const searchHubs = () => {
        // простая симуляция поиска
        setFoundHubs(["192.168.0.101", "192.168.0.102"]);
    };

    if (!visible) return null;

    const nextStep = () => setStep(prev => Math.min(prev + 1, 2));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

    const getPosClass = (index: number) => {
        if (index === step) return styles.Center;
        return index < step ? styles.Left : styles.Right;
    };

    const steps = [
        // Step 0
        (
            <div key={0} className={styles.StepInner}>
                {!manualIP && (
                    <>
                        <button className={styles.PrimaryBtn} onClick={searchHubs}>Search Nearby Hubs</button>
                        {foundHubs.length > 0 && (
                            <ul className={styles.HubList}>
                                {foundHubs.map(ip => (
                                    <li key={ip}>
                                        <button className={styles.HubBtn} onClick={() => { setHubIP(ip); nextStep(); }}>
                                            {ip}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <button className={styles.LinkBtn} onClick={() => setManualIP(true)}>Enter IP manually</button>
                    </>
                )}
                {manualIP && (
                    <label className={styles.FieldLabel}>
                        Hub IP
                        <input
                            type="text"
                            value={hubIP}
                            onChange={(e) => setHubIP(e.target.value)}
                            placeholder="192.168.0.1"
                            className={styles.Input}
                        />
                    </label>
                )}
            </div>
        ),

        // Step 1
        (
            <div key={1} className={styles.StepInner}>
                <div className={styles.SectionTitle}>Sensor Types</div>
                {Object.entries(sensorsConfig).map(([key, value]) => (
                    <label key={key} className={styles.CheckboxLabel}>
                        <input type="checkbox" checked={value} onChange={() => toggleSensor(key)} />
                        <span className={styles.CheckboxText}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </label>
                ))}
            </div>
        ),

        // Step 2
        (
            <div key={2} className={styles.StepInner}>
                <div className={styles.SectionTitle}>Theme</div>
                <div className={styles.ThemeButtons}>
                    <button className={theme === "light" ? styles.ActiveBtn : styles.ThemeBtn} onClick={() => setTheme("light")}>Light</button>
                    <button className={theme === "dark" ? styles.ActiveBtn : styles.ThemeBtn} onClick={() => setTheme("dark")}>Dark</button>
                    <button className={theme === "auto" ? styles.ActiveBtn : styles.ThemeBtn} onClick={() => setTheme("auto")}>Auto</button>
                </div>
                <div className={styles.Helper}>Max sensors supported: {maxSensors}</div>
            </div>
        )
    ];

    return (
        <div className={styles.SetupBackdrop} onClick={onClose}>
            <div className={styles.SetupModal} onClick={(e) => e.stopPropagation()}>

                <div className={styles.ButtonRow}>
                    <div className={styles.LeftControls}>
                        {step > 0 && <button className={styles.SecondaryBtn} onClick={prevStep}>Back</button>}
                    </div>

                    <h2 className={styles.Title}>Hub Setup</h2>

                    <div className={styles.RightControls}>
                        {step < 2 && <button className={styles.PrimaryBtn} onClick={nextStep} disabled={step === 0 && !hubIP}>Next</button>}
                        {step === 2 && (
                            <>
                                <button className={styles.SecondaryBtn} onClick={onClose}>Cancel</button>
                                <button className={styles.SaveBtn} onClick={onClose}>Save</button>
                            </>
                        )}
                    </div>


                </div>


                <div className={styles.StepsViewport}>
                    {steps.map((content, idx) => (
                        <div key={idx} className={`${styles.Step} ${getPosClass(idx)}`}>
                            {content}
                        </div>
                    ))}
                </div>


            </div>
        </div>
    );
};

export default Setup;