import type { NodePoint } from "./data";


export function getAverageVlag(nodes: NodePoint[]): { percent: string; status: string; color: string } {
    if (nodes.length === 0) return { percent: "0%", status: "Unknown", color: "white" };

    const total = nodes.reduce((sum, node) => sum + node.HumiditySoil, 0);
    const avg = total / nodes.length;
    const percent = Math.round(avg * 100) + "%";

    let status = "";
    let color = "";

    if (avg < 0.3) {
        status = "Занадто сухо";
        color = "red";
    } else if (avg <= 0.7) {
        status = "Вологість в нормі";
        color = "#00ff99";
    } else {
        status = "Вологість зависока";
        color = "yellow";
    }

    return { percent, status, color };
}