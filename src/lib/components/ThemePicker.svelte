<script lang="ts">
	import { appState } from "$lib/state.svelte.js";
	import DropdownPicker from "./DropdownPicker.svelte";
	import { THEMES, type ThemeElement } from "./ThemeLoader.svelte";

	let elements: ThemeElement[] = Object.entries(THEMES).map(([id, name]) => ({
		name,
		callback: () => {
			appState.frontend.persistentSettings.theme = id;
			// Save in localstorage
			localStorage.setItem("theme", id);
		},
		themeId: id,
	}));
</script>

{#snippet elementSnippet(element: ThemeElement)}
	<div
		class={[
			"flex h-full w-full flex-row items-center gap-1 px-1",
			"bg-background-primary text-foreground-primary",
			element.themeId === appState.frontend.persistentSettings.theme
				? "border-l-3 border-accent"
				: "",
		]}
		data-theme={/* Used for preview styling */ element.themeId}
	>
		<iconify-icon icon="material-symbols:style"></iconify-icon>
		<span>{element.name}</span>
	</div>
{/snippet}

<DropdownPicker
	title="Select App Theme"
	showTitle={false}
	icon="material-symbols:format-paint"
	{elements}
	{elementSnippet}
/>
