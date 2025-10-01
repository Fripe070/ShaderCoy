import type { ShaderCode } from "@/ancient_scripts/gl/shader";
import defaultFragSource from "@/assets/shaders/defaultFrag.glsl?raw";
import defaultVertSource from "@/assets/shaders/defaultVert.glsl?raw";
import type { Canvas3D } from "@/components/viewport/canvas/Canvas3D";
import type { EditorView } from "codemirror";
import { atom } from "nanostores";

const appState = {
    canvas3D: null as Canvas3D | null,
    textures: [] as WebGLTexture[],

    editorViews: {} as Record<string, EditorView>,
    $shaderCode: atom<ShaderCode>({
        vertex: defaultVertSource,
        fragment: defaultFragSource,
    }),
};
export default appState;
