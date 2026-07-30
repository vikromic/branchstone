# Branchstone mobile usability validation

This is the executable moderated-test gate for final mobile UX approval. It is a qualitative release gate, not a statistical claim about every future visitor.

**Status: READY / NOT EXECUTED / NO PARTICIPANT RESULTS**

## Evidence boundary

Record these before the first session:

- exact commit SHA or immutable source-bundle digest;
- test URL and deployment/build identifier;
- test dates and moderator;
- browser/device matrix;
- the unmodified screen-and-audio recording location for each consenting participant.

Use pseudonymous participant IDs. Do not store participant names, email addresses, or unrelated personal information in this repository.

## Participants

Recruit eight people who have never used Branchstone:

- two gallery representatives;
- two collectors or collection managers;
- two curators;
- two jury or open-call panel members.

Within each pair, recruit one Ukrainian-first and one English-first participant. Test four people on personal iPhones in Safari and four on personal Android phones in Chrome, favoring ordinary non-flagship devices. Exclude the project team, the artist's close friends, and UX professionals.

## Fixed test records

- Artwork A: **The Place That Stays / Місце, Що Залишається**. It appears below the first several Gallery screens.
- Exhibition E: **Rena Charles Gallery — Art for Everyone / Галерея Rena Charles — Мистецтво для всіх**, February 2026, Healdsburg, California.

Confirm that both records and translations are present in the exact test build before starting. If content changes, select equivalent non-first records and record the replacement above without changing the task intent.

## Session

Allow 30–40 minutes in portrait orientation. Do not demonstrate the navigation. Run T1–T3 first for every participant; counterbalance T4–T8.

Moderator introduction:

> We are testing the site, not you. Use it as you would on your own and say what you expect or find surprising. I will not explain the interface during a task.
>
> Ми тестуємо сайт, а не вас. Користуйтеся ним так, як робили б самостійно, і говоріть, чого очікуєте або що вас дивує. Я не пояснюватиму інтерфейс під час завдання.

Allowed neutral prompts:

- “What do you expect to see now?” / “Що ви зараз очікуєте побачити?”
- “What are you thinking now?” / “Що ви зараз думаєте?”
- If asked for help: “What would you do if I were not here?” / “Що ви зробили б, якби мене тут не було?”

Any instructional hint makes the first-attempt result a failure. The moderator may then help only so the rest of the session can continue.

## Tasks

| ID | English instruction | Українська інструкція | Limit | Required result |
| --- | --- | --- | ---: | --- |
| T1 | “You are visiting this artist's site for the first time. Show me all available works.” | «Ви вперше на сайті художниці. Покажіть усі доступні роботи.» | 30 s | Full Works archive filtered to available work |
| T2 | “Find ‘The Place That Stays’ and open it.” | «Знайдіть роботу “Місце, Що Залишається” і відкрийте її.» | 90 s | Correct work opens with the full composition visible |
| T3 | “View the next work, then return to the list so you can continue from the same place.” | «Подивіться наступну роботу, а потім поверніться до списку так, щоб продовжити перегляд із того самого місця.» | 45 s | Adjacent work opens; return position is within one viewport |
| T4 | “Find where and when the Rena Charles Gallery exhibition ‘Art for Everyone’ took place.” | «Знайдіть, де й коли відбулася виставка галереї Rena Charles “Мистецтво для всіх”.» | 60 s | Healdsburg, California and February 2026 are identified |
| T5 | “Before inviting the artist, find her practice and describe one central theme or method in your own words.” | «Перед запрошенням художниці знайдіть опис її практики й своїми словами назвіть одну центральну тему або метод.» | 90 s | Practice is found and the answer is grounded in its text |
| T6 | “Find a way to contact the artist about an exhibition, but do not send anything.” | «Знайдіть спосіб зв'язатися з художницею щодо виставки, але нічого не надсилайте.» | 45 s | Contact and an honest contact channel are identified |
| T7 | From Artwork A: “Switch to the other language and continue with this same work.” | На сторінці роботи A: «Перейдіть на іншу мову й продовжіть із цієї самої роботи.» | 30 s | Locale changes without losing the work or context |
| T8 | “Start from Home. Save one work, tell me its title, year, and materials, then find the artist's Contact.” | «Почніть із головної. Збережіть одну роботу, назвіть її назву, рік і матеріали, а потім знайдіть Контакти художниці.» | 120 s | One work is visibly saved; its correct title, year, and materials are identified, and Contact is found |

After every task ask:

- “How easy was that, from 1 to 7?” / “Наскільки легко це було від 1 до 7?”
- “What was unexpected or inconvenient?” / “Що було неочікуваним або незручним?”

## First-attempt scoring

Score a participant/task attempt `1` only when the required result is reached:

- within the time limit;
- without a hint, restart, or reworded instruction;
- without entering an incorrect top-level section or opening the wrong work;
- without a no-progress pause longer than ten seconds.

Self-correction is recorded as `completed_after_error` but scores `0`. Ignore an obvious accidental physical miss only when the target itself is demonstrably large and unambiguous.

There are 64 attempts. The aggregate pass threshold is at least **58/64** clean successes: 58/64 is 90.625%; 57/64 is 89.06% and fails.

## Evidence sheet

Create one row per attempt with this schema:

```text
participant_id,role,language,device,os,browser,viewport,network,task_id,start_state,first_action,first_action_ms,completion_ms,clean_pass,completion_state,wrong_routes,no_progress_pauses,accidental_taps,load_waits,context_loss,artwork_integrity,seq_1_to_7,quote,severity,recording_timestamp
```

Maintain a separate issue log grouped by verified root cause rather than by repeated symptom.

## Approval

Final moderated-test `APPROVE` requires all of the following:

- at least 58/64 clean first-attempt successes;
- T1, T2, and T3 each pass 8/8;
- each of T4–T8 passes at least 7/8;
- median single-ease score for every task is at least 6/7;
- no crash, dead end, forced reload, unreachable navigation, artwork crop/deformation, lost locale, or lost context;
- no unresolved cause of serious friction observed in two or more participants.

Any failed condition is `REJECT`. Fix the verified cause and test it with new matched participants. If the information architecture or core Gallery behavior changes, rerun the entire protocol with a new group rather than retesting only the failed task.
