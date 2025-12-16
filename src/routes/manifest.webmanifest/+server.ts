import { webManifest } from "$lib/components/MetaTags.svelte";

export async function GET() {
	return new Response(JSON.stringify(webManifest), {
		headers: { "Content-Type": "application/json" },
	});
}
