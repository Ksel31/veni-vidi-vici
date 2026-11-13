<script>
	/** Avatar rond : la photo choisie, sinon l'initiale (profile.elyx : avatar et avatarLarge). */
	/** @type {{ initial: string, avatar: string | null, size: number }} */
	let { initial, avatar, size } = $props();
</script>

<span class="avatar" style:width="{size}px" style:height="{size}px" style:font-size="{Math.round(size * 0.46)}px" aria-hidden="true">
	{#if avatar}
		<img src={avatar} alt="" />
	{:else}
		{initial}
	{/if}
</span>
