<script lang="ts">
	import "../styles/app.css";
	import "iconify-icon";
	import "@fontsource/iosevka";
	import "@fontsource-variable/inter";
	import type { Attachment } from "svelte/attachments";
	import { appState } from "$lib/state.svelte.js";
	import ThemeLoader from "$lib/components/ThemeLoader.svelte";

	let { children } = $props();

	const themeAttachment: Attachment = (element) => {
		(element as HTMLElement).parentElement!.dataset.theme =
			appState.frontend.persistentSettings.theme;
		return () => {};
	};
</script>

<svelte:body {@attach themeAttachment} />

<ThemeLoader />

{@render children()}
