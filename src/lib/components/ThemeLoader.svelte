<script lang="ts" module>
	export const THEMES: Record<string, string> = {
		"one-dark": "One Dark",
		"tokyo-night": "Tokyo Night",
		catppuccin: "Catppuccin",
		dracula: "Dracula",
		gruvbox: "Gruvbox",
		discord: "Discord",
		"nord-night": "Nord Night",
		"nord-snow": "Nord Snow",
		firefox: "Firefox",
	} as const;
	export interface ThemeElement {
		name: string;
		themeId: string;
		callback: () => void;
	}
</script>

<script lang="ts">
	import { onMount } from "svelte";
	import { appState } from "$lib/state.svelte.js";
	import { canUseLocalStorage } from "$lib/utils.svelte.js";
	onMount(() => {
		if (!canUseLocalStorage()) return;
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme && THEMES[savedTheme]) {
			appState.persistent.theme = savedTheme;
		}
	});
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
