# MandWijs - openstaande taken

Dit document is de praktische backlog voor werk dat nog menselijke configuratie,
productkeuzes of verdere implementatie nodig heeft.

## Maandagmail live zetten

De applicatiecode voor de maandagmail is al aanwezig: de e-mailtemplates, de
weekplanning, de beveiligde cronroute, een admin-preview, dry-run-ondersteuning
en bescherming tegen dubbel verzenden zijn geimplementeerd en getest.

### Benodigd voor de eerste echte verzending

- [ ] Maak een Resend-account aan en verifieer een eigen afzenderdomein.
- [ ] Maak in Resend een API-key aan voor MandWijs.
- [ ] Haal in Supabase een server-side Secret key (`sb_secret_...`) op. Gebruik
      alleen als alternatief de legacy `service_role` key.
- [ ] Maak een willekeurige `CRON_SECRET` van minimaal 16 tekens.
- [ ] Controleer dat live PrijsProfeet-data actief is. De cron verstuurt bewust
      niets als er uitsluitend demo-prijzen of geen betrouwbare matches zijn.
- [ ] Voeg de volgende variabelen toe aan de lokale `.env` en later aan Vercel:

  ```env
  SUPABASE_SERVICE_ROLE_KEY=
  RESEND_API_KEY=
  RESEND_FROM_EMAIL=MandWijs <weekmail@jouw-geverifieerde-domein.nl>
  CRON_SECRET=
  PRICE_PROVIDER=prijsprofeet
  PRIJSPROFEET_TIER=free
  PRIJSPROFEET_API_KEY=
  NEXT_PUBLIC_APP_URL=https://jouw-productiedomein.nl
  ```

  De service-, Resend-, cron- en PrijsProfeet-keys zijn uitsluitend server-side.
  Zet ze nooit in een variabele die met `NEXT_PUBLIC_` begint en commit `.env`
  nooit naar Git.

### Gecontroleerd testen

- [ ] Start MandWijs lokaal met `npm run dev`.
- [ ] Log in met een echt Supabase-account dat maandagmail heeft ingeschakeld en
      minimaal een actief, niet-afgevinkt product op de boodschappenlijst heeft.
- [ ] Open als admin de weekmail-preview via `/admin` en controleer producten,
      matches, winkels, bedragen en het e-mailadres.
- [ ] Zoek de UUID van het testaccount in Supabase onder Authentication > Users.
- [ ] Voer eerst een dry-run uit. Deze verstuurt niets en schrijft geen
      verzendhistorie:

  ```powershell
  $headers = @{ Authorization = "Bearer $env:CRON_SECRET" }
  Invoke-RestMethod `
    -Headers $headers `
    -Uri "http://localhost:3000/api/cron/weekly-email?dryRun=true&userId=<user-uuid>"
  ```

- [ ] Controleer dat de dry-run echte prijsdata, minstens een betrouwbare match
      en een realistisch winkelplan teruggeeft.
- [ ] Voer daarna voor hetzelfde testaccount een eenmalige echte verzending uit
      door `dryRun=true` uit de URL te verwijderen.
- [ ] Controleer ontvangst, onderwerp, opmaak, links en de rij in
      `public.weekly_email_deliveries`.
- [ ] Herhaal dezelfde aanroep en bevestig dat de idempotentiebeveiliging geen
      tweede mail voor dezelfde gebruiker en week verstuurt.

### Productie activeren

- [ ] Voeg alle bovenstaande server-side variabelen toe aan de Production- en,
      indien gewenst, Preview-omgeving van Vercel.
- [ ] Deploy de actuele `main`-branch opnieuw.
- [ ] Controleer in Vercel dat `/api/cron/weekly-email` volgens `vercel.json` op
      maandag om 07:00 UTC wordt aangeroepen.
- [ ] Controleer na de eerste geplande run de Vercel-logs, Resend-status en
      `public.weekly_email_deliveries`.
- [ ] Beslis of 07:00 UTC voldoende is. Dat is in Nederland afhankelijk van
      zomer- of wintertijd 08:00 of 09:00 lokaal.

### Later verbeteren

- [ ] Voeg een ondertekende one-click unsubscribe toe.
- [ ] Verwerk Resend bounces en complaints via webhooks.
- [ ] Voeg monitoring en waarschuwingen toe voor mislukte cronruns of verzendingen.
- [ ] Kies een vaste Nederlandse lokale verzendtijd en handel zomer-/wintertijd
      expliciet af.
- [ ] Voeg een end-to-endtest toe tegen een geisoleerd Supabase-testproject en
      een veilige e-mailtestomgeving.

## Overige backlog

- [ ] Bouw een periodieke PrijsProfeet-import voor prijshistorie en adminrapportage.
- [ ] Stap bij groei over op een beheerde of eigen locatieprovider.
- [ ] Maak handmatige productmatchcorrecties persistent.
- [ ] Voeg voorraadindicatie en genormaliseerde prijzen per kg, liter of 100 gram toe.
- [ ] Voeg telemetry, foutmonitoring en een privacy-/retentiepagina toe.

