# MandWijs — implementatieplan

## Uitgangssituatie

- De GitHub-repository was bij aanvang leeg en bevatte geen commits.
- De applicatie wordt mobile-first gebouwd met Next.js App Router, TypeScript en Tailwind CSS.
- Zonder externe credentials draait MandWijs volledig met deterministische demo-data.
- Supabase, Resend en de externe prijsprovider worden via environment variables aangesloten; geheime keys blijven server-only.

## Fasering

1. Projectbasis: design tokens, layouts, navigatie, configuratie en ontwikkeltooling.
2. Data en auth: Supabase-schema, RLS, auth-routes en een lokale demo-sessie.
3. Onboarding en voorkeuren: locatie, radius, winkels en e-mailkeuze.
4. Persoonlijke producten: zoeken, toevoegen, pauzeren, bewerken en verwijderen.
5. Prijsdata: provider-contract, demo-provider, normalisatie, matching en prijsberekening.
6. Lijst en advies: boodschappenlijst en vier transparante winkelstrategieën.
7. Ervaring: dashboard, loading/empty/error states en responsive toegankelijkheid.
8. E-mail en beheer: templates, idempotente weekmail-flow en admincontrole.
9. Kwaliteit: unit-, integratie- en E2E-tests, lint, typecheck, build en documentatie.

## Architectuurkeuzes

- Een repository-laag abstraheert Supabase en de demo-opslag, zodat de UI niet aan een databron vastzit.
- Prijsproviders implementeren één typed `SupermarketDataProvider`-contract.
- Matchen, actieprijsberekening, afstand en optimalisatie zijn pure domeinservices met unit-tests.
- Server Actions en Route Handlers valideren invoer met Zod; clients bepalen nooit zelf een `user_id`.
- De app-naam, valuta, winkelpenalty en standaardradius staan in centrale configuratie.

## Risico's en mitigaties

- **PrijsProfeet:** de officiële OpenAPI-specificatie is geïmplementeerd met runtimevalidatie. Onduidelijk gespecificeerde matchresponses worden niet blind gemapt en filiaaldata valt terug op transparant gemarkeerde interne data.
- **Supabase:** auth en persoonlijke CRUD gebruiken de gebruikerssessie en RLS. Migrations en accountbackfill worden meegeleverd; demo-modus blijft beschikbaar als het externe schema nog niet is uitgerold.
- **E-mail:** echte verzending vereist Resend, een geverifieerd afzenderdomein en een cron-secret. Preview en idempotentielogica werken zonder credentials.
- **Winkellocaties:** de MVP gebruikt Nederlandse demo-filialen en Haversine-filtering; ontbrekende coördinaten worden defensief genegeerd.
- **Externe prijsdekking:** de interface communiceert expliciet dat uitkomsten schattingen op basis van beschikbare data zijn.

## Definition of done

- `npm run lint`, `npm run typecheck`, `npm test` en `npm run build` slagen.
- Het kernscenario is via Playwright afgedekt.
- Alle hoofdroutes hebben Nederlandse copy, responsieve states en toegankelijke interacties.
- Supabase-migrations, `.env.example`, seed-data en deploymentinstructies zijn aanwezig.
