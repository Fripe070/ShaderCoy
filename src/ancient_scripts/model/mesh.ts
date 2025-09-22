import type { WebGLCtx } from "../rendering/OpenGLCanvas";
import type { NSizeVec } from "@/scripts/util/types";

// prettier-ignore
export const VERTEX_SCHEMA = {
    position:   { size: 3, attribute: "a_position" },
    normal:     { size: 3, attribute: "a_normal" },
    texCoords:  { size: 3, attribute: "a_texCoord" },
} as const;
/// The total number of floating point values stored per vertex
export const VERTEX_FLOAT_COUNT: number = Object.values(VERTEX_SCHEMA).reduce(
    (sum, attr) => sum + attr.size,
    0,
);

export type MeshVertex = {
    [K in keyof typeof VERTEX_SCHEMA]: NSizeVec<(typeof VERTEX_SCHEMA)[K]["size"]>;
};

export interface Mesh {
    vertices: MeshVertex[];
    indices: number[];
}
export interface MeshBuffers {
    vertexBuffer: WebGLBuffer;
    vertexCount: number;
    indexBuffer: WebGLBuffer;
    indexCount: number;
}

export function loadMeshBuffers(gl: WebGLCtx, mesh: Mesh): MeshBuffers {
    const vertexAttrs = Object.keys(VERTEX_SCHEMA) as (keyof MeshVertex)[];
    const interlacedVertexData = mesh.vertices.flatMap((vertex) =>
        vertexAttrs.flatMap((attr) => vertex[attr]),
    );
    const interlaced = {
        vertexData: new Float32Array(interlacedVertexData),
        indices: new Uint16Array(mesh.indices),
    };

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, interlaced.vertexData, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, interlaced.indices, gl.STATIC_DRAW);

    return {
        vertexBuffer,
        vertexCount: mesh.vertices.length,
        indexBuffer,
        indexCount: mesh.indices.length,
    };
}
