import type { Mesh } from "$lib/resources/model/datatypes.js";
import type { MainModule as AssimpTSModule } from "assimpts";

import defaultVertSource from "$lib/shaders//defaultVert.glsl?raw";
import defaultFragSource from "$lib/shaders//defaultFrag.glsl?raw";
import type { CoyErrorLogs } from "./errors.js";
import { deepClone, deepFreeze } from "./utils.svelte.js";

export interface Texture {
	dataUri: string;
	name: string;
}

export interface ProjectState {
	vertexSource: string;
	fragmentSource: string;
	meshes: Mesh[];
	textures: Texture[];
	viewMode: "2d" | "perspective-orbit" | "orthographic-orbit";
}
export interface FrontendState {
	playing: boolean;
	errorLogs: CoyErrorLogs;
	persistentSettings: {
		theme: string;
	};
}

export interface AppState {
	saveData: ProjectState;
	frontend: FrontendState;
	// Non-serializable runtime state
	glCtx: WebGL2RenderingContext | null;
	assimpInstance: AssimpTSModule | null;
}

export const defaultAppState: Readonly<AppState> = deepFreeze<AppState>({
	saveData: {
		vertexSource: defaultVertSource,
		fragmentSource: defaultFragSource,
		meshes: [],
		textures: [],
		viewMode: "perspective-orbit",
	},
	frontend: {
		playing: true,
		errorLogs: { shaderErrors: [] },
		// TODO: Store in localStorage
		persistentSettings: {
			theme: "one-dark",
		},
	},
	glCtx: null,
	assimpInstance: null,
});

export const appState: AppState = $state(deepClone(defaultAppState));
