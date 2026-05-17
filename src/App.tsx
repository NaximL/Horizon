import { useEffect, useState } from "react";
import NavBar from "./components/NavBar/NavBar";
import StatsBar from "./components/StatsBar/StatsBar";
import MenuBar from "./components/MenuBar/MenuBar";
import NodeBase from "./components/Maps/3dNodes/NodeBase";
import { generateNodes } from "./utils/data";
import useNodesStore from "./store/NodesStore";
import MapToggle from "./components/MapToggle/MapToggle";
import Maps from "./components/Maps/Maps/Maps";
import Setup from "./components/Setup/Setup";
import LoadBar from "./components/LoadBar/LoadBar";
import RegisterNotifier from "./components/Notific";
import Loader from "./components/Loader/Lodader";


export default function App() {
  const [hubIp, setHubIp] = useState(() => localStorage.getItem("ip") || "192.168.31.12");
  const SERVER_URL = hubIp;

  const [Load, SetLoad] = useState(false);
  const [Setups, SetSetup] = useState(false);
  const [Binding, SetBinding] = useState(false);
  const [Connection, SetConnection] = useState(false);
  const [Sensors, SetSensors] = useState<any[]>([]);
  const [MenuNum, SetMenuNum] = useState<number>(1);
  const [MenuVisible, SetMenuVisible] = useState<boolean>(false);
  const { SetNodes } = useNodesStore();

  const [progress, setProgress] = useState<{ loaded: number; total: number }>({
    loaded: -1,
    total: 0,
  });

  const [mapMode, setMapMode] = useState<"3d" | "google">(() => {
    return (localStorage.getItem("mapMode") as "3d" | "google") || "3d";
  });

  useEffect(() => {
    const applyTheme = () => {
      const saved = localStorage.getItem("theme") || "system";
      if (saved === "system") {
        document.documentElement.removeAttribute("data-theme");
        document.body.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", saved);
        document.body.setAttribute("data-theme", saved);
      }
    };
    applyTheme();
    const interval = setInterval(applyTheme, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNodes = async () => {
    setProgress({ loaded: -1, total: 0 });
    SetLoad(true);

    const nodes = await generateNodes({
      SERVER_URL,
      setLoad: SetLoad,
      setConection: SetConnection,
      onProgress: (loaded, total) => {
        setProgress({ loaded, total });
      },
    });

    SetNodes(nodes);
    SetSensors(nodes);
  };

  useEffect(() => {
    const checkHub = async () => {
      const ip = localStorage.getItem("ip") || SERVER_URL;
      try {
        const res = await fetch(`http://${ip}/login`, { method: "GET" });
        if (res.ok) {
          SetConnection(true);
          fetchNodes();
        } else {
          SetConnection(false);
        }
      } catch (e) {
        SetConnection(false);
        console.error("Hub login check failed:", e);
      }
    };

    if (localStorage.getItem("setup") !== "true") {
      SetSetup(true);
    } else {
      checkHub();
    }
  }, []);

  return (
    <>
      <Setup
        ServerUrl={SERVER_URL}
        visible={Setups}
        onClose={() => {
          localStorage.setItem("setup", "true");
          SetSetup(false);
          const newIp = localStorage.getItem("ip") || SERVER_URL;
          setHubIp(newIp);
          fetchNodes();
        }}
      />



      <NavBar
        MenuNum={MenuNum}
        SetMenuNum={SetMenuNum}
        SetMenuVisible={SetMenuVisible}
        MenuVisible={MenuVisible}
        mapMode={mapMode}
      />

      <MapToggle mode={mapMode} setMode={setMapMode} />

      {Load && (
        <LoadBar loaded={progress.loaded} total={progress.total} />
      )}

      <StatsBar
        Connection={Connection}
        IP={SERVER_URL}
        bind={Binding}
        OnRefresh={fetchNodes}
      />
      
      <RegisterNotifier serverURL={SERVER_URL} />

      {Sensors.length === 0 ? <Loader /> :
        mapMode === "3d" ? (
          <NodeBase nodes={Sensors} />
        ) : (
          <Maps nodes={Sensors} />
        )}

      <MenuBar
        visible={MenuVisible}
        menuNum={MenuNum}
        Bind={Binding}
        Menu={MenuNum}
        SetBinding={SetBinding}
        Connection={Connection}
      />
    </>
  );
}