<script lang="ts">
	import { appState } from "$lib/state.svelte.js";
	import { onMount } from "svelte";
	import initAssimp from "assimpts";
	import PreviewPanel from "$lib/components/PreviewPanel.svelte";
	import ThemePicker from "$lib/components/ThemePicker.svelte";

	onMount(() => {
		initAssimp().then((module) => {
			appState.ephemeral.assimpInstance = module;
			console.log("Assimp initialized");
		});
	});
</script>

<svelte:head>
	<title>ShaderCoy</title>
</svelte:head>

<div class="h-full w-full">
	<PreviewPanel>
		{#snippet toolbarChildren()}
			<ThemePicker />
		{/snippet}
	</PreviewPanel>
</div>
