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