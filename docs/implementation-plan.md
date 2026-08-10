# MandWijs — implementatieplan

## Uitgangssituatie

- De GitHub-repository was bij aanvang leeg en bevatte geen commits.
- De applicatie wordt mobile-first gebouwd met Next.js App Router, TypeScript en Tailwind CSS.
- Zonder externe credentials draait MandWijs volledig met deterministische demo-data.
- Supabase, Resend en de externe prijsprovider worden via server-only environment variables aangesloten.

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

- **PrijsProfeet:** endpoints en voorwaarden zijn niet publiek bevestigd. De adapter bevat daarom geen verzonnen endpoint of responsevelden en blijft uitgeschakeld tot documentatie beschikbaar is.
- **Supabase:** project-URL en keys ontbreken nog. Migrations, RLS en configuratie worden wel volledig meegeleverd; demo-modus blijft bruikbaar.
- **E-mail:** echte verzending vereist Resend, een geverifieerd afzenderdomein en een cron-secret. Preview en idempotentielogica werken zonder credentials.
- **Winkellocaties:** de MVP gebruikt Nederlandse demo-filialen en Haversine-filtering; ontbrekende coördinaten worden defensief genegeerd.
- **Externe prijsdekking:** de interface communiceert expliciet dat uitkomsten schattingen op basis van beschikbare data zijn.

## Definition of done

- `npm run lint`, `npm run typecheck`, `npm test` en `npm run build` slagen.
- Het kernscenario is via Playwright afgedekt.
- Alle hoofdroutes hebben Nederlandse copy, responsieve states en toegankelijke interacties.
- Supabase-migrations, `.env.example`, seed-data en deploymentinstructies zijn aanwezig.
