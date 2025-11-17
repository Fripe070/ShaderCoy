<script lang="ts">
	import { appState } from "$lib/state.svelte.js";
	import { flip } from "svelte/animate";
	import TextureEditModal from "./TextureEditModal.svelte";
	import type { Texture } from "$lib/resources/texture/datatypes.js";

	// TODO: This component should not directly depend on appState
	const maxFragTextures: number = $derived.by(() => {
		if (!appState.ephemeral.glCtx!) return 0;
		appState.save.fragmentSource; // Recompute when shader changes
		return appState.ephemeral.glCtx.getParameter(appState.ephemeral.glCtx.MAX_TEXTURE_IMAGE_UNITS);
	});
	$effect(() => {
		if (appState.save.textures.length > maxFragTextures) {
			console.warn(
				`Number of textures (${appState.save.textures.length}) ` +
					`exceeds maximum supported by GPU (${maxFragTextures}). Truncating.`,
			);
			appState.save.textures.splice(maxFragTextures);
		}
	});

	const textureCards: (Texture | null)[] = $derived.by(() => {
		const textures: (Texture | null)[] = [...appState.save.textures];
		if (textures.length < maxFragTextures) {
			textures.push(null);
		}
		return textures;
	});

	function getValidIndex(value: string) {
		const filtered = value.replace(/\D/g, "");
		const index = parseInt(filtered) || 0;
		return Math.max(0, Math.min(appState.save.textures.length - 1, index));
	}

	function addTexture(file: File): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			// Check file type
			if (!file.type.startsWith("image/")) {
				console.warn(`Failed to load texture: file ${file.name} is not an image`);
				reject();
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result;
				if (typeof result !== "string") {
					console.error(`Failed to load texture: result for file ${file.name} is not a string`);
					reject();
					return;
				}
				if (appState.save.textures.length >= maxFragTextures) {
					console.warn(`Cannot add texture: maximum of ${maxFragTextures} textures reached`);
					reject();
					return;
				}
				appState.save.textures.push({
					id: crypto.randomUUID(),
					fileName: file.name,
					dataUri: result,
				});
				resolve();
			};
			reader.onerror = () => {
				console.error(`Failed to read file ${file.name}`);
				reject();
			};
			reader.readAsDataURL(file);
		});
	}

	let fileInput: HTMLInputElement;
	$effect(() => {
		if (!fileInput) return;
		fileInput.onchange = async () => {
			if (!fileInput.files || fileInput.files.length === 0) return;
			await Promise.all(Array.from(fileInput.files).map((file) => addTexture(file)));
			fileInput.value = "";
		};
	});

	let isDraggingOver: boolean = $state(false);

	let isEditingModalOpen: boolean = $state(false);
	let editingTexture: Texture | null = $state(null);
	$effect(() => {
		if (!isEditingModalOpen) editingTexture = null;
	});
	// TODO: Render textures with a canvas instead to make them more accurately
	//  display like they will when used in the shader?
</script>

<!-- Texture editing modal -->
{#if editingTexture}
	<TextureEditModal bind:isEditingModalOpen texture={editingTexture} />
{/if}

<ul
	class="min-h-full"
	ondragover={(event) => {
		event.preventDefault();
		isDraggingOver = true;
	}}
	ondragleave={() => {
		isDraggingOver = false;
	}}
	ondrop={(event) => {
		event.preventDefault();
		isDraggingOver = false;
		const files = event.dataTransfer?.files;
		if (!files || files.length === 0) return;
		Promise.all(Array.from(files).map((file) => addTexture(file)));
	}}
>
	<div
		class={[
			"pointer-events-none absolute top-0 left-0 h-full w-full",
			"border-4 border-dashed border-accent bg-accent/20",
			isDraggingOver ? "opacity-100" : "opacity-0",
			"transition-opacity duration-150",
		]}
	></div>

	<input bind:this={fileInput} class="hidden" type="file" accept="image/*" multiple />

	<div class="flex flex-wrap justify-center gap-2 p-2">
		{#each textureCards as texture, index (texture)}
			<li animate:flip={{ duration: 80 }}>
				{#if texture}
					{@render textureCard(index, texture)}
				{:else}
					<button
						class={[
							"flex cursor-pointer flex-col bg-background-secondary",
							"hover:bg-[color-mix(in_oklab,var(--theme-background-secondary),var(--theme-background-selected))]",
						]}
						onclick={() => {
							fileInput.click();
						}}
					>
						<div class="flex h-34 w-34 items-center justify-center" title="Add Texture">
							<iconify-icon
								width="calc(var(--spacing) * 16)"
								height="calc(var(--spacing) * 16)"
								icon="material-symbols:add-photo-alternate"
							></iconify-icon>
						</div>
						<div
							class={[
								"border-t border-foreground-muted/20",
								"text-center text-xl leading-6 font-semibold text-foreground-muted",
							]}
						>
							Add Texture
						</div>
					</button>
				{/if}
			</li>
		{/each}
	</div>
</ul>

{#snippet textureCard(index: number, texture: Texture)}
	<div class="flex flex-col bg-background-secondary">
		<div class="flex h-34 w-34 items-center justify-center">
			<img
				class="checkerboard h-full max-w-full border border-foreground-muted/20 object-contain"
				src={texture.dataUri}
				alt={`Texture ${index}`}
			/>
		</div>

		<div class="flex w-full flex-row items-center border-t border-accent bg-background-tertiary">
			<!-- Edit and delete buttons -->
			<button
				class={[
					"flex size-6 items-center justify-center",
					"cursor-pointer hover:bg-background-selected",
				]}
				title="Edit Texture"
				onclick={() => {
					editingTexture = texture;
					isEditingModalOpen = !isEditingModalOpen;
				}}
			>
				<iconify-icon icon="material-symbols:edit"></iconify-icon>
			</button>

			<button
				class={[
					"flex h-6 w-4 items-center justify-center",
					index == 0
						? "cursor-not-allowed text-foreground-primary/20"
						: "cursor-pointer hover:bg-background-selected",
				]}
				title="Move Backward"
				onclick={() => {
					if (index === 0) return;
					const textures = appState.save.textures;
					const temp = textures[index - 1];
					textures[index - 1] = textures[index];
					textures[index] = temp;
				}}
			>
				<iconify-icon icon="material-symbols:arrow-back-ios-new"></iconify-icon>
			</button>

			<input
				type="text"
				class="h-6 w-14 appearance-none border-none bg-background-secondary text-center text-xl font-semibold"
				required
				value={index.toString()}
				oninput={(event) => {
					const newIndex = getValidIndex(event.currentTarget.value);
					event.currentTarget.value = newIndex.toString();
				}}
				onchange={(event) => {
					const newIndex = getValidIndex(event.currentTarget.value);
					if (newIndex === index) return;
					const textures = appState.save.textures;
					const [moved] = textures.splice(index, 1);
					textures.splice(newIndex, 0, moved);
				}}
			/>

			<button
				class={[
					"flex h-6 w-4 items-center justify-center",
					index == appState.save.textures.length - 1
						? "cursor-not-allowed text-foreground-primary/20"
						: "cursor-pointer hover:bg-background-selected",
				]}
				title="Move Forward"
				onclick={() => {
					if (index === appState.save.textures.length - 1) return;
					const textures = appState.save.textures;
					const temp = textures[index + 1];
					textures[index + 1] = textures[index];
					textures[index] = temp;
				}}
			>
				<iconify-icon icon="material-symbols:arrow-forward-ios"></iconify-icon>
			</button>

			<button
				class="flex size-6 cursor-pointer items-center justify-center bg-negative/30 hover:bg-negative/50"
				title="Delete Texture"
				onclick={() => {
					appState.save.textures.splice(index, 1);
				}}
			>
				<iconify-icon icon="material-symbols:delete"></iconify-icon>
			</button>
		</div>
	</div>
{/snippet}
