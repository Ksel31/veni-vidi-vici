<script>
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import Icon from '#lib/components/Icon.svelte';
</script>

<svelte:head>
	<title>Ajouter — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-pad add-type">
	<ScreenHeader title="Ajouter" />
	<h2 class="add-question">Quel type d'event ?</h2>
	<a class="type-card" href="/add/concert">
		<span class="type-disc"><Icon name="music" size={30} /></span>
		<span class="type-texts">
			<span class="type-title">Concert</span>
			<span class="type-text">Une soirée, une salle, un à trois groupes.</span>
		</span>
		<Icon name="chevron-right" />
	</a>
	<a class="type-card" href="/add/festival">
		<span class="type-disc"><Icon name="tent" size={30} /></span>
		<span class="type-texts">
			<span class="type-title">Festival</span>
			<span class="type-text">Un ou plusieurs jours, un line-up réparti par jour.</span>
		</span>
		<Icon name="chevron-right" />
	</a>
</section>
