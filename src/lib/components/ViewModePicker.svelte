<script lang="ts">
	import { appState, type ProjectState } from "$lib/state.svelte.js";
	import DropdownPicker from "./DropdownPicker.svelte";

	const elements: Record<ProjectState["viewMode"], { name: string; icon: string }> = {
		"2d": {
			name: "2D Viewport",
			icon: "material-symbols:monitor-outline",
		},
		"perspective-orbit": {
			name: "Perspective",
			icon: "material-symbols:orbit-outline",
		},
		"orthographic-orbit": {
			name: "Orthographic",
			icon: "material-symbols:crop-rotate",
		},
	};
</script>

<DropdownPicker
	title="Rendering Mode"
	showTitle={false}
	icon={elements[appState.save.viewMode].icon}
	elements={Object.entries(elements).map(([modelId, value]) => ({
		...value,
		callback: () => {
			appState.save.viewMode = modelId as keyof typeof elements;
		},
	}))}
/>
