<script>
	/** Échelles Radix, dans l'ordre de tokens/colors.elyx. */
	const scales = [
		{ id: 'neutral', label: 'Neutre' },
		{ id: 'lime', label: 'Lime' },
		{ id: 'red', label: 'Rouge' },
		{ id: 'amber', label: 'Ambre' },
		{ id: 'green', label: 'Vert' }
	];

	const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
</script>

<main class="sample">
	<img class="sample-logo" src="/images/logo-white.svg" alt="Veni Vidi Vici" />

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
