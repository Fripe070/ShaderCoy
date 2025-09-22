import type { EditorView } from "codemirror";
import type { Canvas3D } from "@/components/viewport/canvas/Canvas3D";

const appState = {
    canvas3D: null as Canvas3D | null,
    textures: [] as WebGLTexture[],

    editorViews: {} as Record<string, EditorView>,
};
export default appState;
