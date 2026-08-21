# Menulis Test Plan (Planner Guidelines)

> Panduan authoring Test Plan dalam format Markdown (`specs/*.plan.md` atau `specs/*.md`) yang dikompilasi oleh `compile_test_plan` menjadi `TestPlanContractV1`.

## Alur Test Plan

```text
requirements/*.md
       ↓
compile_requirement
       ↓
RequirementContractV1
       ↓
Planner Agent
       ↓
specs/*.plan.md
       ↓
compile_test_plan
       ↓
TestPlanContractV1
       ↓
validate_plan
```

## Template & Contoh

- Template standar: [`specs/_TEMPLATE.md`](../specs/_TEMPLATE.md)
- Contoh valid: [`specs/_GOOD_EXAMPLE.md`](../specs/_GOOD_EXAMPLE.md)
- Contoh invalid: [`specs/_BAD_EXAMPLE.md`](../specs/_BAD_EXAMPLE.md)

## Aturan Penulisan Assertion Provenance

Setiap bullet assertion WAJIB mencantumkan provenance dalam kurung siku:

- `[requirement]` — Disalin langsung atau diderivasi dari Hasil yang Diharapkan pada requirement.
- `[live-verification]` — Dibuktikan dari observasi browser live / network inspector.
- `[framework-derived]` — Validasi framework (misal: sanitasi storage, title browser, dsb).
- `[planner-assumption]` — Asumsi yang dibuat oleh Planner (akan memunculkan warning untuk di-review QA).

## Larangan Keras

Jangan pernah memasukkan runtime element ref ephemeral (seperti `ref:tw-123` atau `handle:button-1`) ke dalam test plan. Gunakan semantic locator intent (misal: `button[type="submit"]`, `input[name="email"]`).
