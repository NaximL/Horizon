const USE_VIRTUAL_DATA = false;










export type NodePoint = {
  isHub: boolean;
  ID: string;
  bmpTemperature: string;
  bmpPressure: string;
  soilHumidity: number;
  dsTemperature: string;
  parentID?: string;
  Vbat: number;
  x: number;
  y: number;
  z: number;
  realLat: number;
  realLng: number;
  gpsSats: number;
  status: number;
};

type Props = {
  SERVER_URL: string;
  setLoad?: (v: boolean) => void;
  setConection?: (v: boolean) => void;
  comp?: boolean;
  onProgress?: (loaded: number, total: number) => void;
};

export async function fetchData(SERVER_URL: string, endpoint: string) {
  const res = await fetch(`http://${SERVER_URL}/${endpoint}?t=${Date.now()}`, {
    method: "GET",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Помилка при запиті на: ${endpoint}`);
  }
  return data;
}

const HUB_LAT = 49.579333;
const HUB_LNG = 34.518139;

const MAX_ADAPTIVE_SCALE = 5000000;
const FALLBACK_SCALE = 100000;


const VIRTUAL_RESPONSE = {
  count: 4,
  nextID: 7,
  data: [
    {
      ID: 1,
      bmpTemperature: 0,
      bmpPressure: 994.5,
      soilHumidity: 1023,
      dsTemperature: 24.25,
      Vbat: 473,
      x: 49.57931,
      y: 34.51814,
      z: 12,
      status: 0,
      parentID: 0,
    },
    {
      ID: 3,
      bmpTemperature: 0,
      bmpPressure: 994.2,
      soilHumidity: 850,
      dsTemperature: 24.5,
      Vbat: 389,
      x: 49.57931,
      y: 34.51819,
      z: 12,
      status: 0,
      parentID: 0,
    },
    {
      ID: 5,
      bmpTemperature: 0,
      bmpPressure: 994.7,
      soilHumidity: 450,
      dsTemperature: 23.8,
      Vbat: 410,
      x: 49.57935,
      y: 34.51825,
      z: 12,
      status: 0,
      parentID: 0,
    },
    {
      ID: 6,
      bmpTemperature: 0,
      bmpPressure: 994.1,
      soilHumidity: 890,
      dsTemperature: 25.1,
      Vbat: 395,
      x: 49.57928,
      y: 34.51805,
      z: 12,
      status: 0,
      parentID: 1,
    },
  ],
};

export async function generateNodes({
  SERVER_URL,
  setLoad,
  setConection,
  onProgress,
}: Props): Promise<NodePoint[]> {

  let d: NodePoint[] = [
    {
      isHub: true,
      ID: "0",
      bmpTemperature: "",
      soilHumidity: 0,
      bmpPressure: "994.4",
      dsTemperature: "",
      x: 0,
      y: 0,
      z: 0,
      realLat: HUB_LAT,
      gpsSats: 0,
      realLng: HUB_LNG,
      Vbat: 3.3,
      status: 0,
    },
  ];

  try {
    onProgress?.(-1, 0);

    const nodes = USE_VIRTUAL_DATA ? VIRTUAL_RESPONSE : await fetchData(SERVER_URL, "getdata");

    if (USE_VIRTUAL_DATA) console.log("Using Virtual Data Mode");
    console.log("Nodes response:", nodes);

    const list: any[] = nodes.data ?? [];
    const total = list.length;


    const rawCache = localStorage.getItem("horizon_last_known_gps");
    let gpsCache: Record<string, { lat: number; lng: number }> = {};
    if (rawCache) {
      try {
        gpsCache = JSON.parse(rawCache);
      } catch (e) {
        gpsCache = {};
      }
    }

    const resolvedList = list.map(n => {
      const lat = Number(n.x);
      const lng = Number(n.y);
      const isGpsError = !n.isHub && (!!(Number(n.status) & (1 << 4)) || !!(Number(n.status) & (1 << 5)));
      const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && !isGpsError;

      let finalLat = lat;
      let finalLng = lng;

      if (!hasValidCoords) {
        const cached = gpsCache[String(n.ID)];
        if (cached) {
          finalLat = cached.lat;
          finalLng = cached.lng;
        } else {
          finalLat = HUB_LAT;
          finalLng = HUB_LNG;
        }
      } else {
        gpsCache[String(n.ID)] = { lat, lng };
      }

      return {
        ...n,
        resolvedLat: finalLat,
        resolvedLng: finalLng
      };
    });


    localStorage.setItem("horizon_last_known_gps", JSON.stringify(gpsCache));

    const BASE_RADIUS = 30;
    const GROWTH_FACTOR = 25;

    let maxOffset = 0;
    resolvedList.forEach((n) => {
      const dx = Math.abs(n.resolvedLat - HUB_LAT);
      const dy = Math.abs(n.resolvedLng - HUB_LNG);
      if (dx > maxOffset) maxOffset = dx;
      if (dy > maxOffset) maxOffset = dy;
    });

    const dynamicTargetRadius = BASE_RADIUS + Math.log10(maxOffset * 100000 + 1) * GROWTH_FACTOR;

    let adaptiveScale = maxOffset > 0 ? dynamicTargetRadius / maxOffset : FALLBACK_SCALE;

    if (adaptiveScale > MAX_ADAPTIVE_SCALE) adaptiveScale = MAX_ADAPTIVE_SCALE;

    onProgress?.(0, total);

    const hubPressure = parseFloat(d[0].bmpPressure);
    const sensitivityMultiplier = 8.43;
    const mapped: NodePoint[] = [];

    for (let i = 0; i < resolvedList.length; i++) {
      const n = resolvedList[i];
      const nodePressure = parseFloat(n.bmpPressure);

      const pressureHeight =
        !isNaN(nodePressure) && nodePressure > 0
          ? (hubPressure - nodePressure) * sensitivityMultiplier
          : null;

      const parentID =
        n.parentID !== undefined && n.parentID !== null
          ? String(n.parentID)
          : undefined;

      mapped.push({
        isHub: false,
        ID: String(n.ID),
        bmpTemperature: String(n.bmpTemperature ?? 0),
        bmpPressure: String(n.bmpPressure ?? 0),
        soilHumidity: Number(n.soilHumidity),
        dsTemperature: String(n.dsTemperature ?? 0),
        parentID,

        x: (n.resolvedLat - HUB_LAT) * adaptiveScale,
        y: pressureHeight !== null ? pressureHeight : 0,
        z: (n.resolvedLng - HUB_LNG) * adaptiveScale,

        realLat: n.resolvedLat,
        realLng: n.resolvedLng,
        gpsSats: n.gpsSats !== undefined && n.gpsSats !== null && !isNaN(Number(n.gpsSats)) ? Number(n.gpsSats) : 7, 
        Vbat: Number(n.Vbat) / 100 > 4.2 ? 4.2 : Number(n.Vbat) / 100,
        status: Number(n.status),

      });

      onProgress?.(i + 1, total);
      await new Promise((r) => setTimeout(r, 100));
    }

    d = d.concat(mapped);

  } catch (e) {
    console.error("generateNodes error:", e);
    onProgress?.(0, 0);
  } finally {
    setConection?.(true);
    setLoad?.(false);
  }

  return d;
}
