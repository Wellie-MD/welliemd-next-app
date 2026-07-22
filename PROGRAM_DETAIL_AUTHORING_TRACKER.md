# Program Detail and Authoring Tracker

Source of truth: client admin prototype and supplied Program detail/editor screenshots.

## Hard boundaries

- This tracker covers Program detail/question authoring only.
- Custom Program builder and questionnaire runtime remain separate surfaces.
- List, advanced Program graph, editor, preview, and runtime consume one Program configuration.
- Editor **Test Patient Flow** is a separate authoring simulator. **Program Preview** and **Custom Program Preview** share the same questionnaire preview modal and immutable preview boundary, using their respective source context.
- Existing legacy files may receive targeted edits; new files remain below 600 lines.

## Ordered implementation checklist

- [x] Capture reference behavior and visual system from the prototype HTML.
- [x] Materialize authentication as the first Program flow element when absent.
- [x] Merge screening and checkout elements into one stable ordered authoring list.
- [x] Keep synthesized boundary elements singular across list and advanced graph views.
- [x] Match the Program header actions and page surface styling.
- [x] Implement dynamic present/empty type filters with counts and expand/collapse.
- [x] Search question text, answers, mapped fields, product data, and element labels.
- [x] Match the flat table density, column layout, icons, colors, badges, and locked states.
- [x] Preserve explicit reorder mode and protect system elements from destructive actions.
- [x] Keep Add Element actions wired for question, auth, service area, section, consent, checkout.
- [x] Save add, edit, reorder, and delete operations for required labs through an isolated lab payload.
- [x] Match the full-screen three-column editor proportions and responsive behavior.
- [x] Match Patient Authentication Step 1 explanation and route cards.
- [x] Match editor sidebar semantic colors and full-flow ordering.
- [x] Match the dark live patient preview pane and element-specific preview rendering.
- [x] Keep editor Test Patient Flow separate; route Program Preview and Custom Program Preview through the shared questionnaire preview boundary.
- [x] Verify production build and inspect final diff against all supplied references.
- [x] Commit and push the completed pass to `feat/staging-v2-admin-portal`.
