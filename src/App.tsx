import { useEffect, useState } from "react";
import NavBar from "./components/NavBar/NavBar";
import StatsBar from "./components/StatsBar/StatsBar";
import MenuBar from "./components/MenuBar/MenuBar";
import NodeBase from "./components/NodeBase/NodeBase";
import LoadSpin from "./components/LoadSpin/LoadSpin";
import { generateNodes } from "./utils/data";
import useNodesStore from "./store/NodesStore";

export default function App() {

  const SERVER_URL = "http://192.168.1.12";
  const [Load, SetLoad] = useState(false);
  const [Binding, SetBinding] = useState(false);
  const [Connection, SetConnection] = useState(false);
  const [IP, _SetIP] = useState(SERVER_URL);
  const [Sensors, SetSensors] = useState([]);
  const [MenuNum, SetMenuNum] = useState<number>(1);
  const [MenuVisible, SetMenuVisible] = useState<boolean>(false);
  const { SetNodes } = useNodesStore();


  // useEffect(() => {
  //   if (Binding) {

  //   }
  // }, [Binding]);
  let mounted = true; 
  const fetchNodes = async () => {
    const nodes: any = await generateNodes({
      SERVER_URL,
      setLoad: SetLoad,
      setConection: SetConnection,
      comp: true,
    });
    console.log(nodes)

    if (mounted) {
      SetNodes(nodes);
      SetSensors(nodes);
    }
  };
  useEffect(() => {
    fetchNodes();
    // const interval = setInterval(fetchNodes, 5000);
    return () => {
      mounted = false;
      // clearInterval(interval);
    };
  }, []);

  return (
    <>
      <NavBar
        MenuNum={MenuNum}
        SetMenuNum={SetMenuNum}
        SetMenuVisible={SetMenuVisible}
        MenuVisible={MenuVisible}

      />
      <StatsBar Connection={Connection} IP={IP} bind={Binding} OnRefresh={() => { SetLoad(true); fetchNodes() }} />
      <NodeBase nodes={Sensors} />
      <LoadSpin Load={Load} />
      <MenuBar
        visible={MenuVisible}
        menuNum={MenuNum}
        Bind={Binding}
        Menu={MenuNum}
        SetBinding={SetBinding}
      />
    </>
  );
}