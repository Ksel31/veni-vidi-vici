import PocketBase, { ClientResponseError } from 'pocketbase';
import { pocketbaseUrl } from '../config.js';

// ─────────────────────────────────────────────────────────────────────────────
// Backend « pocketbase » : vrais comptes, données sur le serveur.
// Le schéma est dans `pb_migrations/`. Les identifiants PocketBase servent tels quels d'`id`
// dans l'appli ; les dates restent des textes AAAA-MM-JJ.
// ─────────────────────────────────────────────────────────────────────────────

/** @type {PocketBase | null} */
let client = null;

/** Créé au premier besoin, dans le navigateur seulement (pas pendant le rendu serveur). */
function pb() {
	if (!client) {
		client = new PocketBase(pocketbaseUrl());
		// Plusieurs requêtes partent en même temps : on ne veut pas que l'une annule l'autre.
		client.autoCancellation(false);
	}
	return client;
}

/** @type {(error: unknown) => void} */
let reportSaveError = () => {};

// ── Traduction PocketBase ↔ appli ────────────────────────────────────────────

/** @param {import('pocketbase').RecordModel} record */
function toVenue(record) {
	return { id: record.id, name: record.name, city: record.city ?? '', country: record.country ?? '' };
}

/** @param {import('../store.js').Venue} venue */
function fromVenue(venue) {
	return { name: venue.name, city: venue.city, country: venue.country };
}

/** @param {import('pocketbase').RecordModel} record */
function toArtist(record) {
	return { id: record.id, name: record.name };
}

/** @param {import('../store.js').Artist} artist */
function fromArtist(artist) {
	return { name: artist.name };
}

/** Les champs vides de PocketBase ('' ou 0) redeviennent `null`, comme dans l'appli.
 * @param {import('pocketbase').RecordModel} record
 * @returns {import('../store.js').Event}
 */
function toEvent(record) {
	return {
		id: record.id,
		type: record.type,
		title: record.title || null,
		startDate: record.startDate,
		endDate: record.endDate || null,
		venueId: record.venue || null,
		status: record.status,
		ticketBought: record.ticketBought === true,
		// PocketBase ne distingue pas « pas de prix » de 0 : on lit 0 comme « pas de prix ».
		ticketPrice: record.ticketPrice > 0 ? record.ticketPrice : null,
		// Phase 3 : les fichiers ne sont pas encore gérés.
		ticketFile: null,
		photos: [],
		daysAttended: Array.isArray(record.daysAttended) ? record.daysAttended : [],
		thumb: record.thumb || null,
		comment: record.comment ?? '',
		companions: Array.isArray(record.companions) ? record.companions : []
	};
}

/** `ticketFile` et `photos` ne sont pas envoyés : ce qui serait déjà là sur le serveur reste intact.
 * @param {import('../store.js').Event} event
 */
function fromEvent(event) {
	return {
		type: event.type,
		title: event.title ?? '',
		startDate: event.startDate,
		endDate: event.endDate ?? '',
		venue: event.venueId ?? '',
		status: event.status,
		ticketBought: event.ticketBought,
		ticketPrice: event.ticketPrice ?? 0,
		daysAttended: event.daysAttended,
		thumb: event.thumb ?? '',
		comment: event.comment,
		companions: event.companions
	};
}

/** @param {import('pocketbase').RecordModel} record @returns {import('../store.js').Performance} */
function toPerformance(record) {
	return {
		id: record.id,
		eventId: record.event,
		artistId: record.artist,
		billing: record.billing || null,
		day: record.day || null,
		status: record.status,
		thumb: record.thumb || null,
		setlist: record.setlist ?? ''
	};
}

/** @param {import('../store.js').Performance} performance */
function fromPerformance(performance) {
	return {
		event: performance.eventId,
		artist: performance.artistId,
		billing: performance.billing ?? '',
		day: performance.day ?? '',
		status: performance.status,
		thumb: performance.thumb ?? '',
		setlist: performance.setlist
	};
}

/** Les quatre collections de données, dans l'ordre où on les crée (les relations pointent vers le haut). */
const COLLECTIONS = /** @type {const} */ ([
	{ name: 'venues', key: 'venues', fromApp: fromVenue },
	{ name: 'artists', key: 'artists', fromApp: fromArtist },
	{ name: 'events', key: 'events', fromApp: fromEvent },
	{ name: 'performances', key: 'performances', fromApp: fromPerformance }
]);

/** @param {import('pocketbase').RecordModel} record @returns {import('./index.js').Account} */
function toAccount(record) {
	return {
		username: record.username,
		firstName: record.firstName ?? '',
		email: record.email ?? '',
		avatar: record.avatar ? pb().files.getURL(record, record.avatar) : null
	};
}

// ── Erreurs ──────────────────────────────────────────────────────────────────

/** Une erreur PocketBase devient un code que les écrans savent afficher.
 * @param {unknown} error
 * @returns {import('./index.js').AuthError}
 */
function toAuthError(error) {
	if (!(error instanceof ClientResponseError)) return 'unknown';
	if (error.status === 0) return 'unreachable';
	const fields = error.response?.data ?? {};
	if (fields.username) return fields.username.code === 'validation_not_unique' ? 'username-taken' : 'unknown';
	if (fields.password) return 'password-invalid';
	if (fields.email) return 'email-invalid';
	if (error.status === 400 || error.status === 401 || error.status === 403) return 'invalid-credentials';
	return 'unknown';
}

/** @returns {import('./index.js').AuthError | null} */
function configError() {
	if (pocketbaseUrl()) return null;
	console.error('PUBLIC_POCKETBASE_URL est vide : renseigne-la pour PUBLIC_STORE=pocketbase (voir .env.example).');
	return 'config';
}

// ── Données ──────────────────────────────────────────────────────────────────

/** Lit tout ce que l'utilisateur connecté a le droit de voir (les règles d'API filtrent par propriétaire).
 * @returns {Promise<import('../store.js').AppData>}
 */
async function loadData() {
	const user = pb().authStore.record;
	if (!user) throw new Error('Pas de session.');
	// `created` garde l'ordre d'ajout (l'ordre d'un line-up compte).
	const [venues, artists, events, performances] = await Promise.all(
		COLLECTIONS.map((collection) => pb().collection(collection.name).getFullList({ sort: 'created' }))
	);
	return {
		userId: user.id,
		venues: venues.map(toVenue),
		artists: artists.map(toArtist),
		events: events.map(toEvent),
		performances: performances.map(toPerformance),
		onboardingSeen: user.onboardingSeen === true
	};
}

/** @returns {Promise<import('./index.js').Session>} */
async function openSession() {
	const record = pb().authStore.record;
	if (!record) throw new Error('Pas de session.');
	return { account: toAccount(record), data: await loadData() };
}

/**
 * Compare deux états et liste les écritures à faire côté serveur.
 * Toute la logique métier reste dans store.js : ici on ne fait que traduire la différence.
 * @param {import('../store.js').AppData} previous
 * @param {import('../store.js').AppData} next
 * @returns {Array<() => Promise<unknown>>}
 */
function diff(previous, next) {
	const userId = next.userId;
	if (!userId) return [];
	/** @type {Array<() => Promise<unknown>>} */
	const creates = [];
	/** @type {Array<() => Promise<unknown>>} */
	const updates = [];
	/** @type {Array<() => Promise<unknown>>} */
	const deletes = [];

	for (const collection of COLLECTIONS) {
		const api = () => pb().collection(collection.name);
		/** @type {Map<string, any>} */
		const before = new Map(previous[collection.key].map((item) => [item.id, item]));
		/** @type {Set<string>} */
		const after = new Set();
		for (const item of /** @type {any[]} */ (next[collection.key])) {
			after.add(item.id);
			const body = collection.fromApp(item);
			const old = before.get(item.id);
			if (!old) {
				// L'id est choisi par l'appli (15 caractères a-z0-9) : le serveur le garde tel quel.
				creates.push(() => api().create({ ...body, id: item.id, user: userId }));
			} else if (JSON.stringify(collection.fromApp(old)) !== JSON.stringify(body)) {
				updates.push(() => api().update(item.id, body));
			}
		}
		for (const id of before.keys()) {
			// Déjà parti (suppression en cascade d'un event) : tant mieux.
			if (!after.has(id)) deletes.unshift(() => api().delete(id).catch(ignoreNotFound));
		}
	}

	if (previous.onboardingSeen !== next.onboardingSeen) {
		updates.push(() => pb().collection('users').update(userId, { onboardingSeen: next.onboardingSeen }));
	}
	// Créer d'abord (lieux avant events avant passages), supprimer les passages avant les events.
	return [...creates, ...updates, ...deletes];
}

/** @param {unknown} error */
function ignoreNotFound(error) {
	if (error instanceof ClientResponseError && error.status === 404) return;
	throw error;
}

/** Les écritures partent une à la fois, dans l'ordre : un passage a besoin que son event existe déjà. */
let queue = Promise.resolve();
/** Monte à chaque échec : les écritures déjà en attente (bâties sur un état raté) sont abandonnées. */
let generation = 0;

/** @type {import('./index.js').Backend} */
export const pocketbaseBackend = {
	async restoreSession() {
		if (configError() || !pb().authStore.isValid) return null;
		try {
			// Vérifie que la session est encore bonne et renouvelle le jeton.
			await pb().collection('users').authRefresh();
			return await openSession();
		} catch (error) {
			// Session refusée (compte supprimé, jeton périmé) : on l'oublie.
			// Serveur injoignable : on la garde, elle resservira au prochain rechargement.
			if (error instanceof ClientResponseError && [401, 403, 404].includes(error.status)) pb().authStore.clear();
			return null;
		}
	},

	async signIn(identifier, password) {
		const problem = configError();
		if (problem) return { ok: false, error: problem };
		try {
			await pb().collection('users').authWithPassword(identifier.trim(), password);
			return { ok: true, ...(await openSession()) };
		} catch (error) {
			pb().authStore.clear();
			return { ok: false, error: toAuthError(error) };
		}
	},

	async signUp(input) {
		const problem = configError();
		if (problem) return { ok: false, error: problem };
		try {
			await pb()
				.collection('users')
				.create({
					username: input.username.trim(),
					firstName: input.firstName.trim(),
					// L'e-mail est facultatif : on ne l'envoie que s'il est rempli.
					...(input.email.trim() ? { email: input.email.trim() } : {}),
					password: input.password,
					passwordConfirm: input.password
				});
		} catch (error) {
			return { ok: false, error: toAuthError(error) };
		}
		return pocketbaseBackend.signIn(input.username, input.password);
	},

	async signOut() {
		// On laisse finir les enregistrements en cours : sans session, le serveur les refuserait.
		await queue;
		if (client) client.authStore.clear();
	},

	async reload() {
		if (!pb().authStore.isValid) return null;
		return loadData();
	},

	saveData(previous, next) {
		const writes = diff(previous, next);
		if (writes.length === 0) return;
		const mine = generation;
		queue = queue.then(async () => {
			if (mine !== generation) return;
			try {
				for (const write of writes) await write();
			} catch (error) {
				generation += 1;
				reportSaveError(error);
			}
		});
	},

	onSaveError(handler) {
		reportSaveError = handler;
	},

	async updateAccount(current, changes) {
		const record = pb().authStore.record;
		if (!record) return { ok: false, error: 'unknown' };
		try {
			/** @type {Record<string, unknown> | FormData} */
			let body = {};
			if (changes.email !== undefined) {
				// PocketBase invalide la session quand l'e-mail change. On vérifie donc le mot de passe
				// d'abord, puis on se reconnecte juste après pour garder une session valide.
				await pb().collection('users').authWithPassword(current.username, changes.password ?? '');
				body = { email: changes.email.trim() };
			}
			if (changes.avatar !== undefined) {
				// L'appli fabrique l'avatar en data URL (carré de 192 px) : on l'envoie comme un fichier.
				const form = new FormData();
				if (changes.avatar) {
					const blob = await (await fetch(changes.avatar)).blob();
					form.append('avatar', new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' }));
				} else {
					form.append('avatar', '');
				}
				body = form;
			}
			const updated = await pb().collection('users').update(record.id, body);
			if (changes.email !== undefined) {
				const renewed = await pb().collection('users').authWithPassword(current.username, changes.password ?? '');
				return { ok: true, account: toAccount(renewed.record) };
			}
			return { ok: true, account: toAccount(updated) };
		} catch (error) {
			return { ok: false, error: toAuthError(error) };
		}
	}
};
