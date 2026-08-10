# Kopert

Kopert is een mobile-first webapp voor Nederlandse consumenten die hun persoonlijke boodschappenlijst willen vergelijken op normale prijzen, aanbiedingen en het gewenste aantal winkelstops.

De MVP is direct bruikbaar met transparante demo-data. Supabase, een externe prijsprovider en Resend zijn optionele productie-aansluitingen; ontbrekende credentials laten de app niet crashen.

## Wat werkt

- moderne Nederlandstalige landing page;
- e-mail/wachtwoordauth, Google OAuth-configuratie, reset en veilige demo-sessie;
- onboarding voor naam, locatie, radius, ketens, eerste product en maandagmail;
- persoonlijke producten toevoegen, bewerken, pauzeren, verwijderen, zoeken en categoriseren;
- locatie/radius, browserlocatie met handmatige fallback en keten-/filiaalvoorkeuren;
- uniforme normale prijzen en aanbiedingen met effectieve stukprijs en minimumaantallen;
- uitlegbare productmatching: exact, vergelijkbaar, huismerk en geen match;
- herbruikbare boodschappenlijst met hoeveelheden en afvinken;
- vier strategieën: laagste prijs, maximaal twee winkels, minste winkels en beste balans;
- dashboard met prijsindicatie, datastatus, relevante winkels en weekmailstatus;
- twee e-mailvarianten en een idempotente, beschermde maandagcron;
- beschermde admininterface voor imports, matches, ketens, testmail en demo-reset;
- Supabase-migration met indexes, constraints en Row Level Security.

## Snel starten

Vereisten: Node.js 20.9 of hoger en npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Klik op **Bekijk de demo**, of registreer met een willekeurig geldig e-mailadres en een wachtwoord van minimaal acht tekens. Zolang Supabase niet is geconfigureerd gebruikt Kopert een HTTP-only demo-sessie en localStorage voor niet-gevoelige demovoorkeuren.

## Commands

```bash
npm run dev          # lokale ontwikkelserver
npm run lint         # ESLint
npm run typecheck    # strikte TypeScript-check
npm test             # Vitest-unit/integratietests
npm run test:e2e     # Playwright-kernscenario op desktop en mobiel
npm run build        # productiebuild
npm start            # gebouwde productieversie
```

Installeer voor de eerste E2E-run eventueel Chromium:

```bash
npx playwright install chromium
```

## Architectuur

```text
src/app               Next.js routes, Server Actions en Route Handlers
src/components        toegankelijke, mobile-first UI en demo-state
src/domain            pure prijs-, match-, afstands- en optimalisatielogica
src/providers         verwisselbare supermarktdata-providers
src/emails            provider-onafhankelijke HTML-templates
supabase/migrations   PostgreSQL-schema, constraints en RLS
supabase/seed.sql     idempotente keten-, categorie- en filialseed
e2e                   Playwright-kernscenario
```

Prijslogica, matching, Haversine-afstand en optimalisatie zijn pure services. Daardoor zijn ze onafhankelijk van React, Supabase en de prijsprovider te testen. De providerarchitectuur staat verder beschreven in [docs/provider-architecture.md](docs/provider-architecture.md).

## Environment variables

| Variabele | Waar | Doel |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client/server | Supabase-project-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client/server | publieke anon key, in combinatie met RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | alleen server | cron, imports en beheer; nooit naar de browser |
| `PRICE_PROVIDER` | server | `demo` of later `prijsprofeet` |
| `PRIJSPROFEET_API_KEY` | alleen server | externe providercredential |
| `PRIJSPROFEET_BASE_URL` | alleen server | uitsluitend uit officiële documentatie |
| `RESEND_API_KEY` | alleen server | echte e-mailverzending |
| `RESEND_FROM_EMAIL` | alleen server | geverifieerde afzender |
| `CRON_SECRET` | alleen server | Bearer-auth voor cronroutes |
| `NEXT_PUBLIC_APP_URL` | client/server | canonieke app-URL en auth-redirects |
| `SHOPPING_STORE_PENALTY_CENTS` | server | balanspenalty; standaard 300 cent |

Kopieer `.env.example` naar `.env.local`. Commit nooit `.env.local`, service-role keys of providerkeys.

## Supabase instellen

1. Maak een Supabase-project en kopieer de project-URL en anon key naar `.env.local`.
2. Installeer de Supabase CLI en koppel het project: `supabase link --project-ref <ref>`.
3. Voer `supabase db push` uit. Lokaal kan `supabase db reset` de migration plus seed draaien.
4. Voeg in Supabase Auth de lokale en productie redirect-URL's toe:
   - `http://localhost:3000/auth/callback`
   - `https://jouw-domein.nl/auth/callback`
5. Schakel voor Google OAuth de Google-provider in en configureer de client-ID/secret in Supabase, niet in de frontend.
6. Maak de eerste admin bewust via SQL: `update public.profiles set role = 'admin' where id = '<auth-user-uuid>';`.

RLS zorgt ervoor dat gebruikers alleen hun eigen profiel, producten, voorkeuren en lijsten zien. Ingelogde gebruikers mogen globale winkel- en prijsdata lezen; alleen admins mogen die aanpassen. Server Actions leiden `user_id` altijd af uit de sessie.

## E-mail en cron

De templates ondersteunen `summary` en `full`. De endpoint `/api/cron/weekly-email` accepteert alleen `Authorization: Bearer <CRON_SECRET>`, gebruikt een idempotentiesleutel per gebruiker/week en laat Resend dezelfde sleutel ook controleren.

`vercel.json` plant maandag 07:00 UTC. Voor een vaste Nederlandse lokale ochtend moet rekening worden gehouden met zomer-/wintertijd; gebruik zo nodig twee UTC-schema's met een tijdzonecontrole in de handler.

Voor echte verzending:

1. verifieer een afzenderdomein bij Resend;
2. stel `RESEND_API_KEY` en `RESEND_FROM_EMAIL` in;
3. stel `CRON_SECRET` in bij Vercel;
4. vul de live optimizerquery in de cronhandler met de Supabase-lijst- en offerdata.

## Vercel deployment

1. Importeer de GitHub-repository in Vercel.
2. Framework preset: Next.js; buildcommand: `npm run build`.
3. Voeg alle relevante environment variables toe per Preview/Production.
4. Deploy en voeg de productie-URL toe aan Supabase Auth redirects.
5. Controleer `/dashboard`, een Google-login, de RLS-policies en een handmatig aangeroepen cron met een geldige Bearer-header.

## Security-notities

- Alleen de Supabase anon key mag publiek zijn; service-role/provider/Resend keys zijn server-only.
- Zod valideert authinput; het databaseschema valideert prijzen, datums, radius en hoeveelheden opnieuw.
- Redirects accepteren alleen interne paden.
- Import- en cronroutes moeten met secrets of adminsessies zijn beschermd.
- RLS is standaard ingeschakeld op alle gevoelige tabellen.
- De UI doet geen claim “altijd de goedkoopste”: data kan onvolledig zijn.

## Bekende beperkingen

- De huidige schermdata komt uit `DemoDataProvider`; ze is geen actuele supermarktprijs.
- PrijsProfeet is niet geïmplementeerd zonder officiële documentatie en gebruiksvoorwaarden.
- De cron bevat de veilige verzendgrens, maar de live optimizerquery moet bij aansluiting op Supabase worden ingevuld.
- Browserlocatie wordt in demo-modus niet reverse-geocodeerd; handmatige invoer gebruikt Utrecht als demo-coördinaat.
- Er is nog geen voorraadcontrole, reiskostenberekening of routeoptimalisatie.
- Prijsvergelijking is primair per stuk; genormaliseerde kg/liter/100g-prijzen staan op de roadmap.

## Wat moet later nog worden gebouwd?

- officiële PrijsProfeet-mapping na controle van endpoints, rate limits en licentie;
- Supabase-repository voor live CRUD in plaats van de lokale demo-store;
- server-side geocoding met privacyvriendelijke opslag;
- volledige weekmailquery en ondertekende one-click unsubscribe;
- handmatige admin-matchcorrectie als persistente mutatie;
- voorraadindicatie en prijs per kg/liter/100 gram;
- telemetry, foutmonitoring en een expliciete privacy-/retentiepagina;
- uitgebreider E2E-pakket tegen een geïsoleerd Supabase-testproject.

## Menselijke input die nog nodig is

- Supabase project-URL, anon key en server-side service-role key;
- Google OAuth clientconfiguratie;
- officiële PrijsProfeet-documentatie, API-key en toestemming voor het beoogde gebruik;
- Resend API-key en geverifieerd afzenderdomein;
- definitieve productie-URL en keuze voor het privacybeleid.
