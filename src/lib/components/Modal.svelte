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
		"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
		"bg-background-primary text-foreground-primary",
		"p-2 shadow-sm",
		"backdrop:bg-background-tertiary/50 backdrop:brightness-75",
	]}
>
	{@render children()}
</dialog>
