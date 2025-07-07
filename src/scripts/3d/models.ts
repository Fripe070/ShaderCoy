import type { WebGLCtx } from "../rendering/OpenGLCanvas";

export type Mesh = {
    position: Float32Array;
    indices: Uint32Array;
};

type BufferAndData<T> = {
    buffer: WebGLBuffer;
    data: T;
};

export type MeshBuffers = {
    [key in keyof Mesh]: BufferAndData<Mesh[key]>;
} & {
    mesh: Mesh;
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
        position: {
            buffer: positionBuffer,
            data: mesh.position,
        },
        indices: { buffer: indexBuffer, data: mesh.indices },
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
        // Front face
        -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,  1.0,
        // Back face
        -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0, -1.0,
        // Top face
        -1.0,  1.0, -1.0, -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
        // Right face
         1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,
        // Left face
        -1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0,
    ]),
    indices: new Uint32Array([
        0,  1,  2,   0,  2,  3,    // front
        4,  5,  6,   4,  6,  7,    // back
        8,  9,  10,  8,  10, 11,   // top
        12, 13, 14,  12, 14, 15,   // bottom
        16, 17, 18,  16, 18, 19,   // right
        20, 21, 22,  20, 22, 23,   // left
    ]),
};
