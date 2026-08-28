import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';

export async function registerHelmet(app: FastifyInstance): Promise<void> {
  await app.register(helmet, {
    // L'API renvoie du JSON — pas de scripts inline nécessaires.
    // On retire 'unsafe-inline' partout (résout finding audit sécurité).
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        connectSrc: ["'self'"],
        // API JSON pure : ni script ni style rendu au browser
        scriptSrc: ["'none'"],
        styleSrc: ["'none'"],
        imgSrc: ["'none'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    // HSTS : force HTTPS pendant 1 an, inclut sous-domaines, preload-ready
    strictTransportSecurity: {
      maxAge: 63072000, // 2 ans
      includeSubDomains: true,
      preload: true,
    },
    // Empêche embed dans iframe (clickjacking)
    frameguard: { action: 'deny' },
    // Referrer policy : ne pas leak les URLs internes
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Cross-origin resource policy : jamais cross-site
    crossOriginResourcePolicy: { policy: 'same-site' },
    // Cross-origin opener policy : isolation navigation
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    // X-Content-Type-Options: nosniff (par défaut avec helmet, on l'explicite)
    noSniff: true,
    // X-DNS-Prefetch-Control: off
    dnsPrefetchControl: { allow: false },
    // X-Download-Options: noopen (IE legacy protection)
    ieNoOpen: true,
    // X-Permitted-Cross-Domain-Policies: none
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  });
}
