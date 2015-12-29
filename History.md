vNext
=====

* Massive docs overhaul (Issues #14, #48, #62).

2.1.2
=====

* Destroyed element templates are now removed from the validation context (Issue #87).

2.1.1
=====

* Add missing namespace export to package.js.

2.1.0
=====

* Address issue #76.
  * A `field` helper is now available in `formContext` as well as in the custom form block helpers. This reactively gets the value of any given form field (even nested ones).
    * Example: `{{#with formContext}}{{field 'name.first'}}{{/with}}`.

2.0.0
=====

* Add missing `onDestroy` hook for elements (Issue #73).
* Fix SimpleSchema support (Issues #69, #84).
* Fix global `context` helper and rename it to `formContext` (Issue #64).
  * Add several missing properties to the helper object.
  * **This is the only breaking change to the public API in this release.**
* Convert codebase to JavaScript as part of a transition to ES2015 classes.
* Refactor code, package structure, and improve comments.
* Update SimpleSchema dependency to latest version.

1.14.2
======

* Adjust internal `isObject` function to fail for Date objects and regular expressions.

1.14.1
======

* Fix regression (Issue #38) where `_id` fails to show up in the data context of the `action` function.
* Address issue #55.
  * Calling `reset(true)` now resets `changed` and `valid` states on individual elements.

1.14.0
======

* Major update that addresses issues #28, #55, and #56.
  * Nested schemas are now supported.
  * An `onDataChange` hook can now be passed into a form block via a template helper.
    * This has access to several useful methods that allow fine-grained control over what
      happens when reactive initial data is changed.
      * `this.reset()` calls the same method as `callbacks.reset()` in the action function.
      * `this.refresh()` will cause every Element to refresh itself with the new initial data.
        If the user made changes to an Element, that Element's value won't be updated in the
        DOM, but it will have a new *original* value.
      * `this.changed()` causes the form to take on the `changed` state (as if a user had
        made changes to the form).
  * The `changed` argument to the action function now only contains fields that have actually
    changed from the initial data (compared to before, where any user-modified fields would
    exist).
  * Added new template helpers for Elements, which should make dealing with initial data easier.
    * `{{originalValue}}` shows the *original* value of this field where initial data is present.
    * `{{uniqueValue}}` is a boolean for whether the current value of a field is unique from
      the original value.

1.13.3
======

* Address issues #51 and #54.
  * Refactor to fix errors.
  * Fix `context` helper by adding extra checks.
  * Fix resetting functionality.
    * By default, `callbacks.reset()` now clears all states except `success` or `failed` and
      related messages. This provides a nice default experience for users that doesn't jar
      them away from the last session without some idea of what happened (the states clear
      on the next form change automatically).
    * To clear all states and messages, perform a hard reset with `callbacks.reset(true)`.

1.13.2
======

* Fix regression where `{{valid}}` was incorrectly set.

1.13.1
======

* Fix incorrect var name in previous update.

1.13.0
======

* Allow element validation to be immediately cancelled and/or called manually in async fashion with
  `return this.stop` and `this.validate(val)`.
* Improve support for parent/child elements.
  * Elements now check their parent template context (up to 5 levels) to determine where the
    form block context is, rather than assuming it's one level up. When the parent is an element,
    the sub-element will take the parent element's `field` as its own.
  * Elements now support `standalone=true` explicit standalone mode in the template invocation.
  * `createElement` now supports `passThroughData` option--elements with this option set `true` will
    accept remote data changes without waiting for a user's action. This is useful for elements
    receiving data from a join (for example, a checklist of related documents).
* Switch from Blaze.ReactiveVar to non-namespaced ReactiveVar and add dependency.
* Address issues #50, #51, #52, and #53.
  * Allow for custom success and failed messages:
    * Messages can be easily added in callbacks, like `callbacks.success('...message...')`.
    * `failedMessage` and `successMessage` template helpers now exist for form blocks.
  * Add official support for resetting a form.
    * Elements can now specify a `reset` method in `createElement` config.
    * A `callbacks.reset()` clears all element data using the `reset` methods, and clears
      form data context in a form block.
  * Add support for an array of events in `validationEvent`.
  * `{{valid}}` reactivity should now register `changed` when the element's field is invalidated in
    SimpleSchema from the outside.


1.12.5
======

* Revisit issue #27.
  * Rewrite validation so that optional fields are only checked if they exist.

1.12.4
======

* Address issue #47.
  * The reactive data context and `valueDeps` for an Element now exist at the Form Block level,
    which allows all element templates with the same field in that form to share the same value-
    dependent states. Hopefully this also addresses lingering concerns from #31.
  * Validation is now triggered whenever data is changed, meaning validation happens after data
    is set, rather than before. This doesn't mean anything to the end-user, because submission
    won't run unless the data is valid (provided a schema exists). It would be preferred to
    ensure that only valid data reaches the form-level data context, however.
* Refactor.

1.12.3
======

* Address issue #46.
  * Clearly differentiate between changes enacted by the user (from event handlers) and
    changes from other sources.
  * Only trigger `changed` state on user-enacted changes to the form.

1.12.2
======

* Fix `setState` function.

1.12.1
======

* Remove leftover console log.

1.12.0
======

* Major update with many improvements.
* Addresses issues #40, #41, #42, #43, #44, and #45. Fixes regression from issue #37.
  * Add robust support for dealing with reactively changing form data.
  * Remote changes to data being actively edited in a form can now be elegantly revealed to
    the user in real-time, using the `{{remoteValueChange}}` and `{{newRemoteValue}}` template
    helpers. There are also two template instance methods to hook into from event handlers.
  * Fix handling of initial data and how it bypasses the `changed` state.
  * On nested Element templates that don't actually provide data to the form, avoid running
    duplicate initial validation in the `rendered` callback.
  * `ReactiveForms.namespace` now allows programmatic access to whatever internal namespace
    the package uses in template instances.
  * Update docs with a chapter on working with remote data.
* Refactor and clean up code/comments.

1.11.0
======

* Address issue #39.
  * Add `unchanged` and `unsubmitted` helpers.
* Fix typo in docs.

1.10.8
======

* Address issue #38.
  * If initial data has an `_id` field, pass that through to the form data context.
  * Allows easier updates using the `action` function.

1.10.7
======

* Address issue #37.
  * Throttle `validationEvent` handler.
* Revisit issue #31.
  * Improve nested Element templates example in docs.

1.10.6
======

* Update to support simple-schema `v1.3.0`.

1.10.5
======

* Address issue #31.
  * Update docs to include a section on working with nested Element templates.

1.10.4
======

* Address issues #27 and #32.
  * Provide more helpful error messages in Form Block field validation.

1.10.3
======

* Address issue #34.
  * Form Blocks now accept falsey initial data.
  * The same form block can now be more easily used for inserts and updates.

1.10.2
======

* Fix typo in 1.10.1.

1.10.1
======

* Address issue #33.
  * `validationEvent` is now optional, and the event handler will only be added to an element
    template if it exists.
  * This allows easier creation of nested elements and wrapped elements.

1.10.0
======

* Address issue #8.
  * Allow access to all schema properties in Element templates.

1.9.2
=====

* Reorganize files.

1.9.1
=====

* Add missing `lib/init.coffee` file to `package.js`.
* Fixes problem with `defaultFormBlock` from issue #15.

1.9.0
=====

* Address issues #20 and #21.
  * Support custom `created` `rendered` and `destroyed` callbacks on both Form Blocks and Elements.
  * Namespace component data.

1.8.1
=====

* Automatically register `defaultFormBlock`.

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

* All form-level helpers inside elements (`submitted`, `success`, `loading`) now default to `false`
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
