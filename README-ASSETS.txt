МАТВЕЙ СЕЛЁДОЧНИК — ASSETS
Версия кода: 3.1-premium-chunked

РЕАЛЬНО ОПУБЛИКОВАНО

index.html
style.css
game.js
assets/core-v3-01.txt ... assets/core-v3-06.txt
— сжатое игровое ядро, которое загружает game.js.

assets/portrait-v3.txt
— встроенная оптимизированная фотография Матвея для стартового экрана.

ПРОЦЕДУРНО СОЗДАЁТСЯ В ИГРОВОМ ЯДРЕ

— улучшенная объёмная модель Матвея;
— палевый материал с фактурой шерсти;
— крупная голова, выразительные глаза, маска, щёки и складки;
— короткие крепкие лапы, синяя шлейка и закрученный хвост;
— контактная тень;
— деревянный пол, плитка, ткань и декоративные материалы;
— анимации ходьбы, бега, ожидания, нюхания, копания и сна;
— движение рта во время текстовых реплик.

НЕ СОЗДАНО И НЕ ВЫДАЁТСЯ ЗА ГОТОВОЕ

assets/matvey.glb
— точной профессиональной ригованной 3D-модели Матвея пока нет;
— без неё работает улучшенная процедурная модель;
— GLB подключается только при наличии корректных анимаций.

ГОЛОС МАТВЕЯ

Системный speechSynthesis по умолчанию отключён: браузеры и iPhone могут выбирать разные голоса, включая женский. Без фирменных MP3 игра показывает текстовые реплики и анимирует рот, но не подставляет случайный голос.

Ожидаемые голосовые файлы:
assets/audio/voice/voice-start.mp3
assets/audio/voice/voice-first-crumb.mp3
assets/audio/voice/voice-vacuum.mp3
assets/audio/voice/voice-beg.mp3
assets/audio/voice/voice-leash.mp3
assets/audio/voice/voice-door.mp3
assets/audio/voice/voice-smell-1.mp3
assets/audio/voice/voice-smell-2.mp3
assets/audio/voice/voice-smell-3.mp3
assets/audio/voice/voice-bed-watched.mp3
assets/audio/voice/voice-bed-free.mp3
assets/audio/voice/voice-dig.mp3
assets/audio/voice/voice-sleep.mp3
assets/audio/voice/voice-finale.mp3

МУЗЫКА И ОКРУЖЕНИЕ
assets/audio/music/home-theme.mp3
assets/audio/music/yard-theme.mp3
assets/audio/ambient/home-room.mp3
assets/audio/ambient/yard-birds.mp3

ЭФФЕКТЫ
assets/audio/sfx/steps-walk.mp3
assets/audio/sfx/steps-run.mp3
assets/audio/sfx/sniff.mp3
assets/audio/sfx/snort.mp3
assets/audio/sfx/whine.mp3
assets/audio/sfx/dig.mp3
assets/audio/sfx/jump.mp3
assets/audio/sfx/collect.mp3
assets/audio/sfx/achievement.mp3
assets/audio/sfx/door.mp3
assets/audio/sfx/vacuum.mp3
assets/audio/sfx/snore.mp3
assets/audio/sfx/ui-click.mp3

ПОВЕДЕНИЕ БЕЗ АУДИОФАЙЛОВ

— игра не падает;
— нет синтезированных пищалок и постоянного гула;
— нет женского системного голоса;
— реплики остаются текстовыми;
— игровые задания продолжают работать.
