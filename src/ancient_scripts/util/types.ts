// prettier-ignore
export type NSizeVec<N extends 1 | 2 | 3 | 4> =
    N extends 4 ? [number, number, number, number]
    : N extends 3 ? [number, number, number]
    : N extends 2 ? [number, number]
    : [number];
