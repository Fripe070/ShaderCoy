import type { Mesh, Model } from "$lib/resources/model/datatypes.js";
import type { MainModule as AssimpTSModule } from "assimpts";

import defaultVertSource from "$lib/shaders//defaultVert.glsl?raw";
import defaultFragSource from "$lib/shaders//defaultFrag.glsl?raw";
import type { CoyErrorLogs } from "./errors.js";
import { deepClone, deepFreeze } from "./utils.svelte.js";
import type { Texture, TextureInstance } from "./resources/texture/datatypes.js";
import { loadTexture2D } from "./resources/texture/load.js";
import { SvelteMap } from "svelte/reactivity";

export interface SaveData {
	viewMode: "2d" | "perspective-orbit" | "orthographic-orbit";
	vertexSource: string;
	fragmentSource: string;
	model: Model | null;
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

export const defaultSaveState: Readonly<SaveData> = deepFreeze<SaveData>({
	viewMode: "perspective-orbit",
	vertexSource: defaultVertSource,
	fragmentSource: defaultFragSource,
	model: null,
	textures: [],
});

export const appState: AppState = $state({
	save: deepClone(defaultSaveState),
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

const textureInstanceMap = new SvelteMap<Texture["id"], TextureInstance>();
$effect.root(() => {
	$effect(() => {
		const glCtx = appState.ephemeral.glCtx;
		if (!glCtx) return;

		// Make sure all texture instances are of the same GL context
		for (const instance of textureInstanceMap.values()) {
			if (glCtx.isTexture(instance.glTexture)) continue;
			textureInstanceMap.clear();
			appState.ephemeral.textureInstances = [];
			console.log("Cleared texture instances due to WebGL Context change");
			break;
		}

		// Update texture instances
		for (const [id, instance] of textureInstanceMap.entries()) {
			if (appState.save.textures.find((tex) => tex.id === id)) continue;
			glCtx.deleteTexture(instance.glTexture);
			textureInstanceMap.delete(id);
		}

		// Make sure the sveltw compiler tracks these correctly
		const instanceMap = textureInstanceMap;
		const textures = appState.save.textures;
		Promise.all(
			textures.map(async (texture) => {
				if (instanceMap.has(texture.id)) return;
				const textureInstance = await loadTexture2D(glCtx, texture);
				instanceMap.set(texture.id, textureInstance);
			}),
		).then(() => {
			// To array in the correct order
			appState.ephemeral.textureInstances = appState.save.textures.map(
				(tex) => instanceMap.get(tex.id)!,
			);
		});
	});
});
