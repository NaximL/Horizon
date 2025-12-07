export type NodePoint = {
  isHub: boolean,
  ID: string;
  bmpTemperature: string;
  bmpPressure: string;
  soilHumidity: number;
  dsTemperature: string;
  x: number;
  y: number;
  z: number;
  status: number
};

type Props = {
  SERVER_URL: string;
  setLoad?: any;
  setConection?: any;
  comp?: boolean;
}

const P: NodePoint[] = [
  {
    "isHub": false,
    "ID": "2",
    "bmpTemperature": "0",
    "bmpPressure": "0",
    "soilHumidity": 1023,
    "dsTemperature": "24.75",
    "x": 20,
    "y": 5,
    "z": 20,
    "status": 0
  },
  {
    "isHub": false,
    "ID": "1",
    "bmpTemperature": "0",
    "bmpPressure": "0",
    "soilHumidity": 1023,
    "dsTemperature": "24.75",
    "x": -30,
    "y": 0,
    "z": 2,
    "status": 0
  }
]
export async function fetchData(SERVER_URL: string, endpoint: string) {
  const res = await fetch(`http://${SERVER_URL}/${endpoint}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Помилка при запиті на:${endpoint}`);
  }
  return data;
  return
}
export async function generateNodes({ SERVER_URL, setLoad, setConection, comp }: Props): Promise<NodePoint[]> {
  let d: NodePoint[] = [{
    isHub: true,
    ID: '0',
    bmpTemperature: '',
    soilHumidity: 0,
    bmpPressure: '994.4',
    dsTemperature: '',
    x: 0,
    y: 0,
    z: 0,
    status: 0
  }];

  try {
    const nodes = await fetchData(SERVER_URL, "getdata");
    // const nodes = { data: P };
    // if (comp) {
    //   d[0].bmpPressure = nodes[0]?.bmpPressure
    // }
    const hubPressure = parseFloat(d[0].bmpPressure);

    const sensitivityMultiplier = 8.43;

    d = d.concat(nodes.data.map((n: any, i: number) => {
      const nodePressure = parseFloat(n.bmpPressure);
      const height = (hubPressure - nodePressure) * sensitivityMultiplier;
      return {
        isHub: false,
        ID: n.ID.toString(),
        bmpTemperature: n.bmpTemperature.toString(),
        bmpPressure: n.bmpPressure.toString(),
        soilHumidity: Number(n.soilHumidity),
        dsTemperature: n.dsTemperature.toString(),
        x: n.x,
        y: n.y,
        z: n.z,
        status: Number(n.status)
      };
    }));
  } catch (e) {
    console.error("Ошибка при получении данных:", e);
  } finally {
    setConection(true);
    setLoad && setLoad(false);
  }

  return d;
}