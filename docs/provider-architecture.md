# Supermarktdata-provider

## Contract en fallback

Iedere bron implementeert `SupermarketDataProvider` voor ketens, winkels en uniforme `Offer`-records. De UI spreekt providers nooit rechtstreeks aan. De server kiest op basis van `PRICE_PROVIDER` de `PrijsProfeetProvider` of `DemoDataProvider`.

`syncOffersWithFallback()` vangt een ontbrekende configuratie, netwerkfout, ongeldige response of niet-beschikbaar endpoint af en retourneert dan deterministische demo-data met `source: "demo"` en een zichtbare waarschuwing. Daardoor presenteert de app fallback-data nooit als live data.

## PrijsProfeetProvider

De implementatie volgt uitsluitend de aangeleverde OpenAPI 3.1-specificatie. De gebruikte endpoints zijn:

- `GET /api/v1/filter-stats` voor beschikbare retailers;
- `GET /api/v1/search` voor actieve promoties;
- `GET /api/v1/products/search/{query}` voor normale en promotionele productprijzen;
- `GET /api/v1/products/{id}` om een selectie van zoekhits met een gratis key te bevestigen;
- `GET /api/v1/match/ean/{ean}` alleen wanneer `PRIJSPROFEET_TIER=pro` en een server-side Pro-key aanwezig zijn.

De zoekresponses worden bij runtime met Zod gevalideerd en daarna naar het interne `Offer`-type gemapt. Verzoeken hebben een timeout, een herkenbare `User-Agent` en optioneel de server-only header `X-API-Key`. De key bereikt nooit een Client Component of browserresponse.

Publieke zoekendpoints zijn zonder key bruikbaar. Met `PRIJSPROFEET_TIER=free` verhoogt de key de eigen requestlimiet; hij ontgrendelt geen extra endpoints. MandWijs gebruikt de extra capaciteit om maximaal twaalf relevante EAN-zoekhits via het gedocumenteerde productdetail te bevestigen. De documentatie markeert `/match/*` als Pro-functionaliteit. De structurele OpenAPI-schema's van matchresponses zijn echter alleen een vrij object zonder gedocumenteerde velden. Daarom kan `matchByEan()` uitsluitend in de expliciete Pro-configuratie de ruwe server-side response ophalen, maar mapt MandWijs daar geen verzonnen productvelden uit.

## Actualiteit en matching

- Zoekopdrachten gebruiken `promotion_status=active`.
- Meerwoordige productnamen krijgen naast de volledige zoekterm één bredere merkzoekopdracht. Resultaten worden daarna lokaal streng gematcht; de bredere response wordt nooit op zichzelf als exacte match gezien.
- `matchByEan()` stuurt standaard `current_only=true`.
- Een verlopen of toekomstige promotie wordt niet als actuele aanbieding geïmporteerd.
- Alleen een gelijke EAN of providerproduct-ID is een exacte match.
- Een EAN die via een betrouwbare naam-match bij één retailer is gevonden, mag gelijknamige EAN-resultaten van andere retailers verbinden, maar blijft indicatief zolang de gebruiker zelf geen verwachte EAN heeft vastgelegd.
- Naam-, merk- en categorieresultaten zijn vergelijkbaar of indicatief, nooit een gegarandeerde EAN-match.
- Een categorie-overeenkomst zonder productnaamovereenkomst levert geen match op.

## Winkels en geografische dekking

De OpenAPI-specificatie bevat retailers maar geen fysiek filiaalendpoint of coördinaten. Winkeldata loopt daarom via een onafhankelijke `OpenStreetMapLocationProvider`:

- Nominatim geocodeert alleen na een expliciete adres-/postcodezoekactie, met `countrycodes=nl`, `limit=1` en zonder autocomplete;
- Overpass zoekt `shop=supermarket` binnen maximaal 25 kilometer;
- Zod valideert beide externe responses;
- alleen ketens die ook door de prijsprovider worden ondersteund worden gemapt;
- OSM nodes, ways en relations krijgen stabiele externe IDs (`osm:<type>:<id>`);
- coördinaten worden defensief opnieuw met Haversine tegen de gekozen straal gecontroleerd;
- duplicaten op keten + adres of keten + afgeronde coördinaten worden verwijderd.

Landelijke ketenprijzen blijven landelijke records. Voor het winkelplan kiest `localizeShoppingOptions()` per keten het dichtstbijzijnde ingeschakelde filiaal binnen de radius. Daardoor wordt dezelfde landelijke prijs niet kunstmatig over ieder filiaal vermenigvuldigd. Als het dichtstbijzijnde filiaal wordt uitgeschakeld, schuift het volgende filiaal van die keten door.

Nominatim-GETs worden dertig dagen server-side gecachet en binnen één proces tot maximaal één cachemiss per seconde geserialiseerd. Overpass-POSTs worden één dag gecachet. Bij een tijdelijke 429 of 5xx wordt sequentieel één configureerbare mirror geprobeerd. De endpoints en herkenbare `User-Agent` zijn via environmentvariabelen verwisselbaar. De publieke instances zijn bedoeld voor een bescheiden MVP; een grotere productie-uitrol vereist beheerde of eigen capaciteit. OSM-attributie wordt op alle schermen met winkeldata getoond.

## Importregels voor een toekomstige globale sync

- Unieke sleutel: provider + bron-ID + keten + filiaal/landelijk + startdatum.
- Een herimport werkt bestaande rijen bij en maakt geen duplicaten.
- Iedere synchronisatie krijgt een `sync_runs`-record met status en aantallen.
- Foutieve losse records blokkeren een geldige restimport niet.
- Retries horen alleen bij tijdelijke netwerk- en 5xx-fouten, met exponential backoff en jitter.
- Een provider-429 moet `Retry-After` respecteren.
- Onbekende velden kunnen server-side in `raw_data` blijven, maar worden niet blind aan de client getoond.
