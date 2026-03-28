# TODO — Grzybodziad

## Nowe mechaniki

### Wolne psucie się (ulepszenie)
Nowe ulepszenie w sklepie (osobne od "Pojemny koszyk") — wydłuża czas świeżości zasobów w koszyku.
- Efekt: +5s/poziom na `BASKET_SPOIL_TIME` (bazowo 15s w `constants.ts`)
- Dodać jako kolejne ulepszenie w `upgrades.ts`

### Bonus za odległość od domku
Zasoby w dalszych strefach łąki powinny być warte więcej punktów — żeby opłacało się ryzykować daleką wyprawę.
- Strefy odległości od `hut` z mnożnikami (np. 1x, 1.5x, 2x)
- Opcjonalnie: wizualne oznaczenie stref (kolor trawy, shimmer na zasobach)
- Alternatywnie: rzadkie zasoby (kwiatki) częściej w dalszych strefach

## Assety

### Ręcznie rysowane budynki
Narysować odręcznie wszystkie 3 budynki żeby komunikowały swoją funkcję:
- `hut` (sklep z ulepszeniami) — narzędzia, wzmacniacz
- `costume_hut` (sklep z przebraniami) — kolorowe ciuchy, wieszak
- `skup_hut` (skup zasobów) — lada z monetą, skrzynki

Pipeline: export PNG → `public/assets/` → wczytać w `Preloader.ts` → usunąć `generateTexture` z `Boot.ts`

### Dźwięki i efekty dźwiękowe
Załadować w `Preloader.ts`, odtwarzać przez `this.sound.play('nazwa')`.

**Zbieranie** (`GameScene.ts`):
- Podnoszenie zasobu — miły dźwięk, inny dla każdego typu
- Podnoszenie śmiecia — inny, mniej przyjemny

**Budynki** (`GameScene.ts` update):
- Wejście do sklepu z ulepszeniami — dzwonek / drzwi
- Wejście do sklepu z przebraniami — wesoły dźwięk
- Wejście do skupu — kasa / targowisko

**Sklep** (`Shop.ts`):
- Kupno ulepszenia — "ding" / kasa
- Za mało monet — dźwięk odmowy

**Skup** (`Skup.ts`):
- Kliknięcie "sprzedaj" — dźwięk monety
- Animacja latających monet przy sprzedaży

**Śmieci:**
- Wrzucenie do kubła — "plum" / klapnięcie pokrywy
