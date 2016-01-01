## API Reference

### Form Elements

A TemplatesForms Form Element is a reusable component that plays the same role as a
typical HTML form control, such as an `<input>` or `<select>` elements.

Unlike HTML form elements, though, TemplatesForms elements are extremely flexible and
powerful. They consistently transform user input into a desired data structure that is ready
to insert into a database.

#### First Step: Create a Blaze Template

* Template must contain one *HTML element*, for example `<input>`.
* The HTML element must:
  * Have the `reactive-element` class (or a custom selector you specify using `validationSelector`).
  * Support the `validationEvent` type(s) you specify in `createElement` options.

> You can also put the `reactive-element` class on a container in the element to delegate the event.

Here's an example of a compatible element template.

```handlebars
<template name="basicInput">
  <strong>{{label}}</strong>
  <br>
  <input placeholder={{instructions}} class="reactive-element" value={{value}}>
  {{#if submitted}}
    {{#if errorMessage}}<p class="error-message">{{errorMessage}}</p>{{/if}}
  {{/if}}
</template>
```

Element templates have access to the following *local* helpers:

* `{{value}}`
  * The last value of this Element that was able to pass validation.
  * Useful with some form components, such as a toggle button.
  * If you specified a `data` object on the form or Element, this will initially hold the value associated with the relevant field in that object.
* `{{originalValue}}` (when initial data)
  * This contains the original value from initial data for this field.
* `{{uniqueValue}}` (when initial data)
  * This is *true* if the Element's current value differs from the original value, or *false* if it's the same.
  * Use this to show users what fields they've changed and what fields they haven't.
* `{{valid}}`
  * Use this to show validation state on the Element, for example a check mark.
  * Initial data passed into the Element is validated on `rendered`.
  * Defaults to *true* if no schema is provided.
* `{{changed}}` (inverse `{{unchanged}}`)
  * This is *true* once the Element's value has successfully changed.
  * Use this to show or hide things until the first validated value change is made.
  * Initial data passed into the Element doesn't trigger `changed`.
* `{{isChild}}`
  * This is *true* if the Element is wrapped in a Form Block, or *false* if it's not.
  * Use this to show or hide things regardless of what a parent Form Block's state is--for example, some different formatting.

These helpers are available when a *SimpleSchema* is being used:

* `{{label}}`
  * From the [label](https://github.com/aldeed/meteor-simple-schema#label) field in your *SimpleSchema* for this Element's `field`.
  * Use this as the title for your Element, for example "First Name".
* `{{instructions}}`
  * A field we extended *SimpleSchema* with for this package.
  * Good for usability, use this as the placeholder message or an example value.
* `{{errorMessage}}`
  * A reactive error message for this field, using [messages](https://github.com/aldeed/meteor-simple-schema#customizing-validation-messages) provided by *SimpleSchema*.

While inside a Form Block, these *form-level* helpers will be available:

* `{{submitted}}` (inverse `{{unsubmitted}}`)
  * Lets us know if a parent Form Block has been submitted yet.
  * Use this to wrap `{{errorMessage}}` to delay showing Element invalidations until submit.
* `{{loading}}`
  * Lets us know if a form action is currently running.
  * Use this to disable changes to an Element while the submit action is running.
* `{{success}}`
  * This is *true* if a form action was successful.
  * Use this to hide things in the Element after submission.

All the *form-level* helpers will be `false` when an Element is running standalone.
However, you can override specific properties on an Element when you invoke it:

```handlebars
<!-- The `basicInput` example will now show its error messages when standalone -->
{{> basicInput schema=schema field='testField' submitted=true}}
```

#### Second Step: Register the Template

Elements will not function properly until they are registered (and it's the same for a Form
Block).

```javascript
TemplatesForms.createElement({
  template: 'basicInput',
  validationEvent: 'keyup', // Can also be an array of events as of 1.13.0!
  validationValue: function (el, clean, template) {
    // This is an optional method that lets you hook into the validation event
    // and return a custom value to validate with.

    // Shown below is the TemplatesForms default. Clearly, this won't work in the case
    // of a multi-select form, but you could get those values and put them in an array.

    // The `clean` argument comes from SimpleSchema, but has been wrapped--
    // it now takes and returns just a value, not an object.
    console.log('Specifying my own validation value!');
    value = $(el).val();
    return clean(value, {removeEmptyStrings: false});
  },
  reset: function (el) {
    $(el).val('');
  }
});
```

Other available options for `createElement`:

* `validationSelector` allows specifying a custom selector for the element instead of `.reactive-element`.
* `passThroughData` relates to how the element handles reactive initial data. If this is set to `true`,
  changes in the underlying data will be accepted automatically without informing the user.
  * This is useful when an element offers a set of options that you'd like to keep transparently
    up-to-date in real-time.
* `created`, `rendered`, and `destroyed` callbacks--these are safe equivalents to the normal Meteor
  template callbacks.

#### Third Step: Usage

Elements can be used standalone, with a *SimpleSchema* specified, like this:

```handlebars
{{> basicInput schema=schema field='testField'}}
```

However, elements are usually used within a TemplatesForms container (a Form Block), where
they transparently integrate with the parent form component.

```handlebars
{{#basicFormBlock schema=schema action=action}}
  {{> basicInput field='testField'}}
{{/basicFormBlock}}
```

Here's what changes when this happens:

* Elements *use the form-level schema*--the `field` property on the element specifies which
  field in the form's schema to use.
* An element that fails validation will *prevent the form from submitting*.
* Elements *get access to form-level state*, enabling helpers like `{{loading}}`.
* Element values that pass validation are stored in *form-level data context*.

**Nested Elements**

Elements may also be nested up to 5 levels deep. Child elements will traverse contexts until
they find the top-level parent element. Use this to:

* Abstract common formatting such as labels and error messages into a shared wrapper element.
* Compose simpler elements into more complex ones, such as a drop-down that loads data into
a checklist.

See the [How-To Guide](../how-to/NestedElements.md) for more information.

#### Highlights

> When running standalone (without being wrapped in a Form Block) you'll put the schema on the
Element's template invocation. You can also override the other form-level helpers on Elements this way.

> To force an element to run in standalone mode, you can specify `standalone=true` in the template's invocation.

> Be sure to add the reactive-element class to your Element so that it's selected when the form action is run.

> Partial element templates can be used to abstract out common code. You can even create element block templates to wrap your elements.
