# Program Flow Builder Module Contract

## Purpose
This module is only for the admin-side **Program intake flow** experience.

It visualizes and navigates a single Program's existing intake structure:

- authentication
- screening questions
- consents
- checkout
- completion

It is not the source of truth for question authoring, checkout routing, or custom-program composition.

## Canonical Feature Boundary

### This module owns
- Program flow visualization
- node focus / graph navigation
- graph derivation from persisted Program data
- limited non-question system-node configuration where required

### This module does not own
- generic question editing UX
- checkout question editing UX
- custom-program builder behavior
- treatment composition / assignment pools
- patient runtime rendering

## Mandatory Reuse Rules

Future changes here must reuse existing treatment/program surfaces instead of creating parallel ones.

### Question editing
Use:
- `src/features/treatments/question-editor/components/shell/QuestionEditorDialog.tsx`

Do not:
- build a second question editor side panel
- clone question setup/content/visibility/preview behavior here

Program question nodes must open the existing `QuestionEditorDialog`.

### Checkout editing
Use:
- `src/features/treatments/programs/components/CheckoutQuestionModal.tsx`

Program checkout nodes must route into the existing checkout modal/editor.

### Add element flow
Reuse the existing Program actions already exposed from the Program page:
- add screening question
- add checkout question
- add consent
- add auth-related configuration through the existing Program surface

Do not create a separate "flow-builder-only" add-element system unless the Program page itself adopts it as the canonical Program creation flow.

### Reorder flow
Reuse the existing Program questions reorder/list flow.

The builder can link to reorder, but it must not create a second persistence path for ordering.

### Preview
Reuse existing preview and simulator surfaces:
- `QuestionEditorDialog`
- patient preview tabs
- patient flow test modal

Do not fork a second incompatible patient-preview system.

## Program vs Custom Program

This module is for **Programs**.

Do not mix it with:
- `src/features/treatments/flow-builder/`
- `CustomProgramFlowBuilder`
- custom-program composition semantics

If a change needs treatment graph composition, assignment pools, or custom-program assembly behavior, it belongs to the custom-program builder, not here.

## Current Intended Ownership

- `ProgramFlowBuilder.tsx`
  - orchestration shell
  - wires sidebar, canvas, and allowed config surfaces
  - routes question/edit actions into canonical editors

- `components/ProgramFlowCanvas.tsx`
  - visual canvas only
  - no persistence ownership

- `components/ProgramFlowSidebar.tsx`
  - left index of Program flow elements
  - should mirror the Program's actual flow items, not a custom-builder inventory pool

- `components/ProgramFlowConfigPanel.tsx`
  - only for non-question node configuration
  - auth / consent / checkout / read-only system nodes

- `utils/programFlowGraph.ts`
  - deterministic graph derivation from Program data
  - no local second source of truth

## Anti-Patterns To Avoid

- Re-implementing the question editor in a new side panel
- Re-implementing add-element flows that already exist on Program pages
- Treating Program flow as Custom Program flow
- Introducing flow-only local state as the primary source of truth
- Packing unrelated builder logic into this module because it "looks similar"

## Prototype Alignment Rule

Treat the client prototype as a UX reference, not as permission to rebuild existing Program editing surfaces.

If the prototype shows a question edit interaction, the implementation should still route into the canonical Program question editor unless there is a documented reason not to.

## Known Gaps

These are still expected follow-up items:

- `ProgramFlowSidebar` currently behaves partly like a filterable custom-builder inventory instead of a strict Program flow index
- `ProgramFlowConfigPanel` still needs narrowing so it cannot become a shadow question editor
- the Program flow experience should live as a dedicated Program flow surface/page, not an overgrown embedded fragment
- canvas styling and interactions still need closer parity with the Program prototype

## Graph Reliability Contract

The graph is derived from Program data at render time. It does not persist
positions, links, or editor state of its own.

- Invalid or self-referencing visibility rules leave the affected question on
  the main spine and report a graph diagnostic instead of dropping the node.
- Visibility cycles are broken deterministically at the earliest Program-order
  question so the full flow remains visible.
- Nested branches are depth-clamped into the last visual lane, never omitted.
- Products are terminal checkout-side cards. Their route source is resolved
  from the referenced question text/kind, not UUID-shaped question IDs.
- Exact answer hover traces only that answer's connector(s); node focus traces
  direct related connectors without selecting all answers.
- During route focus, unrelated connectors use secondary opacity while the
  exact route renders above them.

## Verification

Run these checks from the admin portal repository:

```bash
npm run test:flow-builder
npm run typecheck
npx eslint src/features/treatments/programs/flow-builder scripts/flow-builder-graph-tests.ts
npm run build
```

The graph suite covers spine order, conditional and nested routes, return
routes, product routes, answer focus, node focus, invalid references, cycles,
deep branch chains, long choice lists, and a large branch/product graph.

## Rule For Future Agents

Before changing this module:

1. inspect `ProgramDetailPage.tsx`
2. inspect `QuestionEditorDialog.tsx`
3. inspect `CheckoutQuestionModal.tsx`
4. inspect `CustomProgramFlowBuilder.tsx`
5. confirm whether the task is actually Program flow or Custom Program flow

If the change can be done by wiring existing Program surfaces together, do that first.
