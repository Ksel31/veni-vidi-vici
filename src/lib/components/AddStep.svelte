<script>
	import Icon from './Icon.svelte';
	import StepHeader from './StepHeader.svelte';

	/**
	 * Une étape du formulaire d'ajout : en-tête (croix + titre), question de l'étape,
	 * carte de champs (le contenu), puis « Retour » / « Suivant » ancrés en bas.
	 * @type {{
	 *   title: string, step: number, stepTitle: string, help: string,
	 *   nextLabel: string, nextIcon?: string, onNext: () => void,
	 *   onBack?: () => void, onClose: () => void,
	 *   children: import('svelte').Snippet
	 * }}
	 */
	let { title, step, stepTitle, help, nextLabel, nextIcon, onNext, onBack, onClose, children } = $props();
</script>

<section class="step-screen">
	<div class="step-top">
		<header class="page-header step-page-header">
			<button class="icon-button" type="button" aria-label="Fermer" onclick={onClose}>
				<Icon name="x" />
			</button>
			<h1>{title}</h1>
		</header>
		<StepHeader {step} title={stepTitle} {help} />
		<div class="glass-card">
			{@render children()}
		</div>
	</div>
	<div class="step-actions">
		{#if step > 1 && onBack}
			<button class="btn btn-secondary step-back" type="button" onclick={onBack}>Retour</button>
		{/if}
		<button class="btn btn-primary" type="button" onclick={onNext}>
			{#if nextIcon}<Icon name={nextIcon} size={22} />{/if}
			{nextLabel}
		</button>
	</div>
</section>
