# CSS and Styling Conflicts

## Error / Problem

During frontend development, conflicting CSS rules caused inconsistent styling between components. Styles applied to one component could unintentionally affect another component, resulting in incorrect colors, spacing, alignment, sizing, or typography.

### Common Causes

- Overly broad CSS selectors.
- Duplicate or conflicting class names.
- High CSS specificity.
- Global styles unintentionally affecting individual components.
- Incorrect inheritance of styles.
- Conflicts between component styles and third-party libraries.

## Solution

The styling structure was organized to reduce unintended interactions between components and make styles more predictable.

### Implemented Solutions

- Used specific and descriptive class names.
- Reduced unnecessary global CSS rules.
- Scoped styles to individual components where possible.
- Removed duplicate and conflicting declarations.
- Checked CSS specificity when multiple rules targeted the same element.
- Centralized common design values such as spacing, typography, and component styles.
- Tested components together to identify visual side effects.

### Result

The frontend achieved more consistent styling across components, with fewer unintended CSS overrides and easier maintenance of the UI.
