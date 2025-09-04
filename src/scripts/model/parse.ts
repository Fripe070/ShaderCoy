import { mat4, vec3 } from "gl-matrix";
import type { Mesh } from "./mesh";

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

export function assjsonToMesh(assjson: AssimpModel): Mesh {
    const resultMesh: Mesh = {
        vertices: [],
        indices: [],
    };

    const nodeStack: [AssimpNode, mat4][] = [[assjson.rootnode, mat4.create()]];
    while (nodeStack.length > 0) {
        const [node, parentTransform] = nodeStack.pop()!;
        node.children?.forEach((child) => {
            return nodeStack.push([
                child,
                mat4.multiply(mat4.create(), parentTransform, node.transformation),
            ]);
        });
        if (!node.meshes) continue;
        node.meshes.forEach((meshIndex) => {
            const mesh = assjson.meshes[meshIndex];
            if (!mesh) throw new Error(`Mesh with index ${meshIndex} not found in model`);

            const meshVertices: [number, number, number][] = [];
            const meshNormals: [number, number, number][] = [];
            const meshTexCoords: [number, number, number][] = [];
            
            const texCoordSize = mesh.numuvcomponents?.[0] ?? 2; // TODO: Support multiple texture coordinate sets?
            if (texCoordSize < 1 || texCoordSize > 3)
                throw new Error("Unsupported texture coordinate size: " + texCoordSize);

            for (let i = 2; i < mesh.vertices.length; i += 3) {
                const position: [number, number, number] = [
                    mesh.vertices[i - 2],
                    mesh.vertices[i - 1],
                    mesh.vertices[i],
                ];
                vec3.transformMat4(position, position, parentTransform);
                meshVertices.push(position);
            }
            for (let i = 2; i < (mesh.normals?.length ?? 0); i += 3) {
                const normal: [number, number, number] = [mesh.normals![i - 2], mesh.normals![i - 1], mesh.normals![i]];
                vec3.transformMat4(normal, normal, parentTransform);
                meshNormals.push(normal);
            }
            for (
                let i = 0;
                i < (mesh.texturecoords?.[0]?.length ?? 0) - texCoordSize;
                i += texCoordSize
            ) {
                const texCoord: [number, number, number] = [0, 0, 0];
                for (let j = 0; j < texCoordSize; j++) {
                    texCoord[j] = mesh.texturecoords![0][i + j];
                }
                meshTexCoords.push(texCoord);
            }

            meshVertices.forEach((position, index) => {
                const normal = meshNormals[index] ?? [0, 0, 0];
                const texCoords = meshTexCoords[index] ?? [0, 0, 0];
                resultMesh.vertices.push({
                    position: position,
                    normal: normal,
                    texCoords: texCoords,
                });
            });

            mesh.faces?.forEach((face) => {
                face.forEach((index) => {
                    if (index < 0 || index >= mesh.vertices.length / 3) {
                        throw new Error(`Invalid face index ${index} for mesh ${mesh.name}`);
                    }
                    resultMesh.indices.push(index);
                });
            });
        });
    }

    return resultMesh;
}