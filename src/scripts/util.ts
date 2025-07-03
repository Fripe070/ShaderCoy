import type { GlCanvas } from "../components/GLCanvasScript";

export function getMainCanvas(): GlCanvas {
    return document.getElementById("mainCanvas")! as GlCanvas;
}
