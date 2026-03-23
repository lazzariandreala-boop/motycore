<template>
  <div>
    <!-- NAVBAR -->
    <header class="navbar">
      <div class="container navbar-inner">
        <!-- Logo -->
        <NuxtLink to="/" class="logo">
          <span class="logo-icon">⬡</span>
          <span class="logo-text">Moty<span class="text-accent">Core</span></span>
        </NuxtLink>

        <!-- Nav links -->
        <nav class="nav-links">
          <NuxtLink to="/" class="nav-link">Catalogo</NuxtLink>
          <NuxtLink to="/confronta" class="nav-link">Confronta</NuxtLink>
        </nav>

        <!-- CTA -->
        <div class="nav-actions">
          <NuxtLink to="/confronta" class="btn btn-accent-outline" style="font-size:13px; padding:8px 16px;">
            ⚖️ Confronta moto
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- PAGE CONTENT -->
    <main class="main-content">
      <NuxtPage />
    </main>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="container">
        <div class="footer-inner">
          <span class="logo-text" style="font-size:20px;">Moty<span class="text-accent">Core</span></span>
          <span class="text-muted" style="font-size:13px;">
            Dati indicativi. Verifica sempre le informazioni ufficiali.
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* NAVBAR */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 10, 11, 0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}
.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  gap: 32px;
}

/* LOGO */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}
.logo-icon {
  font-size: 22px;
  color: var(--accent);
  line-height: 1;
}
.logo-text {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: var(--text);
}

/* NAV LINKS */
.nav-links {
  display: flex;
  gap: 4px;
  flex: 1;
  justify-content: center;
}
.nav-link {
  padding: 6px 16px;
  border-radius: var(--radius);
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  transition: color 0.2s, background 0.2s;
}
.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text);
  background: var(--bg-elevated);
}
.nav-link.router-link-exact-active {
  color: var(--accent);
}

/* NAV ACTIONS */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* MAIN */
.main-content {
  min-height: calc(100vh - 64px - 72px);
  padding-top: 40px;
  padding-bottom: 60px;
}

/* FOOTER */
.footer {
  border-top: 1px solid var(--border);
  padding: 20px 0;
}
.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 640px) {
  .nav-links { display: none; }
  .nav-actions { display: none; }
  .footer-inner { flex-direction: column; align-items: flex-start; }
}
</style>
