<script lang="ts">
	import { appState, type SaveData } from "$lib/state.svelte.js";
	import DropdownPicker from "./DropdownPicker.svelte";

	const elements = {
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
	} as const satisfies Record<SaveData["viewMode"], { name: string; icon: string }>;
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
