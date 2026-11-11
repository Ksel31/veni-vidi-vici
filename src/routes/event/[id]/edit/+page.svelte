<script>
	import { page } from '$app/state';
	import { shellTone } from '#lib/shell.js';
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';

	const eventId = $derived(page.params.id ?? '');

	$effect(() => {
		shellTone.set('bg-event-edit');
		return () => shellTone.set('');
	});
</script>

<svelte:head>
	<title>Modifier l'event — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-detail">
	<ScreenHeader title="Modifier l'event" backHref="/event/{eventId}" />
	<p class="hint">La modification arrive à l'étape suivante.</p>
</section>
