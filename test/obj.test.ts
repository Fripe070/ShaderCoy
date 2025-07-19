import { assert, expect, test } from "vitest";
import { parseObj } from "../src/scripts/3d/parsers/obj";
import simpleCube from "./cube_simple.obj.ts";
import complexCube from "./cube_complex_quads.obj.ts";
import complexTriCube from "./cube_complex_tris.obj.ts";

test("Parse a simple cube", () => {
    const meshes = parseObj(simpleCube);
    expect(meshes).toHaveLength(1);

    expect(meshes[0].vertices).toHaveLength(8);
    expect(
        meshes[0].indices.length / 3,
        "Cube should have 12 triangles (6 faces * 2 triangles per face)",
    ).toBe(12);

    // Make sure the positions are correct
    expect(meshes[0].vertices[0].position).toEqual([-1, 1, -1]);
    expect(meshes[0].vertices[1].position).toEqual([1, 1, 1]);
    expect(meshes[0].vertices[2].position).toEqual([1, 1, -1]);
    expect(meshes[0].vertices[3].position).toEqual([-1, -1, 1]);
    expect(meshes[0].vertices[4].position).toEqual([1, -1, 1]);
    expect(meshes[0].vertices[5].position).toEqual([-1, 1, 1]);
    expect(meshes[0].vertices[6].position).toEqual([-1, -1, -1]);
    expect(meshes[0].vertices[7].position).toEqual([1, -1, -1]);
});

test("Parse a cube with multiple texture coordinates", () => {
    const multipleMeshes = parseObj(complexCube);
    expect(multipleMeshes).toHaveLength(2);
    assert.equal(multipleMeshes[1].vertices.length, 0, "Second dummy object mesh should be empty");

    const quadCube = parseObj(complexCube)[0];
    const triCube = parseObj(complexTriCube)[0];

    assert.sameDeepMembers(
        triCube.vertices,
        quadCube.vertices,
        "Quad cube does not have the same vertices as the tri cube",
    );
    assert.sameMembers(
        triCube.indices.toSorted(),
        quadCube.indices.toSorted(),
        "Quad cube does not have the same indices as the tri cube",
    );

    console.log(quadCube.vertices);
    console.log(quadCube.indices);

    assert.equal(
        quadCube.vertices.length,
        4 * 6,
        "Cube with texture coordinages should have 4 vertices per face",
    );
    assert.equal(
        quadCube.indices.length,
        3 * 2 * 6,
        "Cube with texture coordinates should have 12 triangles (6 faces * 2 triangles per face)",
    );

    assert.isTrue(
        quadCube.vertices.every((vert) => vert.texCoords.every((n) => 0 <= n && n <= 1)),
        "All texture coordinates should be between 0 and 1",
    );
    for (const vert of quadCube.vertices) {
        if (vert.normal.every((n) => n === 0)) continue;
        const normalLength = Math.sqrt(
            vert.normal[0] ** 2 + vert.normal[1] ** 2 + vert.normal[2] ** 2,
        );
        assert.closeTo(normalLength, 1, 0.01, "All normals should be normalized");
    }
});
