import testModel1 from "@/assets/models/cube.obj?raw";
import { stringToAssimpFile, loadMeshes } from "@/scripts/resources/model/load";
import initAssimp from "assimpts";
import { expect, test } from "vitest";

test("Assimp cube model loading", async () => {
    const meshes = loadMeshes(await initAssimp(), [stringToAssimpFile("cube.obj", testModel1)]);
    expect(meshes).toHaveLength(1);
    const mesh = meshes[0]!;
    expect(mesh, "There should be a mesh").toBeDefined();
    expect(mesh.vertices, "Cube mesh with per face data should have 6*4 vertices").toHaveLength(24);
    expect(mesh.indices, "Cube mesh with per face data should have 6*2 triangles").toHaveLength(36);
    if (!mesh?.vertices[0]) throw new Error("Mesh or vertex data is missing"); // Make TS happy
    expect(mesh.vertices[0].position, "3D position vector should exist").toHaveLength(3);
    expect(mesh.vertices[0].normal, "3D normal vector should exist").toHaveLength(3);
    expect(mesh.vertices[0].texCoords, "3D texture coordinate vector should exist").toHaveLength(3);
});
