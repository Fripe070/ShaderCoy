<script lang="ts">
	import type { Texture } from "$lib/state.svelte.js";
	import Modal from "../Modal.svelte";
	import DimensionsSelector from "../DimensionsSelector.svelte";

	let {
		isEditingModalOpen = $bindable(false),
		texture,
	}: {
		isEditingModalOpen: boolean;
		texture: Texture;
	} = $props();

	// FIXME: Change actual texture dimensions
	let textureWidth: number = $state(0);
	let textureHeight: number = $state(0);
</script>

<Modal bind:isOpen={isEditingModalOpen}>
	<div class="flex flex-col items-center">
		<h1 class="text-2xl font-bold">
			Editing <code class="bg-background-secondary">{texture.name}</code>
		</h1>
		<img
			class="checkerboard h-70 max-w-full border border-foreground-muted/20 object-contain"
			src={texture.dataUri}
			alt="Edited Texture"
		/>
		<div class="flex flex-row gap-2">
			<DimensionsSelector
				bind:width={textureWidth}
				bind:height={textureHeight}
				maxAxisSize={2 ** 13}
			/>
		</div>
	</div>
</Modal>
