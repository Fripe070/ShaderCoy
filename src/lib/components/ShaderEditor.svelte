<script lang="ts">
	import CodeMirror, { type CodeMirrorProps } from "svelte-codemirror-editor";
	import theme from "$lib/editor/theme.js";
	import glsl from "$lib/editor/glsl/index.js";
	import highlighting from "$lib/editor/highlight.js";
	import { isSmallScreen } from "$lib/utils.svelte.js";

	let { value = $bindable(""), ...rest }: { value: string } & CodeMirrorProps = $props();
</script>

<CodeMirror
	bind:value
	tabSize={4}
	theme={[theme, highlighting]}
	class={["h-full w-full"]}
	lang={glsl()}
	lineWrapping={isSmallScreen()}
	{...rest}
/>
