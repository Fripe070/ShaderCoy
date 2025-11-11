// prettier-ignore
type NSizeNumVec<N extends 1 | 2 | 3 | 4> =
    N extends 4 ? [number, number, number, number]
    : N extends 3 ? [number, number, number]
    : N extends 2 ? [number, number]
    : [number];

/**
 * Defines the structure of a single vertex in a 3D model.
 * Each key maps to an attribute accessible in the vertex shader.
 */
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
	0
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

/** Loaded mesh data stored in normal memory. */ // is a class so that $state does not track its properties (lag)
export class Mesh {
	constructor(
		public vertices: MeshVertex[],
		public indices: number[]
	) {}
}
