# The Assembly — testbed source

Ported from `assembly-playthrough.json` (run a3478fcc, ending "He Claimed the Set"), 2026-09-23. Bound to its own test pin `assembly-rooms-test` (map-locations.json + episode-locations.json, tier 1, passesTime false) so it never touches the real season pins.

Mapping: scene → Situation · choice → (Choice:3) picked option + two others, each with a one-line reaction · film → (Video:) · discovery/relationship/ending → Discovery/Relation/Memory. Package tags: "Sharpest Wit in the Room" → Sharpest Wit; "Small Fortune, Large Spirit" → Pride; tags are exactly the package tags ("Sharpest Wit in the Room", "Small Fortune, Large Spirit", "Weakness"); untagged options stay untagged. No invented trait stress.

Cast: new package-derived sprites `arabella2`, `sir_william2`, `capt_carter` (speakers Sir-William2 / Carter), generated from `portraits/` + `refs/` (video frames) in our sprite style; expression variants in `appearances/pride_<look>.png` (arabella2: attentive, cool, searching; mr_darcy: guarded, intent, exposed) — the engine does not switch them yet. Darcy stays our mr_darcy. `cd116929` (landscape ballroom) → `locations/assembly-rooms-test/explore/assembly.png` (`[bg:explore=assembly]`; the jpg copy in cutscenes/ is unused), right-side 9:16 crop, soft-focused lower half, for `[ui:cast-large]`.

Canon notes (testbed only, not in CANON.md): Bingley absent from the Meryton assembly and Darcy dances with Arabella there — both depart from ch. 3; Charlotte's wager and the cut-in are invented. Sir William / St James's (ch. 6), ten thousand a year (ch. 3), Georgiana sixteen (ch. 16) hold. `as_charlottes_bet.mp4` has burned-in subtitle text.
