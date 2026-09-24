Drop audio here, then press "Import" in the editor's Audio panel (or POST /api/author/audio-import).

Naming: `<kind>.<name>__<variant>.mp3`  e.g.  `amb.ballroom__pack2.mp3`, `sfx.tap__wood.mp3`, `music.darcy_theme__v1.mp3`
kinds: amb · sfx · music · voice. Subfolders are fine (`sfx/tap__wood.mp3` also works). mp3 / m4a / wav accepted (wav is kept as-is; convert to mp3 first if size matters).
Each file becomes a variant of its slot (new slots are created), the manifest is updated, and the file is moved to audio/<kind>/. The active variant is not changed by an import.
