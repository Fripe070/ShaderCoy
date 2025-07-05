import type { GlCanvas } from "../components/GLCanvasScript";

export function getMainCanvas(): GlCanvas {
    return document.getElementById("main-canvas")! as GlCanvas;
}
