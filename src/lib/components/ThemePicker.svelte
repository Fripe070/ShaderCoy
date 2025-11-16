<script lang="ts">
	import { appState } from "$lib/state.svelte.js";
	import { canUseLocalStorage } from "$lib/utils.svelte.js";
	import DropdownPicker from "./DropdownPicker.svelte";
	import { THEMES, type ThemeElement } from "./ThemeLoader.svelte";

	let elements: ThemeElement[] = Object.entries(THEMES).map(([id, name]) => ({
		name,
		callback: () => {
			appState.persistent.theme = id;
			if (canUseLocalStorage()) {
				localStorage.setItem("theme", id);
			}
		},
		themeId: id,
	}));
</script>

<svelte:window
	onmessage={(event) => {
		// Allow iframe host to set theme
		if (event.data?.type === "setTheme" && event.data?.theme) {
			const themeId = event.data.theme;
			if (THEMES[themeId]) {
				appState.persistent.theme = themeId;
			} else {
				console.warn(
					`Received invalid theme ID: "${themeId}". ` +
						`Available themes: ${Object.keys(THEMES).join(", ")}`,
				);
			}
		}
	}}
/>

{#snippet elementSnippet(element: ThemeElement)}
	<div
		class={[
			"flex h-full w-full flex-row items-center gap-1 px-1",
			"bg-background-primary text-foreground-primary",
			element.themeId === appState.persistent.theme ? "border-l-3 border-accent" : "",
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
