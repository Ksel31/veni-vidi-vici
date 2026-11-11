<script>
	import { page } from '$app/state';
	import Icon from './Icon.svelte';

	const path = $derived(page.url.pathname);
	const onHome = $derived(path === '/');
	const onHistory = $derived(path === '/history');
</script>

<div class="dock">
	<div class="bottom-fade"></div>
	<nav class="tab-bar" aria-label="Navigation">
		<a class="tab" class:tab-active={onHome} href="/" aria-label="Accueil" aria-current={onHome ? 'page' : undefined}>
			<Icon name="house" />
		</a>
		<a class="tab" class:tab-active={onHistory} href="/history" aria-label="Historique" aria-current={onHistory ? 'page' : undefined}>
			<Icon name="history" />
		</a>
	</nav>
	<a class="add-button" href="/add" aria-label="Ajouter un event">
		<Icon name="plus" size={30} />
	</a>
</div>
