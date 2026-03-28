# Grzybodziad — Instrukcje dla Claude

## Czym jest ta gra?
Gra 2D w Phaser 3 o zbieraniu zasobów. Gracz chodzi po łące i zbiera grzyby, jagody i kwiatki, a potem wydaje punkty na ulepszenia w sklepie. Gra jest tworzona razem z ~8-letnim dzieckiem — utrzymuj kod prosty!

## Stack technologiczny
- **Silnik**: Phaser 3.90+ (NIE Phaser 4 — jeszcze RC)
- **Język**: TypeScript (strict mode, ale `noUnusedLocals: false`)
- **Build**: Vite 6 z osobnymi konfiguracjami w katalogu `vite/`
- **Deploy**: GitHub Pages via GitHub Actions (push do main → auto-deploy)
- **URL gry**: https://rogatty.github.io/grzybodziad/

## Komendy
```bash
npm run dev      # Dev server na porcie 8080 z hot-reload
npm run build    # Build produkcyjny do dist/
npm run preview  # Podgląd buildu produkcyjnego
```

## Struktura projektu
```
src/game/
  main.ts              # Konfiguracja Phaser.Game (800x600, physics, sceny)
  scenes/
    Boot.ts            # Generuje placeholder tekstury jako kolorowe kształty
    Preloader.ts       # Pasek ładowania, wczytuje assety z dysku
    MainMenu.ts        # Ekran tytułowy z przyciskiem "GRAJ"
    GameScene.ts       # Główna rozgrywka (zbieranie, timer, shop button)
    Shop.ts            # Sklep z ulepszeniami (pauza gry)
    GameOver.ts        # Podsumowanie rundy
  objects/
    Player.ts          # Gracz — klawiatura + dotyk
    Resource.ts        # Zasoby (grzyb, jagoda, kwiatek)
  data/
    constants.ts       # Stałe balansowania gry
    upgrades.ts        # Definicje ulepszeń
public/assets/         # Assety gry (PNG, spritesheety) — tutaj wkładaj gotowe obrazki
raw-assets/            # Surowe rysunki z tabletu (GITIGNORED — nie commituj!)
```

## Słownik Polsko-Angielski (kod vs UI)

Kod jest w angielskim — kiedy dziecko mówi po polsku, tłumacz na angielskie nazwy:

| Polskie (dziecko mówi) | Angielskie (w kodzie) | Gdzie szukać |
|---|---|---|
| grzyb | mushroom | `constants.ts`, `Boot.ts` |
| jagoda | berry | `constants.ts`, `Boot.ts` |
| kwiatek | flower | `constants.ts`, `Boot.ts` |
| gracz / postać | Player | `objects/Player.ts` |
| sklep | Shop | `scenes/Shop.ts` |
| ulepszenie | upgrade | `data/upgrades.ts` |
| łąka / plansza | GameScene | `scenes/GameScene.ts` |
| menu | MainMenu | `scenes/MainMenu.ts` |
| koniec gry | GameOver | `scenes/GameOver.ts` |
| szybkie buty | speed (upgrade id) | `upgrades.ts` |
| duży koszyk | radius (upgrade id) | `upgrades.ts` |
| szczęśliwa łąka | spawns (upgrade id) | `upgrades.ts` |
| punkty | score | `GameScene.ts` |
| czas | timeLeft | `GameScene.ts` |
| runda | round | ogólnie |

## Konwencje kodu
- Jeden plik = jedna scena lub jedna klasa
- Pliki scen: PascalCase (`GameScene.ts`)
- Wszystkie assety ładowane w `Preloader.ts`, nie w poszczególnych scenach
- Stan gry (punkty, ulepszenia) w `this.registry` — dostępny ze wszystkich scen
- **UI w języku polskim** — etykiety przycisków, opisy, komunikaty
- Nie dodawaj złożonej logiki — 8-latek powinien rozumieć co robi gra

## Placeholder assety
Na początku tekstury są generowane w `Boot.ts` jako kolorowe kształty. Kiedy pojawią się prawdziwe rysunki:
1. Zapisz PNG w `public/assets/`
2. Wczytaj go w `Preloader.ts` przez `this.load.image('nazwa', 'assets/plik.png')`
3. W `Boot.ts` usuń odpowiednie `generateTexture()`

## Pipeline assetów (ręcznie rysowane)
- Tablet → eksport PNG → zmień rozmiar max 256×256 → `public/assets/`
- Duże pliki źródłowe (.psd, .procreate) → `raw-assets/` (gitignored)
- Do spritesheetów: darmowy TexturePacker lub ShoeBox

## Workflow zdalny
- Każdy push do `main` → automatyczny deploy na GitHub Pages
- Gra dostępna pod https://rogatty.github.io/grzybodziad/ z każdego urządzenia
- Edycja przez Claude web: claude.ai/code
- **Ważne po pierwszym deploy**: w ustawieniach repo GitHub → Pages → Source: "GitHub Actions"

## Uwagi do debugowania
- W `src/game/main.ts` zmień `arcade: { debug: false }` na `debug: true` żeby zobaczyć hitboksy
- Prędkość gracza: `PLAYER_BASE_SPEED` w `constants.ts`
- Częstotliwość spawnu: `RESOURCE_SPAWN_INTERVAL` w `constants.ts`
- Czas rundy: `ROUND_DURATION` w `constants.ts`
