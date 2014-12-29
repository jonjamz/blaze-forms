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