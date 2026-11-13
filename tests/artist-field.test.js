// Garde-fous du bouton « + » (groupes). Le composant Svelte ne tourne pas sous node:test :
// la logique (doublon) est testée dans rules.js, le reste est vérifié dans la source du composant.
// Le vrai parcours dans un navigateur : e2e/lineup.mjs (voir README).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nomDejaPris } from '../src/lib/rules.js';

const source = readFileSync(new URL('../src/lib/components/ArtistField.svelte', import.meta.url), 'utf8');

test('nomDejaPris : repère un doublon sans tenir compte de la casse ni des espaces', () => {
	assert.equal(nomDejaPris(['Skeptical Minds'], 'skeptical minds'), true);
	assert.equal(nomDejaPris(['Skeptical Minds'], '  Skeptical Minds '), true);
	assert.equal(nomDejaPris(['Skeptical Minds'], 'Autre groupe'), false);
	assert.equal(nomDejaPris([], 'Skeptical Minds'), false);
});

test('un doublon affiche « Déjà dans le line-up » au lieu d\'être ignoré en silence', () => {
	assert.match(source, /nomDejaPris\(taken, trimmed\)/);
	assert.match(source, /Déjà dans le line-up/);
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
