<script lang="ts">
	import { type Snippet } from "svelte";

	let {
		children,
		isOpen = $bindable(false),
	}: {
		children: Snippet;
		isOpen?: boolean;
	} = $props();

	let dialogElement: HTMLDialogElement;

	$effect(() => {
		dialogElement;
		if (isOpen) {
			dialogElement.showModal();
		} else {
			dialogElement.close();
		}
	});
</script>

<dialog
	bind:this={dialogElement}
	closedby="any"
	onclose={() => {
		isOpen = false;
	}}
	class={[
		"absolute-center p-2",
		"bg-background-primary text-foreground-primary shadow-sm",
		"backdrop:bg-background-tertiary/50 backdrop:brightness-75",
	]}
>
	{@render children()}
</dialog>
