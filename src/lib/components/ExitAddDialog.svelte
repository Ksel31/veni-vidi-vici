<script>
	import Icon from './Icon.svelte';

	/** Confirmation avant de quitter l'ajout et de perdre la saisie.
	 *  « Continuer » (lime) est le choix qui ne perd rien.
	 *  @type {{ onLeave: () => void, onStay: () => void }} */
	let { onLeave, onStay } = $props();
</script>

<div class="exit-add" role="dialog" aria-modal="true" aria-labelledby="exit-add-title">
	<div class="glass-card delete-panel exit-add-panel">
		<p class="card-title" id="exit-add-title">Quitter l'ajout ?</p>
		<p class="hint">Ce que tu as saisi ne sera pas enregistré.</p>
		<div class="choice-row">
			<button class="btn btn-secondary" type="button" onclick={onLeave}>Quitter</button>
			<button class="btn btn-primary" type="button" onclick={onStay}>
				<Icon name="chevron-right" size={22} />
				Continuer
			</button>
		</div>
	</div>
</div>
