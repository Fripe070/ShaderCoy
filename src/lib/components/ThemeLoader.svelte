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
	onMount(() => {
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme && THEMES[savedTheme]) {
			appState.frontend.persistentSettings.theme = savedTheme;
		}
	});
</script>
