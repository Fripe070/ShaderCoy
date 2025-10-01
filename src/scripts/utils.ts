export type WebGLCtx = WebGLRenderingContext | WebGL2RenderingContext;

// prettier-ignore
export type NSizeNumVec<N extends 1 | 2 | 3 | 4> =
    N extends 4 ? [number, number, number, number]
    : N extends 3 ? [number, number, number]
    : N extends 2 ? [number, number]
    : [number];
