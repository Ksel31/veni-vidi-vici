<script>
	import { data } from '#lib/store.js';
	import { computeStats, statsYears } from '#lib/stats.js';
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import FoldCard from '#lib/components/FoldCard.svelte';
	import Icon from '#lib/components/Icon.svelte';

	// Libellés des mois sous l'histogramme (maquette : jan, fév, mar…).
	const MONTH_LABELS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
	const MONTH_NAMES = [
		'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
		'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
	];
	// Un event vu = 32 px de haut. Un mois vide garde un trait de 4 px (maquette).
	const BAR_PER_EVENT = 32;
	const BAR_EMPTY = 4;

	const years = $derived(statsYears($data));
	/** '' = « Tout ». */
	let picked = $state('');
	// Si l'année choisie disparaît des données (event supprimé), on revient à « Tout ».
	const year = $derived(years.includes(picked) ? picked : '');
	const stats = $derived(computeStats($data, year));
	const isEmpty = $derived(years.length === 0);

	/** « 3 events », « 1 event ». @param {number} count */
	function eventsLabel(count) {
		return `${count} ${count > 1 ? 'events' : 'event'}`;
	}

	/** « 22 oct. » @param {string} iso */
	function shortDate(iso) {
		const [y, m, d] = iso.split('-').map(Number);
		return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
	}

	const monthsHint = $derived(
		`${year ? `En ${year}.` : 'Toutes années cumulées.'} Pic en ${MONTH_NAMES[stats.peakMonth]} : ${stats.peakCount} ${stats.peakCount > 1 ? 'events vus' : 'event vu'}.`
	);

	// Légende des chiffres clés. Rien d'écrit si aucun raté ni à venir.
	const summaryNote = $derived.by(() => {
		const parts = [];
		if (stats.missed > 0) parts.push(`${stats.missed} ${stats.missed > 1 ? 'events ratés' : 'event raté'}`);
		if (stats.upcoming > 0) parts.push(`${stats.upcoming} à venir`);
		return parts.length > 0 ? `Il y a aussi ${parts.join(' et ')}.` : '';
	});
</script>

<svelte:head>
	<title>Statistiques — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-pad screen-stats">
	<ScreenHeader title="Statistiques" backHref="/profile" />

	{#if isEmpty}
		<!-- TODO : pas de maquette pour l'écran vide ; texte à valider. -->
		<div class="glass-card profile-card">
			<h2 class="card-title">Pas encore de statistiques</h2>
			<p class="hint">Elles apparaîtront ici dès ton premier event vu.</p>
		</div>
	{:else}
		<div class="stats-years" role="group" aria-label="Année">
			<button class="chip" class:chip-on={year === ''} type="button" aria-pressed={year === ''} onclick={() => (picked = '')}>
				Tout
			</button>
			{#each years as item (item)}
				<button
					class="chip"
					class:chip-on={item === year}
					type="button"
					aria-pressed={item === year}
					onclick={() => (picked = item)}
				>
					{item}
				</button>
			{/each}
		</div>

		<div class="glass-card profile-card">
			<h2 class="card-title">Vu en tout</h2>
			<div class="stats-numbers">
				<p><span class="stat-value">{stats.seenCount}</span><span class="stat-label">Events vus</span></p>
				<p><span class="stat-value">{stats.concerts}</span><span class="stat-label">Concerts</span></p>
				<p><span class="stat-value">{stats.festivals}</span><span class="stat-label">Festivals</span></p>
				<p><span class="stat-value">{stats.festivalDays}</span><span class="stat-label">Jours de festival</span></p>
				<p><span class="stat-value">{stats.bands}</span><span class="stat-label">Groupes vus</span></p>
				<p><span class="stat-value">{stats.venues}</span><span class="stat-label">Lieux différents</span></p>
			</div>
			{#if summaryNote}
				<p class="hint">{summaryNote}</p>
			{/if}
		</div>

		<FoldCard title="Events par mois">
			<p class="hint">{monthsHint}</p>
			<!-- Une colonne par mois, posée sur une ligne de base. Seul le pic montre sa valeur. -->
			<ol class="bar-chart">
				{#each stats.perMonth as count, index (index)}
					{@const isPeak = index === stats.peakMonth}
					<li class="bar-column" class:bar-peak={isPeak}>
						<span class="bar-value" aria-hidden="true">{isPeak ? count : ''}</span>
						<span class="bar" style:height="{count > 0 ? count * BAR_PER_EVENT : BAR_EMPTY}px"></span>
						<span class="bar-label">
							{MONTH_LABELS[index]}<span class="visually-hidden"> : {eventsLabel(count)}</span>
						</span>
					</li>
				{/each}
			</ol>
		</FoldCard>

		<FoldCard title="Groupes les plus vus">
			<p class="hint">Groupes vus au moins 2 fois.</p>
			{#if stats.topBands.length > 0}
				{@render ranking(stats.topBands, (/** @type {number} */ count) => `${count} fois`)}
			{:else}
				<!-- TODO : pas de maquette pour ce cas ; texte à valider. -->
				<p class="hint">Aucun groupe vu 2 fois pour l'instant.</p>
			{/if}
		</FoldCard>

		<FoldCard title="Lieux les plus fréquentés">
			{#if stats.topVenues.length > 0}
				{@render ranking(stats.topVenues, eventsLabel)}
			{:else}
				<!-- TODO : pas de maquette pour ce cas ; texte à valider. -->
				<p class="hint">Aucun lieu renseigné sur tes events vus.</p>
			{/if}
		</FoldCard>

		<FoldCard title="Avec qui">
			<p class="hint">Accompagnants les plus fréquents.</p>
			{#if stats.topCompanions.length > 0}
				{@render ranking(stats.topCompanions, eventsLabel)}
			{:else}
				<!-- TODO : pas de maquette pour ce cas ; texte à valider. -->
				<p class="hint">Aucun accompagnant noté pour l'instant.</p>
			{/if}
		</FoldCard>

		<FoldCard title="Ressenti">
			{#if stats.ratedCount > 0}
				<div class="feeling-numbers">
					<p class="thumb-stat">
						<Icon name="thumbs-up" />
						<span class="thumb-texts">
							<span class="thumb-value">{stats.likedCount}</span>
							<span class="thumb-label">Aimés</span>
						</span>
					</p>
					<p class="thumb-stat">
						<Icon name="thumbs-down" />
						<span class="thumb-texts">
							<span class="thumb-value">{stats.dislikedCount}</span>
							<span class="thumb-label">Pas aimés</span>
						</span>
					</p>
				</div>
				<div class="feeling-bar"><span style:width="{stats.likedShare}%"></span></div>
				<p class="hint">
					{stats.likedCount} {stats.likedCount > 1 ? 'events aimés' : 'event aimé'} sur {stats.ratedCount}
					{stats.ratedCount > 1 ? 'notés' : 'noté'}.
				</p>
				{#if stats.lastLiked.length > 0}
					<h3 class="stats-subtitle">Derniers events aimés</h3>
					<ul class="rank-list">
						{#each stats.lastLiked as event (event.id)}
							<li class="liked-row">
								<span class="rank-name">{event.title}</span>
								<span class="rank-count">{event.type === 'festival' ? 'Festival' : 'Concert'}, {shortDate(event.date)}</span>
							</li>
						{/each}
					</ul>
				{/if}
			{:else}
				<!-- TODO : pas de maquette pour ce cas ; texte à valider. -->
				<p class="hint">Aucun avis pour l'instant. Mets un pouce sur un event vu.</p>
			{/if}
		</FoldCard>
	{/if}

	<!-- Export CSV : phase 3. Visible mais désactivé (état « désactivé » des boutons). -->
	<button class="btn btn-secondary" type="button" disabled>
		<Icon name="download" size={22} />
		Exporter en CSV
	</button>
</section>

{#snippet ranking(/** @type {Array<{ rank: number, label: string, count: number, share: number }>} */ rows, /** @type {(count: number) => string} */ countText)}
	<ol class="rank-list">
		{#each rows as row (row.label)}
			<li class="rank-row" class:rank-top={row.rank === 1}>
				<span class="rank-index">{row.rank}</span>
				<span class="rank-name">{row.label}</span>
				<span class="rank-count">{countText(row.count)}</span>
				<span class="rank-track"><span class="rank-fill" style:width="{row.share}%"></span></span>
			</li>
		{/each}
	</ol>
{/snippet}
