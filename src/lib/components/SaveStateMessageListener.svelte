<script lang="ts">
	import { appState } from "$lib/state.svelte.js";
</script>

<svelte:window
	onmessage={(event) => {
		if (event.data?.type === "loadState" && event.data?.state) {
			appState.save = event.data.state;
		}
	}}
/>
