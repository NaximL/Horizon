import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Setup.module.css";
import {
  RiWifiFill,
  RiWifiOffLine,
  RiSignalTowerFill,
  RiSensorLine,
  RiCheckDoubleLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiRefreshLine,
  RiLoader4Line,
  RiCheckLine,
  RiCloseLine,
  RiRouterLine,
  RiGlobalLine,
  RiNodeTree,
  RiRadioButtonLine,
  RiPlayFill,
  RiSearchLine,
  RiFlashlightLine,
} from "react-icons/ri";

type ConnectionStatus = "idle" | "connecting" | "connected" | "failed";
type FlatNode = { id: number; parent: string };
type HubInfo = { MAX_SENSORS: number; nodes: number; nextID: number };

const Setup = ({
  ServerUrl,
  visible,
  onClose,
}: {
  ServerUrl: string;
  visible: boolean;
  onClose: () => void;
}) => {
  const [step, setStep] = useState(0);
  const [hubIP, setHubIP] = useState(() => localStorage.getItem("ip") || "");
  const [connectionMode, setConnectionMode] = useState<"ap" | "wifi" | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [hubInfo, setHubInfo] = useState<HubInfo | null>(null);

  
  const [discovering, setDiscovering] = useState(false);
  const [discoveredNodes, setDiscoveredNodes] = useState<FlatNode[]>([]);
  const [discoverDone, setDiscoverDone] = useState(false);

  
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<{ registered: number; nextID: number } | null>(null);
  const [registerTimer, setRegisterTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  
  const [verifying, setVerifying] = useState(false);
  const [verifyData, setVerifyData] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const totalSteps = 4;

  const getActiveIP = useCallback(() => {
    if (connectionMode === "ap") return "192.168.4.1";
    return hubIP || ServerUrl;
  }, [connectionMode, hubIP, ServerUrl]);

  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  

  const connectToHub = async (ip: string) => {
    setConnectionStatus("connecting");
    setHubInfo(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`http://${ip}/login`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json: HubInfo = await res.json();
        setHubInfo(json);
        setConnectionStatus("connected");
        localStorage.setItem("ip", ip);
      } else {
        setConnectionStatus("failed");
      }
    } catch {
      setConnectionStatus("failed");
    }
  };

  const discoverNetwork = async () => {
    setDiscovering(true);
    setDiscoveredNodes([]);
    setDiscoverDone(false);
    const ip = getActiveIP();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`http://${ip}/discover`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        
        const flat: FlatNode[] = [];
        for (const root of (json.nodes || [])) {
          flat.push({ id: root.id, parent: "Хаб" });
          if (root.children) {
            for (const child of root.children) {
              flat.push({ id: child.id, parent: `#${root.id}` });
            }
          }
        }
        setDiscoveredNodes(flat);
      }
    } catch (e) {
      console.error("Discover failed:", e);
    }
    setDiscovering(false);
    setDiscoverDone(true);
  };

  const registerSensors = async () => {
    setRegistering(true);
    setRegisterResult(null);
    setRegisterTimer(10);
    const ip = getActiveIP();

    
    timerRef.current = setInterval(() => {
      setRegisterTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`http://${ip}/register`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        setRegisterResult({ registered: json.registered, nextID: json.nextID });
      }
    } catch (e) {
      console.error("Register failed:", e);
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRegisterTimer(0);
    setRegistering(false);
  };

  const verifySetup = async () => {
    setVerifying(true);
    setVerifyData(null);
    setVerifyError(null);
    const ip = getActiveIP();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`http://${ip}/getdata`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        setVerifyData(json);
      } else {
        const json = await res.json().catch(() => null);
        setVerifyError(json?.error || "Не вдалося отримати дані");
      }
    } catch {
      setVerifyError("Таймаут або немає з'єднання");
    }
    setVerifying(false);
  };

  

  const nextStep = () => setStep((p) => Math.min(p + 1, totalSteps - 1));
  const prevStep = () => {
    if (step === 0) {
      setConnectionStatus("idle");
      setConnectionMode(null);
      setHubInfo(null);
    }
    setStep((p) => Math.max(p - 1, 0));
  };

  const canNext = (): boolean => {
    if (step === 0) return connectionStatus === "connected";
    if (step === 1) return !registering;
    if (step === 2) return discoverDone;
    return true;
  };

  const isValidIP = (ip: string) => {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every(
      (p) => p !== "" && !isNaN(Number(p)) && Number(p) >= 0 && Number(p) <= 255
    );
  };

  const handleFinish = () => {
    const ip = getActiveIP();
    if (ip) localStorage.setItem("ip", ip);
    localStorage.setItem("setup", "true");
    onClose();
  };

  

  const getPosClass = (index: number) => {
    if (index === step) return styles.Center;
    return index < step ? styles.Left : styles.Right;
  };

  const stepsMeta = [
    { icon: <RiWifiFill />, label: "Підключення", color: "#3b82f6" },
    { icon: <RiSensorLine />, label: "Реєстрація", color: "#f59e0b" },
    { icon: <RiSignalTowerFill />, label: "Виявлення", color: "#8b5cf6" },
    { icon: <RiCheckDoubleLine />, label: "Перевірка", color: "#10b981" },
  ];

  const steps = [
    
    <div key={0} className={styles.StepInner}>
      <div className={styles.StepHeader}>
        <div className={styles.StepIconBadge} style={{ background: "#3b82f6" }}>
          <RiRouterLine />
        </div>
        <div>
          <div className={styles.StepTitle}>Підключення до хабу</div>
          <div className={styles.StepDesc}>Оберіть режим та встановіть з'єднання</div>
        </div>
      </div>

      <div className={styles.ModeCards}>
        <button
          className={`${styles.ModeCard} ${connectionMode === "ap" ? styles.ModeCardActive : ""}`}
          onClick={() => {
            setConnectionMode("ap");
            setConnectionStatus("idle");
            setHubInfo(null);
            connectToHub("192.168.4.1");
          }}
          style={{ "--accent": "#8b5cf6" } as React.CSSProperties}
        >
          <div className={styles.ModeCardIcon}>
            <RiRadioButtonLine />
          </div>
          <div className={styles.ModeCardLabel}>Режим AP</div>
          <div className={styles.ModeCardDesc}>Пряме підключення</div>
        </button>

        <button
          className={`${styles.ModeCard} ${connectionMode === "wifi" ? styles.ModeCardActive : ""}`}
          onClick={() => {
            setConnectionMode("wifi");
            setConnectionStatus("idle");
            setHubInfo(null);
          }}
          style={{ "--accent": "#3b82f6" } as React.CSSProperties}
        >
          <div className={styles.ModeCardIcon}>
            <RiGlobalLine />
          </div>
          <div className={styles.ModeCardLabel}>Режим Wi-Fi</div>
          <div className={styles.ModeCardDesc}>Через роутер</div>
        </button>
      </div>

      {connectionMode === "wifi" && (
        <div className={styles.InputCard}>
          <div className={styles.InputCardHeader}>
            <RiGlobalLine style={{ color: "#3b82f6" }} />
            <span>IP адреса хабу</span>
          </div>
          <div className={styles.InputRow}>
            <div className={styles.InputWrapper}>
              <span className={styles.InputPrefix}>http://</span>
              <input
                className={styles.Input}
                type="text"
                value={hubIP}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = value.split(".");
                  if (parts.length > 4) return;
                  for (const p of parts) {
                    if (p.length > 3) return;
                    if (Number(p) > 255) return;
                  }
                  setHubIP(parts.join("."));
                }}
                placeholder="192.168.1.13"
                autoFocus
              />
            </div>
            <button
              className={styles.BtnConnect}
              onClick={() => {
                if (!isValidIP(hubIP)) return;
                connectToHub(hubIP);
              }}
              disabled={!isValidIP(hubIP) || connectionStatus === "connecting"}
            >
              {connectionStatus === "connecting" ? (
                <RiLoader4Line className={styles.Spin} />
              ) : (
                <RiFlashlightLine />
              )}
            </button>
          </div>
        </div>
      )}

      {}
      {connectionStatus !== "idle" && (
        <div
          className={`${styles.StatusBanner} ${
            connectionStatus === "connected"
              ? styles.StatusSuccess
              : connectionStatus === "failed"
              ? styles.StatusError
              : styles.StatusLoading
          }`}
        >
          <div className={styles.StatusIcon}>
            {connectionStatus === "connecting" && <RiLoader4Line className={styles.Spin} />}
            {connectionStatus === "connected" && <RiCheckLine />}
            {connectionStatus === "failed" && <RiCloseLine />}
          </div>
          <div className={styles.StatusText}>
            {connectionStatus === "connecting" && "Підключення до хабу..."}
            {connectionStatus === "connected" && (
              <>
                Хаб знайдено
                {hubInfo && (
                  <span className={styles.StatusMeta}>
                    Макс. сенсорів: {hubInfo.MAX_SENSORS} · Зареєстровано: {hubInfo.nodes} · Наступний ID: {hubInfo.nextID}
                  </span>
                )}
              </>
            )}
            {connectionStatus === "failed" && "Не вдалося підключитися. Перевірте IP або мережу."}
          </div>
        </div>
      )}
    </div>,

	    
	    <div key={1} className={styles.StepInner}>
      <div className={styles.StepHeader}>
        <div className={styles.StepIconBadge} style={{ background: "#f59e0b" }}>
          <RiSensorLine />
        </div>
        <div>
          <div className={styles.StepTitle}>Реєстрація сенсорів</div>
          <div className={styles.StepDesc}>Відкрийте вікно реєстрації нових вузлів (10 сек)</div>
        </div>
      </div>

      <div className={styles.RegisterInfo}>
        <div className={styles.RegisterInfoIcon}>💡</div>
        <div className={styles.RegisterInfoText}>
          Увімкніть нові сенсори перед натисканням кнопки. Хаб буде слухати нові пристрої протягом 10 секунд.
        </div>
      </div>

      <button
        className={styles.BtnAction}
        onClick={registerSensors}
        disabled={registering}
        style={{ "--accent": "#f59e0b" } as React.CSSProperties}
      >
        {registering ? (
          <>
            <RiLoader4Line className={styles.Spin} /> Реєстрація... ({registerTimer}с)
          </>
        ) : (
          <>
            <RiPlayFill /> {registerResult ? "Ще раз" : "Почати реєстрацію"}
          </>
        )}
      </button>

      {registering && (
        <div className={styles.TimerBar}>
          <div
            className={styles.TimerProgress}
            style={{ width: `${(registerTimer / 10) * 100}%` }}
          />
        </div>
      )}

      {registerResult && !registering && (
        <div
          className={`${styles.StatusBanner} ${
            registerResult.registered > 0 ? styles.StatusSuccess : styles.StatusNeutral
          }`}
        >
          <div className={styles.StatusIcon}>
            {registerResult.registered > 0 ? <RiCheckLine /> : <RiCloseLine />}
          </div>
          <div className={styles.StatusText}>
            {registerResult.registered > 0
              ? `Зареєстровано ${registerResult.registered} нових сенсорів`
              : "Нових сенсорів не виявлено"}
            <span className={styles.StatusMeta}>Наступний ID: {registerResult.nextID}</span>
          </div>
        </div>
      )}
    </div>,

	    
	    <div key={2} className={styles.StepInner}>
      <div className={styles.StepHeader}>
        <div className={styles.StepIconBadge} style={{ background: "#8b5cf6" }}>
          <RiNodeTree />
        </div>
        <div>
          <div className={styles.StepTitle}>Виявлення мережі</div>
          <div className={styles.StepDesc}>Пошук сенсорів в радіо-мережі</div>
        </div>
      </div>

      <button
        className={styles.BtnAction}
        onClick={discoverNetwork}
        disabled={discovering}
        style={{ "--accent": "#8b5cf6" } as React.CSSProperties}
      >
        {discovering ? (
          <>
            <RiLoader4Line className={styles.Spin} /> Сканування мережі...
          </>
        ) : (
          <>
            <RiSearchLine /> {discoverDone ? "Повторити сканування" : "Запустити сканування"}
          </>
        )}
      </button>

      {discovering && (
        <div className={styles.ScanAnimation}>
          <div className={styles.ScanRing} />
          <div className={styles.ScanRing} style={{ animationDelay: "0.6s" }} />
          <div className={styles.ScanRing} style={{ animationDelay: "1.2s" }} />
          <RiSignalTowerFill className={styles.ScanCenter} />
        </div>
      )}

      {discoverDone && !discovering && (
        <div className={styles.NodesGrid}>
          {discoveredNodes.length === 0 ? (
            <div className={styles.EmptyState}>
              <RiWifiOffLine className={styles.EmptyIcon} />
              <div className={styles.EmptyTitle}>Сенсори не знайдені</div>
              <div className={styles.EmptyDesc}>
                Переконайтесь, що сенсори увімкнені та в зоні досяжності
              </div>
            </div>
          ) : (
            <>
              <div className={styles.NodesCount}>
                Знайдено вузлів: <strong>{discoveredNodes.length}</strong>
              </div>
              {discoveredNodes.map((node, i) => (
                <div
                  key={node.id}
                  className={styles.NodeCard}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className={styles.NodeCardIcon}>
                    <RiSensorLine />
                  </div>
                  <div className={styles.NodeCardInfo}>
                    <div className={styles.NodeCardId}>Вузол #{node.id}</div>
                    <div className={styles.NodeCardMeta}>
                      Батько: {node.parent}
                    </div>
                  </div>
                  <div className={styles.NodeCardDot} />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>,

	    
	    <div key={3} className={styles.StepInner}>
      <div className={styles.StepHeader}>
        <div className={styles.StepIconBadge} style={{ background: "#10b981" }}>
          <RiCheckDoubleLine />
        </div>
        <div>
          <div className={styles.StepTitle}>Перевірка системи</div>
          <div className={styles.StepDesc}>Тестове зчитування даних з мережі</div>
        </div>
      </div>

      <button
        className={styles.BtnAction}
        onClick={verifySetup}
        disabled={verifying}
        style={{ "--accent": "#10b981" } as React.CSSProperties}
      >
        {verifying ? (
          <>
            <RiLoader4Line className={styles.Spin} /> Зчитування даних...
          </>
        ) : (
          <>
            <RiRefreshLine /> {verifyData ? "Повторити тест" : "Запустити тест"}
          </>
        )}
      </button>

      {verifying && (
        <div className={styles.VerifySteps}>
          <div className={styles.VerifyStep}>
            <RiLoader4Line className={styles.Spin} />
            <span>Виявлення мережі...</span>
          </div>
          <div className={`${styles.VerifyStep} ${styles.VerifyStepPending}`}>
            <RiLoader4Line />
            <span>Зчитування сенсорів...</span>
          </div>
          <div className={`${styles.VerifyStep} ${styles.VerifyStepPending}`}>
            <RiLoader4Line />
            <span>Формування звіту...</span>
          </div>
        </div>
      )}

      {verifyError && !verifying && (
        <div className={`${styles.StatusBanner} ${styles.StatusError}`}>
          <div className={styles.StatusIcon}>
            <RiCloseLine />
          </div>
          <div className={styles.StatusText}>{verifyError}</div>
        </div>
      )}

      {verifyData && !verifying && (
        <div className={styles.VerifyResults}>
          <div className={styles.VerifyGrid}>
            {[
              { label: "Сенсорів", value: verifyData.count || 0, color: "#3b82f6" },
              { label: "Наст. ID", value: verifyData.nextID || "—", color: "#f59e0b" },
            ].map((item, i) => (
              <div key={i} className={styles.VerifyCard}>
                <div className={styles.VerifyCardValue} style={{ color: item.color }}>
                  {item.value}
                </div>
                <div className={styles.VerifyCardLabel}>{item.label}</div>
              </div>
            ))}
          </div>

          {verifyData.data && verifyData.data.length > 0 && (
            <div className={styles.DataPreview}>
              <div className={styles.DataPreviewTitle}>Отримані дані</div>
              <div className={styles.DataList}>
                {verifyData.data.slice(0, 6).map((d: any, i: number) => {
                  
                  const vBatVolts = Number(d.Vbat) / 100;
                  const batteryPercent = Math.min(100, Math.max(0, Math.round(((vBatVolts - 3.0) / (4.2 - 3.0)) * 100)));
                  const soilPercent = Math.min(100, Math.max(0, Math.round(((1023 - Number(d.soilHumidity)) / 1023) * 100)));
                  const temp = d.dsTemperature || d.bmpTemperature || 0;
	        {}
                  return (
                    <div key={i} className={styles.DataRow}>
                      <div className={styles.DataRowMain}>
                        <span className={styles.DataRowId}>Вузол #{d.ID}</span>
                      </div>
                      <div className={styles.DataRowValues}>
                        <div className={styles.DataValueItem}>
                          <span className={styles.DataIcon}>🌡️</span>
                          <span className={styles.DataValueText}>
                            {Number(temp).toFixed(1)}°C
                          </span>
                        </div>
                        <div className={styles.DataValueItem}>
                          <span className={styles.DataIcon}>💧</span>
                          <span className={styles.DataValueText}>{soilPercent}%</span>
                        </div>
                        <div className={styles.DataValueItem}>
                          <span className={styles.DataIcon}>🔋</span>
                          <span className={styles.DataValueText}>{batteryPercent}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
	        {}
          <div className={`${styles.StatusBanner} ${styles.StatusSuccess}`}>
            <div className={styles.StatusIcon}>
              <RiCheckLine />
            </div>
            <div className={styles.StatusText}>Система працює коректно!</div>
          </div>
        </div>
      )}
    </div>,
  ];

  return (
    <div className={styles.Backdrop}>
      <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
        {}
        <div className={styles.Header}>
          <div className={styles.HeaderLeft}>
            <div className={styles.HeaderLogo}>
              <RiRouterLine />
            </div>
            <div>
              <div className={styles.HeaderTitle}>Налаштування Horizon</div>
              <div className={styles.HeaderDesc}>Крок {step + 1} з {totalSteps}</div>
            </div>
          </div>
        </div>

        {}
        <div className={styles.StepIndicators}>
          {stepsMeta.map((s, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div
                className={`${styles.StepDot} ${
                  i === step ? styles.StepDotActive : i < step ? styles.StepDotDone : ""
                }`}
                style={{ "--dot-color": s.color } as React.CSSProperties}
              >
                <div className={styles.StepDotIcon}>{s.icon}</div>
                <div className={styles.StepDotLabel}>{s.label}</div>
              </div>
              {i < totalSteps - 1 && (
                <div className={`${styles.StepConnector} ${i < step ? styles.StepConnectorDone : ""}`} />
              )}
            </div>
          ))}
        </div>

        {}
        <div className={styles.Viewport}>
          {steps.map((content, idx) => (
            <div key={idx} className={`${styles.Slide} ${getPosClass(idx)}`}>
              {content}
            </div>
          ))}
        </div>

        {}
        <div className={styles.Footer}>
          <button
            className={`${styles.BtnSecondary} ${step > 0 ? styles.BtnVisible : ""}`}
            onClick={prevStep}
          >
            <RiArrowLeftLine /> Назад
          </button>

          <div className={styles.FooterDots}>
            {stepsMeta.map((_, i) => (
              <div
                key={i}
                className={`${styles.Dot} ${i === step ? styles.DotActive : i < step ? styles.DotDone : ""}`}
              />
            ))}
          </div>

          {step < totalSteps - 1 ? (
            <button
              className={styles.BtnPrimary}
              onClick={nextStep}
              disabled={!canNext()}
            >
              Далі <RiArrowRightLine />
            </button>
          ) : (
            <button className={styles.BtnFinish} onClick={handleFinish}>
              <RiCheckDoubleLine /> Завершити
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setup;
