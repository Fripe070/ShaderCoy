<script lang="ts">
	import { appState } from "$lib/state.svelte.js";
	import { onMount } from "svelte";
	import initAssimp from "assimpts";
	import DragPanes from "$lib/components/DragPanes.svelte";
	import PreviewPanel from "$lib/components/PreviewPanel.svelte";
	import EditingPanel from "$lib/components/EditingPanel.svelte";
	import { isSmallScreen } from "$lib/utils.svelte.js";

	onMount(() => {
		initAssimp().then((module) => {
			appState.assimpInstance = module;
			console.log("Assimp initialized");
		});
	});
</script>

<svelte:head>
	<title>ShaderCoy</title>
</svelte:head>

<div class="h-full w-full">
	<DragPanes
		factor={isSmallScreen() ? 0.4 : 0.5}
		direction={isSmallScreen() ? "vertical" : "horizontal"}
		draggable={!isSmallScreen()}
		secondMinSize={0.2}
	>
		{#snippet first()}
			<PreviewPanel />
		{/snippet}
		{#snippet second()}
			<EditingPanel />
		{/snippet}
	</DragPanes>
</div>
