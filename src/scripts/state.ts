import type { EditorView } from "codemirror";
import type { Canvas3D } from "@/components/viewport/canvas/Canvas3D";
import { atom } from "nanostores";

import defaultVertSource from "@/assets/shaders/defaultVert.glsl?raw";
import defaultFragSource from "@/assets/shaders/defaultFrag.glsl?raw";
import type { ShaderCode } from "@/ancient_scripts/gl/shader";

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
