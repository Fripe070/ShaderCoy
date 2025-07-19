import complexCube from "../../../test/cube_complex_tris.obj";
import type { WebGLCtx } from "../rendering/OpenGLCanvas";
import { parseObj } from "./parsers/obj";

export type MeshVertex = {
    position: [number, number, number];
    normal: [number, number, number];
    texCoords: [number, number, number];
};
export const meshVertexSchema: Record<keyof MeshVertex, number> = {
    position: 3,
    normal: 3,
    texCoords: 3,
} as const;
export const meshVertexSize = Object.values(meshVertexSchema).reduce((sum, n) => sum + n, 0);

export type Mesh = {
    vertices: MeshVertex[];
    indices: number[];
};
export type FlatMesh = {
    vertexData: Float32Array;
    indices: Uint16Array;
};
export function flattenMesh(mesh: Mesh): FlatMesh {
    const meshVertexKeys = Object.keys(meshVertexSchema) as (keyof MeshVertex)[];
    return {
        indices: new Uint16Array(mesh.indices),
        vertexData: new Float32Array(
            mesh.vertices.flatMap((v) => meshVertexKeys.flatMap((k) => v[k])),
        ),
    };
}

export type MeshBuffers = {
    mesh: Mesh;
    vertexBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;
};

export function initMeshBuffers(gl: WebGLCtx, mesh: Mesh): MeshBuffers {
    const flatMesh = flattenMesh(mesh);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatMesh.vertexData, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, flatMesh.indices, gl.STATIC_DRAW);

    return {
        mesh: mesh,
        vertexBuffer: vertexBuffer,
        indexBuffer: indexBuffer,
    };
}

export const cubeMesh: Mesh = parseObj(complexCube)[0];
