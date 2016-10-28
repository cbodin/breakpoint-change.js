# breakpoint-change.js

A JavaScript library for receiving callbacks when stylesheet-defined breakpoints change.

## Installation

### Manually

Grab the latest [breakpoint-change.js](https://github.com/cbodin/breakpoint-change.js/raw/master/dist/breakpoint-change.js) or [breakpoint-change.min.js](https://github.com/cbodin/breakpoint-change.js/raw/master/dist/breakpoint-change.min.js) and include in your project.

### Bower

```sh
bower install breakpoint-change.js --save
```

## Usage

Declare a selector for each breakpoint inside a media query in the stylesheet.

```css
@media screen and (max-width: 499px) {
  .breakpoint #phone {}
}
@media screen and (min-width: 500px) {
  .breakpoint .tablet {}
}
@media screen and (min-width: 900px) {
  .breakpoint .desktop {}
}
```

The first part of the selector `.breakpoint` can be configured to any
valid css selector.

The last part `#phone|.tablet|.desktop`defines the name of the
breakpoint. If the last part is a class, this is a regular breakpoint.
If the last part is an id, this will be used as the default breakpoint.
Only one default breakpoint is allowed.

If a default breakpoint is supplied, the callbacks will only be called
during initialization if the currently matching breakpoint is not the
default.

The order of the media queries are extremely important as the last
matching query is considered the current.

```js
var breakpointChange = new BreakpointChange(window);
breakpointChange.on(function (breakpoint, oldBreakpoint) {
    // breakpoint will be the name previously defined in the stylesheet.
    // The class/id prefix is removed, e.g. for a window width of 300px,
    // breakpoint = 'phone'
});
```

If you need to change the first part of the selector, you can pass in an
additional argument to the constructor:

```js
var breakpointChange = new BreakpointChange(window, '#awesome .breakpoints');
```

The selectors in the stylesheets should then be changed to:
```css
#awesome .breakpoints #phone {}
```

* NOTE: Internet Explorer might reorder combined selectors, e.g. `.breakpoint.change`, causing the selector parser to fail.

## Support

Please [open an issue](https://github.com/cbodin/breakpoint-change.js/issues/new) for support.
