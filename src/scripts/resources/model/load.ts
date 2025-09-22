import { mat3, mat4, vec3 } from "gl-matrix";
import { Mesh } from "./datatypes";
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

// TODO: Perform in web worker
export function loadMeshes(assimp: AssimpTSModule, files: AssimpTSFile[]): Mesh[] {
    const flags: number = assimp.PostProcessFlags.targetRealtime_MaxQuality.value;
    // | assimp.PostProcessFlags.preTransformVertices.value;
    return assimp
        .processFiles(files, "assjson", flags)
        .map((file) => {
            const decoder = new TextDecoder("utf-8");
            const json = JSON.parse(decoder.decode(file));
            return assjsonToMesh(json);
        })
        .flat();
}

interface AssimpModel {
    rootnode: AssimpNode;
    meshes: AssimpMesh[];
}

interface AssimpNode {
    name?: string;
    transformation: mat4;
    children?: AssimpNode[];
    meshes?: number[];
}

interface AssimpMesh {
    name?: string;
    vertices: number[];
    faces?: number[][];
    normals?: number[];
    numuvcomponents?: number[];
    texturecoords?: number[][];
}

function convertAssimpMesh(mesh: AssimpMesh, transform: mat4): Mesh {
    const result = new Mesh();
    const meshName: string = mesh.name ?? "<unnamed>";

    // Sanity checks
    if (mesh.vertices.length % 3 !== 0)
        throw new Error(
            `Invalid vertex data for mesh ${meshName}. Only triangulated meshes are supported.`,
        );
    if (mesh.normals && mesh.normals.length !== mesh.vertices.length)
        throw new Error(
            `Mismatched normal data for mesh ${meshName}. Only meshes with per-vertex normals are supported.`,
        );
    if ((mesh.texturecoords?.length ?? 0) > 1)
        console.warn(
            `Mesh ${meshName} has multiple texture coordinate sets. Only the first set will be used.`,
        );

    const texCoordSize = mesh.numuvcomponents?.[0] ?? 2;
    if (texCoordSize < 1 || texCoordSize > 3)
        throw new Error("Unsupported texture coordinate size: " + texCoordSize);

    const vertexCount = mesh.vertices.length / 3;

    // Normal vector should not be transformed, only rotated and scaled
    const normalMatrix = mat3.create();
    const tempMat = mat4.clone(transform);
    mat4.invert(tempMat, tempMat);
    mat4.transpose(tempMat, tempMat);
    mat3.fromMat4(normalMatrix, tempMat);

    for (let vertIndex = 0; vertIndex < vertexCount; vertIndex++) {
        const position: [number, number, number] = [
            mesh.vertices[vertIndex * 3]!,
            mesh.vertices[vertIndex * 3 + 1]!,
            mesh.vertices[vertIndex * 3 + 2]!,
        ];
        vec3.transformMat4(position, position, transform);

        let normal: [number, number, number] = [0, 1, 0];
        if (mesh.normals) {
            normal = [
                mesh.normals[vertIndex * 3]!,
                mesh.normals[vertIndex * 3 + 1]!,
                mesh.normals[vertIndex * 3 + 2]!,
            ];
        }

        vec3.transformMat3(normal, normal, normalMatrix);
        vec3.normalize(normal, normal);

        const texCoords: [number, number, number] = [0, 0, 0];
        if (mesh.texturecoords?.[0]) {
            for (let offset = 0; offset < texCoordSize; offset++) {
                texCoords[offset] = mesh.texturecoords[0][vertIndex * texCoordSize + offset]!;
            }
        }
        result.vertices.push({
            position,
            normal,
            texCoords,
        });
    }
    mesh.faces?.forEach((face) => {
        face.forEach((index) => {
            if (index < 0 || index >= vertexCount)
                throw new Error(`Invalid face index ${index} for mesh ${meshName}`);
            result.indices.push(index);
        });
    });
    return result;
}

// TODO: Perform in web worker
export function assjsonToMesh(assjson: AssimpModel): Mesh[] {
    const resultMeshes: Mesh[] = [];
    function processNode(node: AssimpNode, parentTransform: mat4) {
        const nodeTransform = mat4.multiply(mat4.create(), parentTransform, node.transformation);
        node.meshes?.forEach((meshIndex) => {
            const mesh = assjson.meshes[meshIndex];
            if (!mesh) throw new Error(`Mesh with index ${meshIndex} not found in model`);
            resultMeshes.push(convertAssimpMesh(mesh, nodeTransform));
        });
        node.children?.forEach((child) => processNode(child, nodeTransform));
    }
    processNode(assjson.rootnode, mat4.create());
    return resultMeshes;
}
