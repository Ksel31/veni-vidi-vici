<script>
	import Icon from './Icon.svelte';

	/** Pied de page du stepper : « Retour » (masqué à la 1re étape) et bouton principal.
	 *  @type {{
	 *    showBack?: boolean,
	 *    nextLabel: string,
	 *    nextIcon?: string,
	 *    onBack?: () => void,
	 *    onNext: () => void
	 *  }} */
	let { showBack = false, nextLabel, nextIcon, onBack, onNext } = $props();
</script>

<div class="step-actions">
	{#if showBack}
		<button class="btn btn-secondary step-back" type="button" onclick={onBack}>Retour</button>
	{/if}
	<button class="btn btn-primary" type="button" onclick={onNext}>
		{#if nextIcon}<Icon name={nextIcon} size={22} />{/if}
		{nextLabel}
	</button>
</div>
