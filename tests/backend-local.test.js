import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// localStorage simulé : le backend « local » tourne ainsi sans navigateur.
beforeEach(() => {
	const memory = new Map();
	globalThis.localStorage = {
		get length() { return memory.size; },
		key: (index) => [...memory.keys()][index] ?? null,
		getItem: (key) => (memory.has(key) ? memory.get(key) : null),
		setItem: (key, value) => void memory.set(key, String(value)),
		removeItem: (key) => void memory.delete(key)
	};
});

const { localBackend } = await import('../src/lib/backend/local.js');

const newUser = { username: 'axel', firstName: 'Axel', email: '', password: 'secret' };

test('inscription, puis connexion avec le bon mot de passe seulement', async () => {
	const created = await localBackend.signUp(newUser);
	assert.equal(created.ok, true);
	assert.equal(created.data.events.length, 0);

	await localBackend.signOut();
	assert.equal((await localBackend.signIn('axel', 'faux')).ok, false);
	assert.equal((await localBackend.signIn('axel', 'secret')).ok, true);
});

test('un nom déjà pris (même en majuscules) est refusé', async () => {
	await localBackend.signUp(newUser);
	const again = await localBackend.signUp({ ...newUser, username: 'AXEL' });
	assert.deepEqual(again, { ok: false, error: 'username-taken' });
});

test("« demo » charge les données de démo avec n'importe quel mot de passe", async () => {
	const result = await localBackend.signIn('demo', 'nimporte');
	assert.equal(result.ok, true);
	assert.ok(result.data.events.length > 0);
});

test('un event ajouté, modifié puis supprimé survit au rechargement', async () => {
	const { data: empty } = await localBackend.signUp(newUser);
	const event = { id: 'e1', type: 'concert', title: 'Test', startDate: '2999-01-01' };

	const withEvent = { ...empty, events: [event] };
	localBackend.saveData(empty, withEvent);
	assert.equal((await localBackend.restoreSession()).data.events[0].title, 'Test');

	const renamed = { ...withEvent, events: [{ ...event, title: 'Renommé' }] };
	localBackend.saveData(withEvent, renamed);
	assert.equal((await localBackend.restoreSession()).data.events[0].title, 'Renommé');

	localBackend.saveData(renamed, empty);
	assert.equal((await localBackend.restoreSession()).data.events.length, 0);
});

test("déconnecté, aucune session n'est restaurée ; chaque compte a ses données", async () => {
	const { data } = await localBackend.signUp(newUser);
	localBackend.saveData(data, { ...data, events: [{ id: 'e1' }] });
	await localBackend.signOut();
	assert.equal(await localBackend.restoreSession(), null);

	const other = await localBackend.signUp({ ...newUser, username: 'autre' });
	assert.equal(other.data.events.length, 0);
});

test("l'e-mail se modifie sans toucher au mot de passe", async () => {
	const { account } = await localBackend.signUp(newUser);
	const updated = await localBackend.updateAccount(account, { email: ' a@b.c ' });
	assert.equal(updated.account.email, 'a@b.c');
	await localBackend.signOut();
	assert.equal((await localBackend.signIn('axel', 'secret')).ok, true);
});
