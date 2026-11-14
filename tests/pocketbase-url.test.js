// Bug bêta : en accès distant (Tailscale), la connexion répondait « Le serveur ne répond pas ».
// Cause : PUBLIC_POCKETBASE_URL contenait l'IP locale du Pinas, injoignable hors de la maison.
// Correctif : une valeur `:8090` reprend l'adresse de la page ouverte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePocketbaseUrl } from '../src/lib/pocketbase-url.js';

test("une adresse complète reste telle quelle", () => {
	const page = { protocol: 'http:', hostname: '100.64.0.1' };
	assert.equal(resolvePocketbaseUrl('http://192.168.1.20:8090', page), 'http://192.168.1.20:8090');
	assert.equal(resolvePocketbaseUrl('', page), '');
});

test("un port seul suit l'adresse de la page : IP locale, IP Tailscale ou nom", () => {
	assert.equal(resolvePocketbaseUrl(':8090', { protocol: 'http:', hostname: '192.168.1.20' }), 'http://192.168.1.20:8090');
	assert.equal(resolvePocketbaseUrl(':8090', { protocol: 'http:', hostname: '100.101.102.103' }), 'http://100.101.102.103:8090');
	assert.equal(resolvePocketbaseUrl(':8090', { protocol: 'http:', hostname: 'pinas.tail1234.ts.net' }), 'http://pinas.tail1234.ts.net:8090');
});

test("un hôte IPv6 est mis entre crochets", () => {
	assert.equal(resolvePocketbaseUrl(':8090', { protocol: 'http:', hostname: 'fd7a:115c::1' }), 'http://[fd7a:115c::1]:8090');
});

test("sans page (rendu serveur), le port seul est renvoyé tel quel", () => {
	assert.equal(resolvePocketbaseUrl(':8090', undefined), ':8090');
});
