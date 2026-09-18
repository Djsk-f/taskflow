// Thème appliqué avant le premier rendu : choix mémorisé, sinon préférence du système.
try {
  var theme = localStorage.getItem('taskflow.theme')
  if (theme === 'dark' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  }
} catch {
  // Stockage indisponible : thème clair par défaut.
}
