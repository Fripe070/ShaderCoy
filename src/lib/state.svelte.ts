import type { Mesh } from "$lib/resources/model/datatypes.js";
import type { MainModule as AssimpTSModule } from "assimpts";

import defaultVertSource from "$lib/shaders//defaultVert.glsl?raw";
import defaultFragSource from "$lib/shaders//defaultFrag.glsl?raw";
import type { CoyErrorLogs } from "./errors.js";
import { deepClone, deepFreeze } from "./utils.svelte.js";
import type { Texture, TextureInstance } from "./resources/texture/datatypes.js";

export interface SaveData {
	viewMode: "2d" | "perspective-orbit" | "orthographic-orbit";
	vertexSource: string;
	fragmentSource: string;
	meshes: Mesh[];
	textures: Texture[];
}
// TODO: Store entire object in localStorage
export interface PersistentData {
	theme: string;
}
export interface EphemeralData {
	errorLogs: CoyErrorLogs;
	textureInstances: TextureInstance[];

	glCtx: WebGL2RenderingContext | null;
	assimpInstance: AssimpTSModule | null;
}

export interface AppState {
	save: SaveData;
	persistent: PersistentData;
	ephemeral: EphemeralData;
}

export const defaultAppState: Readonly<AppState> = deepFreeze<AppState>({
	save: {
		viewMode: "perspective-orbit",
		vertexSource: defaultVertSource,
		fragmentSource: defaultFragSource,
		meshes: [],
		textures: [],
	},
	persistent: {
		theme: "one-dark",
	},
	ephemeral: {
		errorLogs: { shaderErrors: [] },
		textureInstances: [],
		glCtx: null,
		assimpInstance: null,
	},
});

export const appState: AppState = $state(deepClone(defaultAppState));
