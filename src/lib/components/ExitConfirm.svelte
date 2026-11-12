<script>
	import Icon from './Icon.svelte';

	/** @type {{ photo: 'concert' | 'festival', onLeave: () => void, onContinue: () => void }} */
	let { photo, onLeave, onContinue } = $props();
</script>

<!-- screens/add-exit.elyx : « Continuer » (lime) est le choix qui ne perd rien. -->
<div class="exit-layer exit-{photo}">
	<div class="glass-card delete-panel" role="dialog" aria-labelledby="exit-title">
		<p class="card-title" id="exit-title">Quitter l'ajout ?</p>
		<p class="hint">Ce que tu as saisi ne sera pas enregistré.</p>
		<div class="choice-row">
			<button class="btn btn-secondary" type="button" onclick={onLeave}>Quitter</button>
			<button class="btn btn-primary" type="button" onclick={onContinue}>
				<Icon name="chevron-right" size={22} />
				Continuer
			</button>
		</div>
	</div>
</div>
