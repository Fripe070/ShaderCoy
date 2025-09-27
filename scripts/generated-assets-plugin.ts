import { type Plugin } from "vite";
import initAssimp from "assimpts";
import { loadMeshes, stringToAssimpFile } from "../src/scripts/resources/model/load.ts";

const fileRegex = /\.(obj)$/;

export default function objImportPlugin(): Plugin {
    return {
        name: "obj-import-plugin",

        async transform(src: string, id: string) {
            if (!fileRegex.test(id)) return;
            const assimp = await initAssimp();
            const loaded = loadMeshes(assimp, [stringToAssimpFile("model.obj", src)]);
            return {
                code: `export default ${JSON.stringify(loaded)};`,
                map: null,
            };
        },
    };
}
