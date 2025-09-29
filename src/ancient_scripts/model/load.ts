import type { Mesh } from "./mesh";
import { assjsonToMesh } from "./parse";
import { type AssimpTSFile, type MainModule as AssimpTSModule } from "assimpts";

export async function fileToAssimpFile(file: File): Promise<AssimpTSFile> {
    const arrayBuffer = await file.arrayBuffer();
    return {
        path: file.name,
        data: new Uint8Array(arrayBuffer),
    };
}
export function stringToAssimpFile(path: string, data: string): AssimpTSFile {
    return {
        path,
        data: new TextEncoder().encode(data),
    };
}

export function loadMeshes(assimp: AssimpTSModule, files: AssimpTSFile[]): Mesh[] {
    const flags: number = assimp.PostProcessFlags.targetRealtime_MaxQuality.value;
    return assimp.processFiles(files, "assjson", flags).map((file) => {
        const decoder = new TextDecoder("utf-8");
        const json = JSON.parse(decoder.decode(file));
        return assjsonToMesh(json);
    });
}
