// Bug bêta : le « + » du line-up ne faisait rien sur la version Docker du Pinas.
// Cause : `crypto.randomUUID` n'existe pas en HTTP simple (hors HTTPS/localhost) ;
// l'appel levait une erreur avalée par le gestionnaire de clic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newId } from '../src/lib/ids.js';

test("newId marche sans crypto.randomUUID (page servie en HTTP simple) et suit le format PocketBase", () => {
	const real = globalThis.crypto;
	// Contexte non sécurisé : seul getRandomValues reste disponible.
	Object.defineProperty(globalThis, 'crypto', {
		value: { getRandomValues: real.getRandomValues.bind(real) },
		configurable: true
	});
	try {
		assert.equal(globalThis.crypto.randomUUID, undefined);
		const ids = Array.from({ length: 50 }, () => newId());
		for (const id of ids) assert.match(id, /^[a-z0-9]{15}$/);
		assert.equal(new Set(ids).size, ids.length);
	} finally {
		Object.defineProperty(globalThis, 'crypto', { value: real, configurable: true });
	}
});

test("aucun écran n'appelle crypto.randomUUID", async () => {
	const { readFileSync, readdirSync, statSync } = await import('node:fs');
	const { join } = await import('node:path');
	/** @param {string} dir @returns {string[]} */
	const files = (dir) =>
		readdirSync(dir).flatMap((name) => {
			const path = join(dir, name);
			return statSync(path).isDirectory() ? files(path) : [path];
		});
	for (const file of files('src').filter((f) => /\.(js|svelte)$/.test(f))) {
		assert.ok(!readFileSync(file, 'utf-8').includes('crypto.randomUUID('), file);
	}
});
