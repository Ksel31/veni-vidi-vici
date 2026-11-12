<script>
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import TypeCard from '#lib/components/TypeCard.svelte';
</script>

<svelte:head>
	<title>Ajouter — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-pad add-type">
	<ScreenHeader title="Ajouter" />
	<h2 class="add-question">Quel type d'event ?</h2>
	<TypeCard
		href="/add/concert"
		icon="music"
		title="Concert"
		text="Une soirée, une salle, un à trois groupes."
	/>
	<TypeCard
		href="/add/festival"
		icon="tent"
		title="Festival"
		text="Un ou plusieurs jours, un line-up réparti par jour."
	/>
</section>
