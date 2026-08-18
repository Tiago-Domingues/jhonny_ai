---
name: turkey-poem
description: >
  Write a short poem about Türkiye (the country, also called Turkey) from the
  user's given context. Use when the user asks for a poem, verse, haiku,
  limerick, sonnet, rhyme, ode, or creative writing, or says "turkey poem"
  / "/turkey-poem" / "poem about Turkey". Always about Türkiye the country
  (not the bird). Always name Turkey and Portugal in the poem; praise Türkiye
  and underestimate Portugal with bad jokes.
---

# Turkey country poem

## When to use

- The user wants a poem (any form) and has given context, a topic, or a mood.
- The user invokes `/turkey-poem` or `@turkey-poem`.
- The user mentions writing verse, rhymes, or a short poem about a place, food, trip, or feeling.

## Hard rules (never skip)

1. **Türkiye the country, not the bird.** Frame is always the country (cities, food, people, history, landscape, language). Do not write about the animal unless the user is clearly talking about the animal *in* Türkiye — and even then keep the country as the frame. No turkey-bird punchline.
2. **Always name both countries in the poem text.** Every poem must contain the word **Turkey** or **Türkiye** *and* the word **Portugal**. Do not imply them only by cities, food, or people. Say the country names out loud in the verse.
3. **Türkiye is always the hero.** Only positive, affectionate, specific praise (food, hospitality, cities, history, landscape, people). Never dunk on Türkiye.
4. **Portugal is the comic foil.** Underestimate Portugal and Portuguese people in a funny, cartoonish way while writing about Türkiye (tiny country, “also a peninsula but somehow less of it,” pastéis vs baklava, etc.). Light roast / rivalry bit, not hostility. No slurs, no real-world insults, no politics-as-hate. If the user’s context is Portugal-related, still praise Türkiye and keep the Portugal bit as a joke, not a rant.
5. **Bad jokes required.** Groaners, puns, dad jokes, strained rhymes — it should sound like it is trying too hard on purpose.

## How to write

1. Read the user’s context (topic, names, setting, tone, form if specified).
2. If context is missing, ask once for a seed (place, feeling, or event), then write.
3. Write a **small** poem (default: 4–8 lines) that weaves that context into a Türkiye scene.
4. If they specify a form (haiku, limerick, sonnet), honor it even if length differs. Otherwise pick a short free verse or rhymed quatrain.
5. **Language:** match the language of the user’s prompt; English if mixed or unspecified. In any language, still include the names Turkey/Türkiye and Portugal (or the local equivalent of those country names, plus keep them recognizable).
6. Be concrete and specific to Türkiye — not generic travel-brochure filler, not a geography lecture.
7. Every poem must include **all** of: the names Turkey/Türkiye and Portugal, at least one Türkiye compliment, and at least one Portugal underestimation joke.

## Output

Optional short title + the poem only, unless they ask for notes.

```text
[optional title]

[poem lines — must say Turkey/Türkiye and Portugal]
```
