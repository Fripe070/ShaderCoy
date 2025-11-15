<script lang="ts" module>
	// prettier-ignore
	export const modelPrimitives = [
		{ id: "quad", 	 name: "Quad", 	  icon: "material-symbols:rectangle" },
		{ id: "cube",    name: "Cube",    icon: "material-symbols:deployed-code" },
		{ id: "sphere",  name: "Sphere",  icon: "material-symbols:ev-shadow-outline" },
		{ id: "torus",   name: "Torus",   icon: "material-symbols:donut-small" },
		{ id: "suzanne", name: "Suzanne", icon: "material-symbols:blender" },
	] as const satisfies {
		id: string;
		name: string;
		icon: string;
	}[];
</script>

<script lang="ts">
	import { type Mesh } from "$lib/resources/model/datatypes.js";
	import { fileToAssimpFile, loadMeshes, stringToAssimpFile } from "$lib/resources/model/load.js";
	import { appState } from "$lib/state.svelte.js";
	import { dev } from "$app/environment";
	import DropdownPicker from "./DropdownPicker.svelte";

	let { meshes = $bindable() }: { meshes: Mesh[] } = $props();

	if (dev) {
		$effect(() => {
			$inspect(meshes, "Current Model");
		});
	}

	let modelCache: Record<string, Mesh[]> = {};
	export async function loadModel(model: (typeof modelPrimitives)[number]): Promise<boolean> {
		if (!modelCache[model.id]) {
			const data = await fetch(`/assets/models/${model.id}.obj`);
			if (!data.ok) {
				console.error(`Failed to get model ${model.id}: ${data.statusText}`);
				return false;
			}
			const objText = await data.text();
			const assimp = appState.ephemeral.assimpInstance;
			if (!assimp) {
				console.error("Assimp instance not initialized");
				return false;
			}
			modelCache[model.id] = loadMeshes(assimp, [stringToAssimpFile(`${model.id}.obj`, objText)]);
		}
		meshes = modelCache[model.id] || meshes;
		return true;
	}

	let fileName: string = $state("Model");
	let currentIcon: string = $state("material-symbols:3d");
	let loading: boolean = $state(false);

	let dropdownElement: HTMLElement | null = $state<HTMLElement | null>(null);

	const elements = [
		...modelPrimitives.map((model) => ({
			icon: model.icon,
			name: model.name,
			callback: async () => {
				const success = await loadModel(model);
				if (success) {
					fileName = model.name;
					currentIcon = model.icon;
				}
				return success;
			},
		})),
		{
			icon: "material-symbols:upload-2",
			name: "Custom",
			callback: async (event: MouseEvent): Promise<boolean> => {
				// Return true if a file was selected and loaded successfully, false otherwise.
				return await new Promise<boolean>(async (resolver) => {
					const fileInput = document.createElement("input");
					fileInput.type = "file";
					fileInput.accept = ".obj,.gltf,.glb,.fbx";
					fileInput.style.display = "none";
					(event.currentTarget as Node).parentElement!.appendChild(fileInput);

					const resolve = async (val: boolean) => {
						fileInput.remove();
						resolver(val);
					};
					fileInput.onchange = async () => {
						const files = fileInput.files;
						if (!files || files.length === 0) {
							resolve(false);
							return;
						}
						const file = files[0];

						const assimp = appState.ephemeral.assimpInstance;
						if (!assimp) {
							console.error("Assimp instance not initialized");
							resolve(false);
							return;
						}
						try {
							meshes = loadMeshes(assimp, [await fileToAssimpFile(file)]);
							resolve(true);
							fileName = file.name;
							currentIcon = "material-symbols:attach-file";
						} catch (error) {
							console.error("Failed to load mesh from user file", error);
							resolve(false);
						}
					};
					fileInput.onabort = () => resolve(false);
					fileInput.oncancel = () => resolve(false);

					fileInput.click();
				});
			},
		},
	].map((element) => ({
		...element,
		callback: async (event: MouseEvent) => {
			loading = true;
			const result = await element.callback(event);
			loading = false;
			return result;
		},
	}));

	// Default model loading
	$effect(() => {
		if (appState.ephemeral.assimpInstance === null) return;
		const defaultPrimitive = modelPrimitives.find((m) => m.id === "cube") || modelPrimitives[0];
		loadModel(defaultPrimitive).then((success) => {
			if (success) {
				fileName = defaultPrimitive.name;
				currentIcon = defaultPrimitive.icon;
			}
		});
	});
</script>

<!-- FIXME: Not closing when view mode dropdown is clicked -->
<DropdownPicker
	bind:dropdownElement
	class={"min-w-14"}
	title={fileName}
	icon={currentIcon}
	swapIcon={false}
	{elements}
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
