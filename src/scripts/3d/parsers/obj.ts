import { vec3 } from "gl-matrix";
import type { Mesh, MeshVertex } from "../models";

type ObjVertData = {
    original: string;
    positionIndex: number;
    texCoordIndex: number | null;
    normalIndex: number | null;
};
type ObjData = {
    positions: [number, number, number][];
    texCoords: [number, number, number][];
    normals: [number, number, number][];
    faces: ObjVertData[][];
};

const TOKENS = {
    object: "o ",
    normal: "vn ",
    vertexPos: "v ",
    texCoord: "vt ",
    face: "f ",
} as const;

function consumeVector(line: string, start: number): number[] {
    return line.slice(start).trim().split(" ").map(Number);
}

function extractObjData(content: string): ObjData[] {
    const objects: ObjData[] = [
        {
            positions: [],
            texCoords: [],
            normals: [],
            faces: [],
        },
    ];

    const lines = content.split("\n");
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex].trimStart();

        if (line.startsWith(TOKENS.object)) {
            if (objects[0].positions.length === 0) objects.shift();
            objects.push({
                positions: [],
                texCoords: [],
                normals: [],
                faces: [],
            });
            continue;
        }

        if (line.startsWith(TOKENS.vertexPos)) {
            const values = consumeVector(line, TOKENS.vertexPos.length);
            objects[objects.length - 1].positions.push([values[0], values[1], values[2]]);
            continue;
        }
        if (line.startsWith(TOKENS.texCoord)) {
            const values = consumeVector(line, TOKENS.texCoord.length);
            objects[objects.length - 1].texCoords.push([values[0], values[1], values[2] ?? 0]);
            continue;
        }
        if (line.startsWith(TOKENS.normal)) {
            const values = consumeVector(line, TOKENS.normal.length);
            objects[objects.length - 1].normals.push([values[0], values[1], values[2]]);
            continue;
        }

        if (line.startsWith(TOKENS.face)) {
            const face: number[][] = line
                .slice(TOKENS.face.length)
                .trim()
                .split(" ")
                .map((vert) => vert.split("/"))
                .map((parts) => parts.map((part) => parseFloat(part) - 1)); // -1 for zero-based index
            console.assert(face.length >= 3, "Face must consist of at least 3 vertices");
            console.assert(
                face.every(
                    (vertex, index) => vertex.length === face[Math.max(0, index - 1)].length,
                ),
                "All vertices in a face must have the same number of components",
            );
            objects[objects.length - 1].faces.push(
                face.map((vertex) => ({
                    original: line + ` (${vertex.map((v) => v + 1).join("/")})`,
                    positionIndex: vertex[0],
                    texCoordIndex: vertex[1] ?? null,
                    normalIndex: vertex[2] ?? null,
                })),
            );

            continue;
        }
    }
    return objects;
}

function fanTriangulate(face: ObjVertData[]): ObjVertData[][] {
    const triangles: ObjVertData[][] = [];
    const vertA = face[0];
    let vertB = face[1];
    for (let i = 2; i < face.length; i++) {
        const vertC = face[i];
        triangles.push([vertA, vertB, vertC]);
        vertB = vertC;
    }
    return triangles;
}

function triangulateFaces(faces: ObjVertData[][]): ObjVertData[][] {
    const triangles: ObjVertData[][] = [];
    faces.forEach((face: ObjVertData[]) => {
        console.assert(face.length >= 3, "Face must consist of at least 3 vertices");
        if (face.length === 3) {
            triangles.push(face);
            return;
        }
        triangles.push(...fanTriangulate(face));
    });
    console.assert(
        triangles.every((triangle) => triangle.length === 3),
        "All triangles must have 3 vertices",
    );
    return triangles;
}

function modPositive(x: number, n: number): number {
    return ((x % n) + n) % n;
}

function objectToMesh(object: ObjData): Mesh {
    const vertices: MeshVertex[] = [];
    const indices: number[] = [];
    const vertexIndexMap = new Map<string, number>();

    const defaultNormal: [number, number, number] = [1, 1, 1];
    vec3.normalize(defaultNormal, defaultNormal);

    object.faces.forEach((face) =>
        face.forEach((vertData) => {
            const position = object.positions[vertData.positionIndex];

            const normal: [number, number, number] =
                vertData.normalIndex !== null
                    ? object.normals[vertData.normalIndex]
                    : defaultNormal;
            const texCoords: [number, number, number] = (
                vertData.texCoordIndex !== null
                    ? object.texCoords[vertData.texCoordIndex]
                    : [0, 0, 0]
            ).map((v) => modPositive(v, 1)) as [number, number, number];

            // Only make new vertices if they aren't already defined in the mesh.
            // If they are we just push their index.
            const key: string = [...position, ...normal, ...texCoords].join(",");
            let vertIndex = vertexIndexMap.get(key);
            if (vertIndex === undefined) {
                vertIndex = vertices.length;
                vertices.push({ position, normal, texCoords });
                vertexIndexMap.set(key, vertIndex);
            }
            indices.push(vertIndex);
        }),
    );

    return {
        vertices: vertices,
        indices: indices,
    };
}

export function parseObj(content: string): Mesh[] {
    const objects = extractObjData(content);
    if (objects.length === 0) {
        console.debug("No objects found in the OBJ file");
        return [];
    }

    objects.forEach((object) => {
        object.faces = triangulateFaces(object.faces);
    });

    const meshes: Mesh[] = objects.map((object) => objectToMesh(object));
    return meshes;
}
