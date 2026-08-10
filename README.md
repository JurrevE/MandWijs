# MandWijs

MandWijs is een mobile-first webapp voor Nederlandse consumenten die hun persoonlijke boodschappenlijst willen vergelijken op normale prijzen, aanbiedingen en het gewenste aantal winkelstops.

De MVP gebruikt desgewenst live PrijsProfeet-zoekdata en echte Supabase-accounts. Ontbreekt een endpoint, sleutel of migratie, dan blijft de app bruikbaar met een expliciet gemarkeerde demo-fallback.

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
- type-safe PrijsProfeet-provider op basis van de officiële OpenAPI-specificatie.

## Snel starten

Vereisten: Node.js 20.9 of hoger en npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Klik op **Bekijk de demo**, of registreer met een geldig e-mailadres en een wachtwoord van minimaal acht tekens. Met Supabase-configuratie worden accounts en persoonlijke data via RLS opgeslagen. Zonder Supabase gebruikt MandWijs een HTTP-only demosessie en localStorage.

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
src/components        toegankelijke, mobile-first UI en centrale app-state
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
| `SUPABASE_SERVICE_ROLE_KEY` | alleen server | Supabase Secret key (`sb_secret_...`) of legacy service-role voor cron/imports; nooit naar de browser |
| `PRICE_PROVIDER` | server | `demo` of `prijsprofeet` |
| `PRIJSPROFEET_API_KEY` | alleen server | optioneel voor zoeken, vereist voor gedocumenteerde Pro-endpoints |
| `PRIJSPROFEET_BASE_URL` | alleen server | standaard `https://www.prijsprofeet.nl` |
| `NOMINATIM_BASE_URL` | alleen server | geocodingendpoint; standaard publieke OSM-instance |
| `OVERPASS_API_URL` | alleen server | filiaalzoekendpoint; standaard publieke Overpass-instance |
| `OVERPASS_FALLBACK_API_URL` | alleen server | tweede publieke/beheerde instance bij tijdelijke 429/5xx |
| `LOCATION_PROVIDER_USER_AGENT` | alleen server | herkenbare appnaam en contact voor OSM-services |
| `RESEND_API_KEY` | alleen server | echte e-mailverzending |
| `RESEND_FROM_EMAIL` | alleen server | geverifieerde afzender |
| `CRON_SECRET` | alleen server | Bearer-auth voor cronroutes |
| `NEXT_PUBLIC_APP_URL` | client/server | canonieke app-URL en auth-redirects |
| `SHOPPING_STORE_PENALTY_CENTS` | server | balanspenalty; standaard 300 cent |

Kopieer `.env.example` naar `.env.local`. Commit nooit `.env.local`, service-role keys of providerkeys.

## Supabase instellen

1. Kopieer de Supabase-project-URL en anon key naar `.env.local`.
2. Installeer de Supabase CLI en koppel het project: `supabase link --project-ref <ref>`.
3. Voer `supabase db push` uit. Dit draait alle migraties in oplopende volgorde, inclusief de accountbackfill en de tabel voor voorkeuren van OpenStreetMap-filialen. Voer daarna desgewenst `supabase db seed` uit. Zonder CLI kun je de SQL-bestanden uit `supabase/migrations` in oplopende volgorde in de Supabase SQL Editor uitvoeren, gevolgd door `supabase/seed.sql`.
4. Voeg in Supabase Auth de lokale en productie redirect-URL's toe:
   - `http://localhost:3000/auth/callback`
   - `https://jouw-domein.nl/auth/callback`
5. Schakel voor Google OAuth de Google-provider in en configureer de client-ID/secret in Supabase, niet in de frontend.
6. Maak de eerste admin bewust via SQL: `update public.profiles set role = 'admin' where id = '<auth-user-uuid>';`.

RLS zorgt ervoor dat gebruikers alleen hun eigen profiel, producten, voorkeuren en lijsten zien. Ingelogde gebruikers mogen globale winkel- en prijsdata lezen; alleen admins mogen die aanpassen. Server Actions leiden `user_id` altijd af uit de sessie.

## PrijsProfeet instellen

Zet voor live prijsdata in `.env.local`:

```dotenv
PRICE_PROVIDER=prijsprofeet
PRIJSPROFEET_BASE_URL=https://www.prijsprofeet.nl
PRIJSPROFEET_TIER=free
PRIJSPROFEET_API_KEY=jouw_gratis_key
```

De publieke zoek- en filterendpoints werken ook zonder key. Een gratis key verhoogt de eigen requestlimiet en laat MandWijs maximaal twaalf relevante zoekhits per synchronisatie opnieuw controleren via `GET /api/v1/products/{id}`. De key wordt uitsluitend server-side als `X-API-Key` verstuurd. Zet `PRIJSPROFEET_TIER` alleen op `pro` wanneer de key werkelijk een Pro-abonnement heeft; uitsluitend dan gebruikt de provider `/match/*`. De app vraagt alleen actieve promoties op en filtert verlopen of toekomstige aanbiedingen defensief weg. Omdat de OpenAPI-specificatie voor matchresponses geen concrete velden definieert, worden die resultaten niet blind gemapt. Alleen een exacte EAN of provider-ID geldt als exacte match; naam-/merkmatches zijn indicatief.

Op schermen met live prijsdata staat een klikbare bronvermelding naar PrijsProfeet. Bewaar providerdata niet langer dan de door PrijsProfeet toegestane cacheperiode.

PrijsProfeet documenteert geen filiaalendpoint. MandWijs houdt de landelijke ketenprijzen daarom gescheiden van de locatiebron en koppelt een prijs pas aan het dichtstbijzijnde ingeschakelde filiaal van die keten binnen de gekozen straal. Bij een ontbrekende key, endpointfout of ongeldige response schakelt de prijsprovider terug naar demo-data en toont de UI die status.

## Locaties en filialen

Handmatige Nederlandse adressen en postcodes worden na een expliciete gebruikersactie server-side geocodeerd met Nominatim. Filialen worden daarna via Overpass opgehaald met `shop=supermarket`, opnieuw lokaal met Haversine gecontroleerd en beperkt tot de tien door de prijsprovider ondersteunde ketens. Browserlocatie slaat de geocodestap over. De app gebruikt geen adres-autocomplete en voert geen periodieke of systematische locatiezoekopdrachten uit.

De upstream verzoeken worden gevalideerd, hebben timeouts en een herkenbare `User-Agent`. Nominatim-resultaten worden dertig dagen gecachet, filiaalresultaten één dag. Straal 1, 2 en 5 km delen één 5 km-upstreamquery en worden daarna lokaal exact gefilterd. De publieke Nominatim-instance staat maximaal één request per seconde toe voor de hele app; de implementatie serialiseert cachemisses binnen één serverproces. Tijdelijke Overpass 429/5xx-responses worden één keer via een configureerbare tweede instance geprobeerd, nooit parallel; een succesvolle instance krijgt daarna in dat proces voorrang. Bekijk voor productie altijd opnieuw de [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/), de [Overpass capaciteitsrichtlijnen](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html) en de actuele [lijst met publieke instances](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances). Voor grotere of betaalde uitrol moeten de locatie-endpoints naar beheerde of eigen instances wijzen.

Filiaaldata toont op ieder relevant scherm de verplichte [OpenStreetMap-attributie](https://www.openstreetmap.org/copyright). Een landelijke prijs betekent niet dat voorraad in een specifiek filiaal is bevestigd.

## E-mail en cron

De templates ondersteunen `summary` en `full`. De endpoint `/api/cron/weekly-email` accepteert alleen `Authorization: Bearer <CRON_SECRET>`, gebruikt een idempotentiesleutel per gebruiker/week en laat Resend dezelfde sleutel ook controleren. Per account worden de actieve, nog niet afgevinkte lijstregels, aantallen, keten- en filiaalvoorkeuren, maximale winkelstops, live PrijsProfeet-resultaten en OpenStreetMap-filialen binnen de straal verwerkt. De cron verstuurt bewust niets wanneer alleen demo-prijzen of geen betrouwbare matches beschikbaar zijn.

`vercel.json` plant maandag 07:00 UTC. Voor een vaste Nederlandse lokale ochtend moet rekening worden gehouden met zomer-/wintertijd; gebruik zo nodig twee UTC-schema's met een tijdzonecontrole in de handler.

Voor echte verzending:

1. verifieer een afzenderdomein bij Resend;
2. stel `RESEND_API_KEY` en `RESEND_FROM_EMAIL` in;
3. stel in `SUPABASE_SERVICE_ROLE_KEY` bij voorkeur een nieuwe Supabase Secret key (`sb_secret_...`) in, of anders de legacy `service_role`; uitsluitend server-side;
4. stel een willekeurige `CRON_SECRET` van minimaal zestien tekens in bij Vercel;
5. zet `PRICE_PROVIDER=prijsprofeet` en configureer de PrijsProfeet-variabelen;
6. deploy opnieuw zodat Vercel de planning activeert.

Test eerst zonder verzending voor Ã©Ã©n account. Het `userId` is de UUID uit Supabase Authentication:

```powershell
$headers = @{ Authorization = "Bearer $env:CRON_SECRET" }
Invoke-RestMethod -Headers $headers -Uri "http://localhost:3000/api/cron/weekly-email?dryRun=true&userId=<user-uuid>"
```

Een dry-run leest en berekent alles, maar roept Resend niet aan en schrijft geen verzendhistorie. Verwijder `dryRun=true` pas nadat de preview een realistisch totaal, `matched`-aantal en winkelplan toont. Vercel stuurt `CRON_SECRET` bij geplande uitvoeringen automatisch als Bearer-header. Resend en de database-idempotentiesleutel voorkomen dubbele verzendingen binnen dezelfde week.

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

- Filialen komen uit OpenStreetMap en kunnen onvolledig of verouderd zijn. MandWijs toont alleen ondersteunde ketens met coördinaten en verzint ontbrekende filialen niet.
- De concrete responsevelden van `/match/*` zijn niet gedocumenteerd en worden bewust niet als betrouwbare productdata gemapt.
- De Vercel-planning gebruikt UTC; 07:00 UTC is afhankelijk van zomer-/wintertijd 08:00 of 09:00 in Nederland.
- Browserlocatie wordt niet reverse-geocodeerd; het label blijft daarom “Huidige locatie”. Handmatige invoer wordt wel geocodeerd na bevestiging.
- Er is nog geen voorraadcontrole, reiskostenberekening of routeoptimalisatie.
- Prijsvergelijking is primair per stuk; genormaliseerde kg/liter/100g-prijzen staan op de roadmap.

## Wat moet later nog worden gebouwd?

De actuele, afvinkbare backlog staat in [`docs/todo.md`](docs/todo.md), inclusief
de volledige checklist om de maandagmail gecontroleerd live te zetten.

- persistente, periodieke PrijsProfeet-import voor globale prijshistorie en adminrapportage;
- een eigen of beheerde Nominatim/Overpass-instance zodra het gebruik boven een bescheiden MVP uitkomt;
- ondertekende one-click unsubscribe en bounce-/complaintverwerking;
- handmatige admin-matchcorrectie als persistente mutatie;
- voorraadindicatie en prijs per kg/liter/100 gram;
- telemetry, foutmonitoring en een expliciete privacy-/retentiepagina;
- uitgebreider E2E-pakket tegen een geïsoleerd Supabase-testproject.

## Menselijke input die nog nodig is

- het uitvoeren van de meegeleverde migraties en seed in het gekoppelde Supabase-project;
- een server-side Supabase Secret key of legacy service-role voor geplande globale imports en beheer (niet nodig voor normale account-CRUD);
- Google OAuth clientconfiguratie;
- een PrijsProfeet Pro-key wanneer EAN-match- of prijshistorie-endpoints worden geactiveerd;
- Resend API-key en geverifieerd afzenderdomein;
- definitieve productie-URL en keuze voor het privacybeleid.
