import { parse, type DataType } from "@loaders.gl/core";
import { GLTFLoader, type GLTFWithBuffers } from "@loaders.gl/gltf";

async function loadModel(modelData: DataType | Promise<DataType>): Promise<GLTFWithBuffers> {
    try {
        const model = await parse(modelData, GLTFLoader);
        return model;
    } catch (error) {
        console.error("Error loading model:", error);
        throw error;
    }
}

export const VIEW_QUAD = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];
