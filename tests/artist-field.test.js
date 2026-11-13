// Garde-fou du bouton « + » (groupes) : le composant Svelte ne tourne pas sous node:test,
// on vérifie donc dans sa source les deux points qui causaient le bug.
// Cause : au toucher du « + », le champ perdait le focus, le clavier mobile se fermait, la page se décalait
// et un test de géométrie au pointerup (« le doigt est-il encore sur le bouton ? ») échouait sans rien dire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/lib/components/ArtistField.svelte', import.meta.url), 'utf8');

test('le « + » garde le focus du champ au toucher (pas de clavier qui se ferme)', () => {
	assert.match(source, /onpointerdown=\{keepFocus\}/);
	assert.match(source, /function keepFocus\(event\)\s*\{\s*event\.preventDefault\(\)/);
});

test("l'ajout passe par un clic normal, sans test de géométrie au pointerup", () => {
	assert.match(source, /onclick=\{\(\) => commit\(typedValue\(\)\)\}/);
	assert.doesNotMatch(source, /onpointerup|getBoundingClientRect/);
});

test("l'icône ne code aucun chemin en dur", () => {
	assert.doesNotMatch(source, /\/icons\//);
});

test("une erreur à l'ajout est signalée, pas avalée", () => {
	assert.match(source, /catch \(error\)[\s\S]*console\.error[\s\S]*showInfoToast/);
});
