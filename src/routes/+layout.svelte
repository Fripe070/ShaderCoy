<script lang="ts">
	import "../styles/app.css";
	import "iconify-icon";
	import "@fontsource/iosevka";
	import "@fontsource-variable/inter";
	import type { Attachment } from "svelte/attachments";
	import { appState } from "$lib/state.svelte.js";
	import ThemeLoader from "$lib/components/ThemeLoader.svelte";
	import MetaTags from "$lib/components/MetaTags.svelte";

	let { children } = $props();

	const themeAttachment: Attachment = (element) => {
		(element as HTMLElement).parentElement!.dataset.theme = appState.persistent.theme;
		return () => {};
	};
</script>

<svelte:head>
	<MetaTags />
</svelte:head>

<svelte:body {@attach themeAttachment} />

<ThemeLoader />

{@render children()}
