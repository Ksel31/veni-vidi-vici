const STORAGE_KEY = 'vvv-logged-in';

/** true seulement dans le vrai navigateur (évite le localStorage fantôme de Node) */
function canUseStorage() {
	try {
		return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
	} catch {
		return false;
	}
}

export function isLoggedIn() {
	if (!canUseStorage()) return false;
	return window.localStorage.getItem(STORAGE_KEY) === '1';
}

export function login() {
	if (canUseStorage()) window.localStorage.setItem(STORAGE_KEY, '1');
}

export function logout() {
	if (canUseStorage()) window.localStorage.setItem(STORAGE_KEY, '0');
}
