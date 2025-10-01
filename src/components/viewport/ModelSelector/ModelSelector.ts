import cubeModel from "@/assets/models/cube.obj";
import sphereModel from "@/assets/models/sphere.obj";
import suzanneModel from "@/assets/models/suzanne.obj";
import torusModel from "@/assets/models/torus.obj";
import type { Mesh } from "@/scripts/resources/model/datatypes";

// Option 1: Explicit keys with value shape enforcement
export const modelPrimitives = {
    cube: { name: "Cube", meshes: cubeModel, icon: "material-symbols:deployed-code" },
    sphere: { name: "Sphere", meshes: sphereModel, icon: "material-symbols:ev-shadow-outline" },
    torus: { name: "Torus", meshes: torusModel, icon: "material-symbols:donut-small" },
    suzanne: { name: "Suzanne", meshes: suzanneModel, icon: "material-symbols:blender" },
} as const satisfies Record<
    string,
    {
        name: string;
        meshes: Mesh[];
        icon?: string;
    }
>;
