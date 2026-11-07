/* GameTopia platform account helper — independent of ARMAGEDDON. */
window.GameTopiaAccount = {
  api: 'https://gametopia-render-test.onrender.com',
  stored() {
    for (const store of [sessionStorage, localStorage]) {
      try { const a = JSON.parse(store.getItem('gt_account') || 'null'); if (a && a.token) return a; } catch (_) {}
    }
    return null;
  },
  clear() { sessionStorage.removeItem('gt_account'); localStorage.removeItem('gt_account'); },
  async validate() {
    const a = this.stored(); if (!a) return null;
    try {
      const r = await fetch(this.api + '/api/accounts/me', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({token:a.token})
      });
      if (!r.ok) { if (r.status === 401) this.clear(); return null; }
      return await r.json();
    } catch (_) { return null; }
  },
  requireLogin(redirect = 'account.html') {
    // Both are enforced: local credentials and server-side session validation.
    return this.validate().then(a => {
      if (!a) location.replace(redirect);
      return a;
    });
  }
};
