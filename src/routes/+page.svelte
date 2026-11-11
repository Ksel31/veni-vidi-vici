<script>
	import { onMount } from 'svelte';
	import { data, historyEvents, login, restoreSession, toConfirmEvents } from '#lib/store.js';

	/** Échelles Radix, dans l'ordre de tokens/colors.elyx. */
	const scales = [
		{ id: 'neutral', label: 'Neutre' },
		{ id: 'lime', label: 'Lime' },
		{ id: 'red', label: 'Rouge' },
		{ id: 'amber', label: 'Ambre' },
		{ id: 'green', label: 'Vert' }
	];

	const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

	const statusLabel = {
		planned: 'Prévu',
		attended: 'Vu',
		missed: 'Raté'
	};

	let identifier = $state('');

	onMount(() => {
		restoreSession();
	});

	/** @param {SubmitEvent} event */
	function connect(event) {
		event.preventDefault();
		login(identifier);
	}

	/** @param {import('#lib/store.js').Event[]} events */
	function byDate(events) {
		return [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
	}

	/** @param {string} iso */
	function formatDate(iso) {
		const [year, month, day] = iso.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	/** @param {import('#lib/store.js').Event} event */
	function whenLabel(event) {
		const start = formatDate(event.startDate);
		if (event.endDate && event.endDate !== event.startDate) {
			return `${start} – ${formatDate(event.endDate)}`;
		}
		return start;
	}

	/**
	 * @param {import('#lib/store.js').Event} event
	 * @param {import('#lib/store.js').Event[]} confirmList
	 */
	function statusLine(event, confirmList) {
		const label = statusLabel[event.status];
		if (confirmList.some((item) => item.id === event.id)) return `${label}, à confirmer`;
		return label;
	}
</script>

<main class="sample">
	<img class="sample-logo" src="/images/logo-white.svg" alt="Veni Vidi Vici" />

	<section class="debug" aria-label="Essai temporaire des données">
		<h2>Temporaire — essai des données</h2>
		<p class="type-meta">Pas l'écran de connexion. Sert à vérifier que les données restent dans le navigateur.</p>

		<form onsubmit={connect}>
			<label for="debug-user">Identifiant</label>
			<input id="debug-user" bind:value={identifier} autocomplete="off" spellcheck="false" />
			<button type="submit" disabled={identifier.trim() === ''}>Se connecter</button>
		</form>

		{#if $data.userId}
			{@const confirmList = toConfirmEvents($data)}
			{@const historyList = historyEvents($data)}
			<p>Compte « {$data.userId} »</p>
			<p class="debug-counts">
				{$data.events.length} events · {confirmList.length} à confirmer · {historyList.length} dans l'historique
			</p>
			{#if $data.events.length === 0}
				<p class="type-meta">Aucun event.</p>
			{:else}
				<ul class="debug-list">
					{#each byDate($data.events) as event (event.id)}
						<li>{event.title || 'Sans titre'} — {whenLabel(event)} — {statusLine(event, confirmList)}</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</section>

	<h1 class="type-section">Titre de section</h1>
	<p class="type-profile">Prénom et chiffres</p>
	<p class="type-card">Titre de carte</p>
	<p class="type-body">Texte courant. Cabinet Grotesk Regular, pour un avis ou une note.</p>
	<p class="type-meta">Lieu, libellé, pastille</p>
	<p class="type-ticket">14 NOV</p>
	<p class="type-meta">Wagon Bold, réservé aux chiffres du billet</p>

	<section class="glass-card">
		<p class="type-card">Verre sombre</p>
		<p class="type-meta">Carte posée sur la photo, filet clair.</p>
		<p class="type-body accent">Texte accent</p>
	</section>

	<ul class="pills">
		<li class="pill pill-brand">Marque</li>
		<li class="pill pill-missed">Raté</li>
		<li class="pill pill-pending">À confirmer</li>
		<li class="pill pill-seen">Vu</li>
	</ul>

	<section class="scale-block">
		<h2 class="type-card">Couleurs</h2>
		{#each scales as scale (scale.id)}
			<p class="scale-label">{scale.label}</p>
			<div class="scale" role="img" aria-label="{scale.label}, échelons 1 à 12">
				{#each steps as step (step)}
					<span class="swatch" style="background: var(--{scale.id}-{step})"></span>
				{/each}
			</div>
			<div class="steps" aria-hidden="true">
				{#each steps as step (step)}
					<span>{step}</span>
				{/each}
			</div>
		{/each}
	</section>
</main>
