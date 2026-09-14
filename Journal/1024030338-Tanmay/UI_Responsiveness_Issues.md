# UI Responsiveness Issues

## Error / Problem

During frontend development, the user interface did not always display
correctly across different screen sizes and devices. Elements such as
containers, buttons, images, and text could become misaligned, overlap,
or extend beyond the visible screen.

### Common Causes

-   Fixed-width elements that did not adapt to smaller screens.
-   Incorrect use of CSS positioning.
-   Images or components exceeding their parent container.
-   Missing responsive breakpoints.
-   Different rendering behavior across devices and browsers.

## Solution

The frontend was made responsive by using flexible layouts and
responsive CSS techniques.

### Implemented Solutions

-   Used **Flexbox and CSS Grid** for flexible component layouts.
-   Replaced unnecessary fixed widths with relative units such as `%`,
    `rem`, and `vw`.
-   Added **media queries** for different screen sizes.
-   Used responsive image sizing such as `max-width: 100%`.
-   Tested layouts on desktop, tablet, and mobile screen sizes.
-   Adjusted spacing, font sizes, and component dimensions at smaller
    breakpoints.

### Result

The UI became adaptive to different screen sizes, reducing layout
overlap and improving usability across desktop and mobile devices.
