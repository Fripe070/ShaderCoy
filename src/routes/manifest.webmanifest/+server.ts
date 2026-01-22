import { webManifest } from "$lib/components/MetaTags.svelte";

export const prerender = true;

export async function GET() {
	return new Response(JSON.stringify(webManifest), {
		headers: { "Content-Type": "application/json" },
	});
}
