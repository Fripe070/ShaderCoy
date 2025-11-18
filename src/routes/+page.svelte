<script lang="ts">
	import { appState } from "$lib/state.svelte.js";
	import { onMount } from "svelte";
	import initAssimp from "assimpts";
	import DragPanes from "$lib/components/DragPanes.svelte";
	import PreviewPanel from "$lib/components/PreviewPanel.svelte";
	import EditingPanel from "$lib/components/EditingPanel.svelte";
	import { isSmallScreen } from "$lib/utils.svelte.js";
	import { loadModelPrimitive } from "$lib/components/ModelSelector.svelte";
	import SaveStateMessageListener from "$lib/components/SaveStateMessageListener.svelte";

	const setup = async () => {
		appState.ephemeral.assimpInstance = await initAssimp();
		console.log("Assimp initialized");
		if (!appState.save.model) {
			appState.save.model = await loadModelPrimitive("cube");
		}
	};

	onMount(() => {
		setup()
			.then(() => {
				console.log("Finished setup");
			})
			.catch((error) => {
				console.error("Failed on setup:", error);
			});
	});
</script>

<svelte:head>
	<title>ShaderCoy</title>
</svelte:head>

<SaveStateMessageListener />

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
