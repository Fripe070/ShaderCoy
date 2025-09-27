declare module "*.obj" {
    const value: { vertices: MeshVertex[]; indices: number[] }[];
    export default value;
}
