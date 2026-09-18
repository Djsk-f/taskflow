import { z } from 'zod'

/**
 * Configuration d'exécution, validée au démarrage. Même parti que côté serveur avec
 * JWT_SECRET : une variable manquante doit produire une erreur immédiate et lisible,
 * pas des appels réseau vers `undefined`.
 *
 * Les variables sont lues à la racine du dépôt (`envDir` dans vite.config.ts) : un seul
 * fichier .env pour les deux modules. Seules celles préfixées VITE_ sont exposées au
 * navigateur, les identifiants de base de données ne peuvent donc pas fuir dans le bundle.
 */
const environmentSchema = z.object({
  VITE_API_BASE_URL: z.string().url({
    message:
      "VITE_API_BASE_URL est absente ou invalide. Copier .env.example en .env à la racine du dépôt (ex. http://localhost:8080/api/v1).",
  }),
})

export const env = environmentSchema.parse(import.meta.env)
