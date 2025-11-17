<script lang="ts" module>
	export type modelPrimitive = "quad" | "cube" | "sphere" | "torus" | "suzanne";

	let modelCache: Record<string, Model> = {};
	export async function loadModelPrimitive(modelId: modelPrimitive): Promise<Model> {
		if (modelCache[modelId]) {
			return modelCache[modelId];
		}
		const data = await fetch(`/assets/models/${modelId}.obj`);
		if (!data.ok) {
			throw new Error(`Failed to get model ${modelId}: ${data.statusText}`);
		}
		const objText = await data.text();
		const assimp = appState.ephemeral.assimpInstance;
		if (!assimp) {
			throw new Error("Assimp instance not initialized");
		}
		modelCache[modelId] = loadModel(assimp, [stringToAssimpFile(`${modelId}.obj`, objText)]);
		return modelCache[modelId];
	}
</script>

<script lang="ts">
	import { type Mesh, type Model } from "$lib/resources/model/datatypes.js";
	import { fileToAssimpFile, loadModel, stringToAssimpFile } from "$lib/resources/model/load.js";
	import { appState } from "$lib/state.svelte.js";
	import DropdownPicker from "./DropdownPicker.svelte";

	let { model: loadedModel = $bindable() }: { model: Model | null } = $props();

	const modelPrimitiveData = {
		quad: { name: "Quad", icon: "material-symbols:rectangle" },
		cube: { name: "Cube", icon: "material-symbols:deployed-code" },
		sphere: { name: "Sphere", icon: "material-symbols:ev-shadow-outline" },
		torus: { name: "Torus", icon: "material-symbols:donut-small" },
		suzanne: { name: "Suzanne", icon: "material-symbols:blender" },
	} as const satisfies Record<modelPrimitive, { name: string; icon: string }>;

	let loading: boolean = $state(false);

	let dropdownElement: HTMLElement | null = $state<HTMLElement | null>(null);

	const elements = [
		...Object.entries(modelPrimitiveData).map(([id, primitive]) => ({
			icon: primitive.icon,
			name: primitive.name,
			callback: async () => {
				loadedModel = await loadModelPrimitive(id as modelPrimitive);
				return true;
			},
		})),
		{
			icon: "material-symbols:upload-2",
			name: "Custom",
			callback: async (event: MouseEvent): Promise<boolean> => {
				// Return true if a file was selected and loaded successfully, false otherwise.
				return await new Promise<boolean>((resolver) => {
					const fileInput = document.createElement("input");
					fileInput.type = "file";
					fileInput.accept = ".obj,.gltf,.glb,.fbx";
					fileInput.style.display = "none";
					(event.currentTarget as Node).parentElement!.appendChild(fileInput);

					const resolve = (val: boolean) => {
						fileInput.remove();
						resolver(val);
					};
					fileInput.onchange = async () => {
						const files = fileInput.files;
						if (!files || files.length === 0) {
							resolve(false);
							return;
						}

						const assimp = appState.ephemeral.assimpInstance;
						if (!assimp) {
							console.error("Assimp instance not initialized");
							resolve(false);
							return;
						}

						const assimpFiles = [];
						for (let i = 0; i < files.length; i++) {
							assimpFiles.push(await fileToAssimpFile(files[i]));
						}
						try {
							loadedModel = loadModel(assimp, assimpFiles);
							resolve(true);
						} catch (error) {
							console.error("Failed to load model from user file", error);
							resolve(false);
						}
					};
					fileInput.onabort = () => resolve(false);
					fileInput.oncancel = () => resolve(false);

					fileInput.click();
				});
			},
		},
	];
</script>

<!-- FIXME: Not closing when view mode dropdown is clicked -->
<DropdownPicker
	bind:dropdownElement
	class="min-w-14"
	icon="material-symbols:interests-outline"
	title={loadedModel?.name ?? "Model"}
	elements={elements.map((element) => ({
		...element,
		callback: async (event: MouseEvent) => {
			loading = true;
			const result = await element.callback(event);
			loading = false;
			return result;
		},
	}))}
>
	{#if loading}
		<div class="absolute bottom-0 left-0 h-full w-full bg-background-tertiary/90">
			<div class="load-spinner absolute-center size-5"></div>
			<div class="absolute-center rotate-180">
				<div class="load-spinner size-5"></div>
			</div>
		</div>
	{/if}
</DropdownPicker>

<style>
	.load-spinner {
		background: conic-gradient(var(--color-accent) 60deg, transparent 60deg);
		clip-path: circle(50%);
		animation: load-spinner 600ms ease-in-out infinite;
	}
	@keyframes load-spinner {
		from {
			transform: rotate(-30deg);
		}
		to {
			transform: rotate(150deg);
		}
	}
</style>
