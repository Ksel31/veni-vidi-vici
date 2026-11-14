// Parcours navigateur du « + » du line-up : ajout d'un groupe, doublon (message « Déjà dans le line-up »),
// à l'ajout d'un festival puis sur sa page de modification. À lancer contre une appli déjà démarrée
// (idéalement en HTTP simple sur l'IP du réseau, comme sur le Pinas). Playwright n'est PAS dans package.json :
//   E2E_APP_URL=http://<ip>:3000 E2E_USER=<identifiant> E2E_PASSWORD=<mot de passe> npx -y -p playwright node e2e/lineup.mjs
// (premier lancement : `npx -y -p playwright playwright install chromium`). Le compte doit exister.
import { chromium } from 'playwright';

const { E2E_APP_URL: app, E2E_USER: user, E2E_PASSWORD: password } = process.env;
if (!app || !user || !password) throw new Error('Renseigne E2E_APP_URL, E2E_USER et E2E_PASSWORD.');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const problems = [];
page.on('pageerror', (error) => problems.push(`pageerror : ${error.message}`));
page.on('console', (message) => message.type() === 'error' && problems.push(`console : ${message.text()}`));
page.on('requestfailed', (request) => problems.push(`requête échouée : ${request.url()}`));

/** @param {boolean} ok @param {string} label */
function check(ok, label) {
	console.log(`${ok ? 'OK ' : 'KO '} ${label}`);
	if (!ok) process.exitCode = 1;
}
const bands = () => page.locator('.band-name').count();
const addButton = () => page.getByRole('button', { name: 'Ajouter le groupe' });

await page.goto(`${app}/login`);
await page.fill('#login-id', user);
await page.fill('#login-password', password);
await page.click('button[type=submit]');
await page.waitForURL((url) => url.pathname !== '/login');
if (page.url().includes('/onboarding')) await page.getByRole('button', { name: 'Passer' }).click();
await page.waitForTimeout(1000);

// 1. À l'ajout d'un festival (étape « groupes »)
await page.goto(`${app}/add/festival`);
await page.fill('#festival-title', 'Festival e2e');
await page.getByRole('button', { name: /dates/i }).first().click();
const days = page.locator('.cal-day:not([disabled])');
await days.nth(20).click();
await days.nth(21).click();
await page.getByRole('button', { name: 'Valider' }).click();
await page.getByRole('button', { name: 'Suivant' }).click();
await page.fill('#artist-query', 'Skeptical Minds');
await addButton().click();
check((await bands()) === 1, "ajout : le groupe s'affiche après un clic sur +");
await page.fill('#artist-query', 'skeptical minds');
await addButton().click();
check((await bands()) === 1 && (await page.getByText('Déjà dans le line-up').count()) === 1, 'ajout : un doublon affiche « Déjà dans le line-up »');
await page.locator('.festival-band .chip').first().click();
await page.getByRole('button', { name: 'Suivant' }).click();
await page.getByRole('button', { name: /Ajouter le festival/ }).click();
await page.waitForURL(/\/event\//);
// On laisse partir les écritures en cours avant de recharger la page.
await page.waitForTimeout(2000);

// 2. Sur la page de modification du festival créé
await page.goto(`${page.url()}/edit`);
await page.waitForSelector('#artist-query');
const before = await bands();
await page.fill('#artist-query', 'Nouveau groupe');
await addButton().click();
check((await bands()) === before + 1, 'modification : le groupe saisi est ajouté');
await page.fill('#artist-query', 'Skeptical Minds');
await addButton().click();
check((await bands()) === before + 1 && (await page.getByText('Déjà dans le line-up').count()) === 1, 'modification : un doublon affiche « Déjà dans le line-up »');

check(problems.length === 0, `aucune erreur de console, de page ou de réseau${problems.length ? ' : ' + problems.join(' | ') : ''}`);
await browser.close();
