<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { completeOnboarding, needsOnboarding } from '#lib/store.js';
	import Icon from '#lib/components/Icon.svelte';
	import TypeCard from '#lib/components/TypeCard.svelte';

	const slides = [
		{
			photo: '/images/hero-concert.jpg',
			icon: 'ticket',
			eyebrow: 'Bienvenue dans Venidici !',
			title: 'Ajoute tes events',
			body: 'Concerts et festivals à venir, avec billet et line-up.',
			choices: false
		},
		{
			photo: '/images/hero-bass.jpg',
			icon: 'check',
			eyebrow: '',
			title: 'Confirme après la date',
			body: 'Le lendemain, dis si tu y étais ou non.',
			choices: false
		},
		{
			photo: '/images/hero-cowboy.jpg',
			icon: '',
			eyebrow: '',
			title: 'Garde tes souvenirs',
			body: 'Pouces, avis, setlist, photos : tout est gardé dans ton historique.',
			choices: true
		}
	];

	let index = $state(0);
	/** @type {HTMLDivElement | null} */
	let track = $state(null);

	function reducedMotion() {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	/** @param {number} target */
	function scrollToIndex(target) {
		if (!track) return;
		const next = Math.max(0, Math.min(slides.length - 1, target));
		index = next;
		track.scrollTo({
			left: next * track.clientWidth,
			behavior: reducedMotion() ? 'auto' : 'smooth'
		});
	}

	function onScroll() {
		if (!track || track.clientWidth === 0) return;
		index = Math.round(track.scrollLeft / track.clientWidth);
	}

	/** @param {KeyboardEvent} event */
	function onKey(event) {
		if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
		event.preventDefault();
		scrollToIndex(index + (event.key === 'ArrowRight' ? 1 : -1));
	}

	/**
	 * « Passer » (écrans 1 et 2) mène à l'accueil vide.
	 * Choisir Concert ou Festival ouvre le formulaire correspondant.
	 * Dans les deux cas l'onboarding ne revient pas.
	 * @param {string} href
	 */
	function leave(href) {
		completeOnboarding();
		goto(href);
	}

	// Un compte déjà onboardé (ou `demo`) qui ouvre l'URL à la main revient à l'accueil.
	onMount(() => {
		if (!needsOnboarding()) goto('/');
	});
</script>

<svelte:head>
	<title>Premiers pas — Veni Vidi Vici</title>
</svelte:head>

<svelte:window onkeydown={onKey} />

<section class="onboarding" aria-roledescription="carousel" aria-label="Premiers pas">
	<p class="visually-hidden" aria-live="polite">
		{slides[index].title}. Écran {index + 1} sur {slides.length}.
	</p>

	<div class="onboarding-track" bind:this={track} onscroll={onScroll}>
		{#each slides as slide, i (slide.title)}
			<article
				class="onboarding-slide"
				style="--slide-photo: url('{slide.photo}')"
				aria-roledescription="diapositive"
				aria-label={slide.title}
			>
				<header class="onboarding-top">
					<img class="onboarding-logo" src="/images/logo-white.svg" alt="Veni Vidi Vici" />
					{#if i < 2}
						<button class="onboarding-skip" type="button" onclick={() => leave('/')}>Passer</button>
					{/if}
				</header>

				<div class="onboarding-lower">
					<div class="onboarding-copy">
						{#if slide.icon}
							<div class="onboarding-disc">
								<Icon name={slide.icon} size={44} />
							</div>
						{/if}
						<div class="onboarding-texts">
							{#if slide.eyebrow}
								<p class="onboarding-eyebrow">{slide.eyebrow}</p>
							{/if}
							<h1>{slide.title}</h1>
							<p>{slide.body}</p>
						</div>
					</div>

					{#if slide.choices}
						<div class="onboarding-choices">
							<p class="onboarding-choice-title">Par quoi commencer ?</p>
							<TypeCard
								href="/add/concert"
								icon="music"
								title="Concert"
								text="Une soirée, une salle, un à trois groupes."
								onclick={() => completeOnboarding()}
							/>
							<TypeCard
								href="/add/festival"
								icon="tent"
								title="Festival"
								text="Un ou plusieurs jours, un line-up réparti par jour."
								onclick={() => completeOnboarding()}
							/>
						</div>
					{/if}

					<div class="page-dots" aria-hidden="true">
						{#each slides as _, dot (dot)}
							<span class="page-dot" class:page-dot-on={index === dot}></span>
						{/each}
					</div>
				</div>

				{#if i < 2}
					<button class="swipe-hint" type="button" aria-label="Écran suivant" onclick={() => scrollToIndex(i + 1)}>
						<Icon name="chevron-right" size={28} />
					</button>
				{/if}
			</article>
		{/each}
	</div>
</section>
