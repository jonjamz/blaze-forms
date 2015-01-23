1.8.0
=====

* Transitional release before `v2.0.0`.
* Address issues #13, #15, #16, #17 and #18.
  * The `changed` argument in the action function is now `undefined` if no initial data was provided.
  * Consolidate helpers passed into `UI.contentBlock` into one `context` argument.
    Log deprecation warning when helpers are passed in individually.
  * The container div in the `basicInput` example has been removed.
  * The endpoint to create a form block is now called `createFormBlock`.
    Use of `createForm` will log a deprecation warning.
  * Minor update to `basicInput` and `basicForm` code.
  * Change `basicForm` template name to `basicFormBlock` (but keep `basicForm` for compatibility).
  * Add `defaultFormBlock` block helper that supports using form block helpers directly.
  * Add global `context` helper to allow direct access to form-level helpers in a form block's `UI.contentBlock`.
    This keeps reactivity normal (#17) and enables `defaultFormBlock`-style usage (#15).
* Docs update:
  * Capitalize component names throughout; more clearly distinguish between these components and HTML elements of the same name.
  * Sync up examples.
  * Move thanks to @steph643 for issue contributions out of here and into the docs.

1.7.1
=====

* Address issues #12 and #13.
  * The `changed` argument in the action function now contains *any* fields that have changed, not just fields that were originally present in the initial data.
  * Support the optional `options` object to Simple Schema's `clean` function in `validationValue`.

1.7.0
=====

* Address issues #9 and #11.
  * Initial data now supports objects with prototype methods.
  * If initial data was provided, an object containing only the changed fields is passed into the action function.
* Refactor to allow form fields to have falsey values.

1.6.2-1.6.3
===========

* Address issues #5, #6, and #7.
  * Update docs:
    * Describe the `field` property on elements and how it connects them to form blocks.
    * Correct description of `invalid` helper (form blocks).
  * Fix `package.js` to support `instructions` field on client and server-side SimpleSchemas.

1.6.1
=====

* Elements inside a form block now validate against the form-level data context.
  * Fixes a bug with custom validation in SimpleSchema.

1.6.0
=====

* All *form-level* helpers inside elements (`submitted`, `success`, `loading`) now default to `false`
  when the element is being used standalone.
* Individual helpers can now be overridden on elements if they're specified on the element
  template's invocation.
* Add `isChild` helper to elements.
* Remove `failed` helper (added in v1.4.0) from element scope.
  * Submission failure should be handled outside this scope.
  * As `failed` and `success` are mutually exclusive states, you can handle submission
    failure using `{{#if submitted}} {{#unless success}}` anyway.
* `basicInput` example now supports passed-in (default) data with the `value` helper.

1.5.2
=====

* Revisit change from v1.5.0 where setting the `changed` state to `true` changes `submitted` and
  `success` states to `false`.
  * Only change `submitted` state to false if `success` state is also true at the time `changed`
    is set to true. This better serves the original use case, and hopefully avoids unexpected
    functionality.

1.5.1
=====

* Internal comparisons are now made with Underscore's `_.isEqual` method, for full type support.

1.5.0
=====

* Improve default internal logic.
  * Setting `changed` state on a form block instance to `true` by necessity changes `success`
    and `submitted` states to `false`.
  * Fix `setValidatedValue` method in form blocks, so that now it checks if the field has
    been added to the form's data context before it checks if the field was in passed-in
    data. This allows the method to run `changed` on field updates even if they contain the
    same value that the passed-in data had. The focus is now on *unique from the last value*.

1.4.0
=====

* Elements now have access to `failed` and `success` helpers.
* This seemed important, particularly as `success` is useful for element cleanup after submission.

1.3.0
=====

* Add `submitted` helper to form blocks.

1.2.0
=====

* Add `changed` helpers on both form blocks and elements.
  * Starts `false`, sets to `true` when `validationEvent` is triggered and data passes validation.
  * Initial data is validated on render, but `changed` isn't called during that time.

1.1.7
=====

* Fix typo. Action function had `callbacks.falied` instead of `callbacks.failed`.

1.1.0
=====

* Refactor.
* Use jQuery's `.val()` as the default way to get an element's value, instead of `.value`.
* Add `validationValue` option to ReactiveForms.createElement.
* Add ability to pass in initial data for form elements, at the form or element level.
* Create form-level data context.
  * Store last validated value for all elements in the form block.
  * Context is unique to every form block template instance.
* Bind action function to the form-level data context when it's called.

1.0.0
=====

* Integrated with SimpleSchema.
* Tested in a local project.
* `ReactiveForms.createForm` and `ReactiveForms.createElement` working.
* Form states are mutually exclusive, making it easy to display messages in one place.
* Action function grabs all `.reactive-element` elements in the form.
* Both types of templates can be used together or standalone.
