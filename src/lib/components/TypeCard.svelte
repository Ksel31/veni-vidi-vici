<script>
	import Icon from './Icon.svelte';

	/**
	 * Carte Concert ou Festival, partagée par l'ajout et le dernier écran d'onboarding.
	 * @type {{ href: string, icon: string, title: string, text: string, onclick?: () => void }}
	 */
	let { href, icon, title, text, onclick } = $props();
</script>

<a class="type-card" {href} {onclick}>
	<span class="type-disc"><Icon name={icon} size={30} /></span>
	<span class="type-texts">
		<span class="type-title">{title}</span>
		<span class="type-text">{text}</span>
	</span>
	<Icon name="chevron-right" />
</a>
