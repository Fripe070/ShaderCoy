import type { WebGLCtx } from "../rendering/OpenGLCanvas";

export type Mesh = {
    position: Float32Array;
    indices: Uint32Array;
};

export type MeshBuffers<T extends Mesh = Mesh> = {
    mesh: T;
    buffers: { [key in keyof T]: WebGLBuffer };
};

export function initMeshBuffers(gl: WebGLCtx, mesh: Mesh): MeshBuffers {
    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) throw new Error("Failed to create position buffer");
    const indexBuffer = gl.createBuffer();
    if (!indexBuffer) throw new Error("Failed to create index buffer");

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.position, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    return {
        mesh: mesh,
        buffers: {
            position: positionBuffer,
            indices: indexBuffer,
        },
    };
}

// prettier-ignore
export const planeMesh: Mesh = {
    position: new Float32Array([
         1.0, 0.0,  1.0,
        -1.0, 0.0,  1.0,
         1.0, 0.0, -1.0,
        -1.0, 0.0, -1.0,
    ]),
    indices: new Uint32Array([
        0,  1,  2,   
        0,  2,  3,
    ]),
};

// prettier-ignore
export const cubeMesh: Mesh = {
    position: new Float32Array([
        -1, -1, -1,
        1, -1, -1,
        1, 1, -1,
        -1, 1, -1,
        -1, -1, 1,
        1, -1, 1,
        1, 1, 1,
        -1, 1, 1,
    ]),
    indices: new Uint32Array([
        0, 1, 3, 3, 1, 2,
        1, 5, 2, 2, 5, 6,
        5, 4, 6, 6, 4, 7,
        4, 0, 7, 7, 0, 3,
        3, 2, 7, 7, 2, 6,
        4, 5, 0, 0, 5, 1
    ]),
};
