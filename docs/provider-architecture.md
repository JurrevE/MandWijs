# Supermarktdata-provider

## Contract

Iedere bron implementeert `SupermarketDataProvider` met drie verantwoordelijkheden:

- ondersteunde ketens ophalen;
- fysieke filialen ophalen;
- aanbiedingen en normale prijzen synchroniseren naar de uniforme `Offer`-structuur.

De UI importeert nooit een provider rechtstreeks. `getSupermarketDataProvider()` kiest server-side de geconfigureerde implementatie en valt veilig terug op `DemoDataProvider`.

## DemoDataProvider

De demo-provider is deterministisch, heeft geen netwerk nodig en bevat:

- tien Nederlandse supermarktketens;
- voorbeeldfilialen rondom Utrecht;
- normale prijzen en verschillende actietypen;
- betrouwbare, vergelijkbare en huismerkmatches.

De demo is functioneel, maar vormt nadrukkelijk geen actuele prijsclaim.

## PrijsProfeetProvider

De adapter is bewust alleen als typed configuratiegrens opgenomen. Er zijn geen endpoints, responsevelden, sleutels of voorwaarden verzonnen.

Voor implementatie zijn nog nodig:

1. officiële API-documentatie en basis-URL;
2. authenticatiemethode en API-key;
3. lijst met ondersteunde ketens en filialen;
4. schema's voor normale prijzen, aanbiedingen, EAN's en geldigheid;
5. rate limits, time-outs en retry-advies;
6. data-verversingsfrequentie;
7. gebruiksvoorwaarden voor persoonlijk en eventueel commercieel gebruik.

Pas daarna kan de mapping in `src/providers/prijsprofeet-provider.ts` veilig worden ingevuld. De key blijft uitsluitend server-side in `PRIJSPROFEET_API_KEY`.

## Importregels

- Unieke sleutel: provider + bron-ID + keten + filiaal/landelijk + startdatum.
- Een herimport werkt bestaande rijen bij en maakt geen duplicaten.
- Een synchronisatie krijgt een `sync_runs`-record met status en aantallen.
- Foutieve losse records blokkeren een geldige restimport niet.
- Retries horen alleen plaats te vinden voor tijdelijke netwerk- en 5xx-fouten, met exponential backoff en jitter.
- Een provider-429 moet de aangegeven `Retry-After` respecteren.
- Onbekende velden blijven desgewenst in `raw_data`, maar worden nooit blind aan de client getoond.
