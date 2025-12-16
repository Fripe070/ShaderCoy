<script lang="ts">
	import { appState } from "$lib/state.svelte.js";
	import { onMount } from "svelte";
	import initAssimp from "assimpts";
	import PreviewPanel from "$lib/components/PreviewPanel.svelte";
	import ThemePicker from "$lib/components/ThemePicker.svelte";
	import SaveStateMessageListener from "$lib/components/SaveStateMessageListener.svelte";

	onMount(() => {
		initAssimp()
			.then((module) => {
				appState.ephemeral.assimpInstance = module;
				console.log("Assimp initialized");
			})
			.catch((err) => {
				console.error("Failed to initialize Assimp:", err);
			});
	});

	// TODO: Don't load any default shader or model
	// TODO: Allow passing in a shader/model through an iframe
</script>

<SaveStateMessageListener />

<div class="h-full w-full">
	<PreviewPanel standalone={true} />
</div>
