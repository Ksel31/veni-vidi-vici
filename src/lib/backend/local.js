import { createDemoData, DEMO_SEED_VERSION } from '../demo-data.js';

// ─────────────────────────────────────────────────────────────────────────────
// Backend « local » : tout vit dans le navigateur (localStorage). C'est le mode de la démo en ligne.
// Les mots de passe des comptes créés ici sont enregistrés EN CLAIR : acceptable pour une démo
// sans serveur, pas pour un vrai usage. Pour de vrais comptes, utiliser le backend PocketBase.
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = 'vvv-session';
/** Données d'un compte (events, lieux…), une clé par identifiant : les comptes ne partagent rien. */
const DATA_KEY_PREFIX = 'vvv-user:';
/** Fiche d'un compte (prénom, e-mail, mot de passe, avatar). */
const ACCOUNT_KEY_PREFIX = 'vvv-account:';

/** @type {(error: unknown) => void} */
let reportSaveError = () => {};

/**
 * Fiche enregistrée. Le mot de passe n'en sort jamais.
 * @typedef {{ username: string, firstName: string, email: string, password: string, avatar: string | null }} StoredAccount
 */

/** @param {string} username @returns {StoredAccount | null} */
function readAccount(username) {
	const raw = localStorage.getItem(ACCOUNT_KEY_PREFIX + username);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		return {
			username,
			firstName: typeof parsed.firstName === 'string' ? parsed.firstName : '',
			email: typeof parsed.email === 'string' ? parsed.email : '',
			password: typeof parsed.password === 'string' ? parsed.password : '',
			avatar: typeof parsed.avatar === 'string' ? parsed.avatar : null
		};
	} catch {
		return null;
	}
}

/** @param {StoredAccount} value @returns {boolean} false si le navigateur refuse d'écrire (stockage plein). */
function writeAccount(value) {
	try {
		localStorage.setItem(ACCOUNT_KEY_PREFIX + value.username, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}

/** @param {StoredAccount} stored @returns {import('./index.js').Account} */
function publicAccount(stored) {
	return { username: stored.username, firstName: stored.firstName, email: stored.email, avatar: stored.avatar };
}

/** @param {string} userId @returns {Omit<import('../store.js').AppData, 'userId'> | null} */
function readData(userId) {
	const raw = localStorage.getItem(DATA_KEY_PREFIX + userId);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		return {
			venues: parsed.venues ?? [],
			artists: parsed.artists ?? [],
			events: parsed.events ?? [],
			performances: parsed.performances ?? [],
			onboardingSeen: parsed.onboardingSeen === true,
			seedVersion: typeof parsed.seedVersion === 'number' ? parsed.seedVersion : 0
		};
	} catch {
		return null;
	}
}

/** @param {import('../store.js').AppData} state */
function writeData(state) {
	if (!state.userId) return;
	const payload = {
		venues: state.venues,
		artists: state.artists,
		events: state.events,
		performances: state.performances,
		onboardingSeen: state.onboardingSeen === true,
		seedVersion: state.seedVersion ?? 0
	};
	try {
		localStorage.setItem(DATA_KEY_PREFIX + state.userId, JSON.stringify(payload));
		localStorage.setItem(SESSION_KEY, state.userId);
	} catch (error) {
		reportSaveError(error);
	}
}

/**
 * Nom déjà pris : `demo`, un compte inscrit, ou un ancien identifiant déjà utilisé
 * dans ce navigateur. Majuscules et minuscules ne comptent pas.
 * @param {string} username
 */
function isUsernameTaken(username) {
	const wanted = username.trim().toLowerCase();
	if (wanted === 'demo') return true;
	for (let i = 0; i < localStorage.length; i += 1) {
		const key = localStorage.key(i) ?? '';
		for (const prefix of [ACCOUNT_KEY_PREFIX, DATA_KEY_PREFIX]) {
			if (key.startsWith(prefix) && key.slice(prefix.length).toLowerCase() === wanted) return true;
		}
	}
	return false;
}

/**
 * Ouvre le compte (sans vérifier de mot de passe). `demo` reçoit les données de démo ;
 * un autre identifiant part d'une appli vide. Ce qui est déjà enregistré est gardé.
 * @param {string} userId
 * @returns {import('./index.js').Session}
 */
function open(userId) {
	const saved = readData(userId);
	const empty = { venues: [], artists: [], events: [], performances: [], onboardingSeen: false };
	// `demo` est recalculé quand la version du seed change : les dates suivent
	// le jour du chargement, même si un ancien compte est déjà dans le navigateur.
	// Ça remplace aussi les modifications faites sur ce compte démo.
	const demo = () => ({ ...createDemoData(), onboardingSeen: true, seedVersion: DEMO_SEED_VERSION });
	const payload =
		userId === 'demo' ? (saved && saved.seedVersion === DEMO_SEED_VERSION ? saved : demo()) : (saved ?? empty);

	const data = { userId, ...payload };
	writeData(data);
	const stored = readAccount(userId) ?? { username: userId, firstName: '', email: '', password: '', avatar: null };
	return { account: publicAccount(stored), data };
}

/** @type {import('./index.js').Backend} */
export const localBackend = {
	async restoreSession() {
		const userId = localStorage.getItem(SESSION_KEY);
		return userId ? open(userId) : null;
	},

	async signIn(identifier, password) {
		const userId = identifier.trim();
		if (!userId) return { ok: false, error: 'invalid-credentials' };
		// `demo` accepte tout mot de passe. Un compte inscrit ici a le sien, vérifié.
		// Un identifiant jamais inscrit (ancien prototype) ouvre une appli vide, comme avant.
		const stored = userId === 'demo' ? null : readAccount(userId);
		if (stored && stored.password && stored.password !== password) {
			return { ok: false, error: 'invalid-credentials' };
		}
		return { ok: true, ...open(userId) };
	},

	async signUp(input) {
		const username = input.username.trim();
		if (isUsernameTaken(username)) return { ok: false, error: 'username-taken' };
		const saved = writeAccount({
			username,
			firstName: input.firstName.trim(),
			email: input.email.trim(),
			password: input.password,
			avatar: null
		});
		if (!saved) return { ok: false, error: 'storage-full' };
		return { ok: true, ...open(username) };
	},

	async signOut() {
		localStorage.removeItem(SESSION_KEY);
	},

	async reload() {
		// Les données sont déjà dans le navigateur : rien à relire.
		return null;
	},

	// Tout est réécrit d'un coup : `previous` ne sert qu'au backend PocketBase.
	saveData(_previous, next) {
		writeData(next);
	},

	onSaveError(handler) {
		reportSaveError = handler;
	},

	async updateAccount(current, changes) {
		const stored = readAccount(current.username) ?? {
			username: current.username,
			firstName: current.firstName,
			email: current.email,
			password: '',
			avatar: current.avatar
		};
		const next = {
			...stored,
			email: changes.email === undefined ? stored.email : changes.email.trim(),
			avatar: changes.avatar === undefined ? stored.avatar : changes.avatar
		};
		if (!writeAccount(next)) return { ok: false, error: 'storage-full' };
		return { ok: true, account: publicAccount(next) };
	}
};
