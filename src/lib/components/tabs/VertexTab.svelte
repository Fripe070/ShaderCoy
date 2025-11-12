<script lang="ts">
	import { appState } from "$lib/state.svelte.js";
	import type { CodeMirrorProps } from "svelte-codemirror-editor";
	import ShaderEditor from "../ShaderEditor.svelte";

	let props: CodeMirrorProps = $props();
</script>

<ShaderEditor {...props} bind:value={appState.saveData.vertexSource} />
