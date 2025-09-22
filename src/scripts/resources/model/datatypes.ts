/**
 * Defines the structure of a single vertex in a 3D model.
 * Each key maps to an attribute accessible in the vertex shader.
 */

import type { NSizeNumVec, WebGLCtx } from "@/scripts/utils";

// prettier-ignore
export const VERTEX_SCHEMA = {
    position:   { size: 3, attribute: "a_position" },
    normal:     { size: 3, attribute: "a_normal" },
    texCoords:  { size: 3, attribute: "a_texCoord" },
} as const;
/**
 * The total number of values stored per vertex.
 * Multiply by the size of a float to get the byte size.
 */
export const VERTEX_VALUE_COUNT: number = Object.values(VERTEX_SCHEMA).reduce(
    (sum, attr) => sum + attr.size,
    0,
);

/**
 * A single model vertex implementing the vertex schema.
 */
export type MeshVertex = {
    [K in keyof typeof VERTEX_SCHEMA]: NSizeNumVec<(typeof VERTEX_SCHEMA)[K]["size"]>;
};

/** GPU buffers for a mesh. Also stores buffer element counts. */
export interface MeshBuffers {
    vertexBuffer: WebGLBuffer;
    vertexCount: number;
    indexBuffer: WebGLBuffer;
    indexCount: number;
}

/** Loaded mesh data stored in normal memory. */
export class Mesh {
    constructor(
        public vertices: MeshVertex[] = [],
        public indices: number[] = [],
    ) {}

    toBuffers(glCtx: WebGLCtx): MeshBuffers {
        const vertexAttrs = Object.keys(VERTEX_SCHEMA) as (keyof MeshVertex)[];
        const interlacedVertexData = this.vertices.flatMap((vertex) =>
            vertexAttrs.flatMap((attr) => vertex[attr]),
        );

        const vertexBuffer = glCtx.createBuffer();
        glCtx.bindBuffer(glCtx.ARRAY_BUFFER, vertexBuffer);
        glCtx.bufferData(
            glCtx.ARRAY_BUFFER,
            new Float32Array(interlacedVertexData),
            glCtx.STATIC_DRAW,
        );

        const indexBuffer = glCtx.createBuffer();
        glCtx.bindBuffer(glCtx.ELEMENT_ARRAY_BUFFER, indexBuffer);
        glCtx.bufferData(
            glCtx.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(this.indices),
            glCtx.STATIC_DRAW,
        );

        return {
            vertexBuffer,
            vertexCount: this.vertices.length,
            indexBuffer,
            indexCount: this.indices.length,
        };
    }
}
