About
-----

Build reactive forms:

* *in minutes*.
* *for production use*.
* *with reusable custom components*.
* *that work the way they should*.

Validation is handled using [SimpleSchemas](https://github.com/aldeed/meteor-simple-schema)--however, these are not required.

This package provides you with two **template factories** that take simple templates that you create and turn them into robust form components. Components can be used alone, but their real power comes from being used together.

Install
-------

`meteor add templates:forms`

This package works on the client-side only.

Usage
-----

### Getting Started

**1. Provide a schema and an action function using a parent template's helpers**.

```javascript
Template['testForm'].helpers({
  schema: function () {
    return new SimpleSchema({
      testField: {
        type: String,
        max: 3,
        instructions: "Enter a value!"
      }
    });
  },
  action: function () {
    return function (els, callbacks) {
      console.log("[forms] Action running!");
      console.log("[forms] Form elements!", els);
      console.log("[forms] Callbacks!", callbacks);
      callbacks.success();
    };
  }
});
```

The **action function** runs when the form is submitted. It takes two params, as shown above:
* `els`
  * This contains any elements in the form block with class `.reactive-element`.
  * You'll likely serialize this and save it to the database.
  * You can also use this to clear each element's value after the form has successfully been submitted.
* `callbacks`
  * This contains two methods to trigger the form's state.
  * Running `callbacks.success()` --> Sets `success`.
  * Running `callbacks.failed()`  --> Sets `failed`.
  * The form's `{{loading}}` state (see below) will run from the time you submit to the time you call one of these.

**2. Add the ReactiveForm form block and elements to the parent template**.

```handlebars
<!-- Wrapped input with form-wide schema -->
<template name="testForm">
  {{#basicForm schema=schema action=action}}
    {{> basicInput field='testField'}}
  {{/basicForm}}
</template>
```

The `basicForm` and `basicInput` templates are **included** with this package. 

See `templates:forms.html`.

### APIs

ReactiveForms has only two API endpoints.

Add any custom template that satisfies the basic requirements (outlined below), and you're
ready to go!

#### ReactiveForms.createElement

Create a ReactiveForms element from a compatible template.

```javascript
ReactiveForms.createElement({
  template: 'basicInput',
  validationEvent: 'keyup'
});
```

**Element template requirements**

* Template must contain *one form element*.
* The form element must have the class `.reactive-element`.

Here's an example of a ReactiveForms element template.

```handlebars
<template name="basicInput">
  <div class="reactive-input-container">

    <strong>{{label}}</strong>
    <br>

    <!-- The form elements in these components need to have the reactive-element class -->
    <input placeholder={{instructions}} class="reactive-element">
    <br>

    <!-- If the element is being used standalone, submitted is always true -->
    {{#if submitted}}
      <p class="error-message">{{errorMessage}}</p>
    {{/if}}

  </div>
</template>
```

Elements can be used standalone, with a *SimpleSchema* specified, like this:

```handlebars
{{> basicInput schema=schema field='testField'}}
```

However, elements are usually used within a form block helper, where they transparently
integrate with the parent form component.

```handlebars
{{#basicForm schema=schema action=action}}
  {{> basicInput field='testField'}}
{{/basicForm}}
```

Here's what changes when this happens:

* Elements *use the form-level schema*.
* An element that fails validation will *prevent the form from submitting*.
* Elements *get access to form-level state*, enabling helpers like `{{loading}}`.

**Element template helpers**

Element templates have access to the following helpers:

* `{{label}}`
  * From the `label` field in your *SimpleSchema* for this element's field.
  * Use this as the title for your element, for example "First Name".
* `{{instructions}}`
  * A field we extended *SimpleSchema* with for this package.
  * Good for usability, use this as the placeholder message or an example value.
* `{{errorMessage}}`
  * A reactive error message for this field, provided by *SimpleSchema*.
* `{{valid}}`
  * Use this to show validation state on the element, for example a check mark.
* `{{submitted}}`
  * Lets us know if a parent ReactiveForm form block has been submitted yet.
  * Used to wrap `{{errorMessage}}` to delay showing element invalidations until submit.
  * Defaults to *true* unless this template exists inside a ReactiveForm form block.
* `{{loading}}`
  * Lets us know if a form action is currently running.
  * Use this to disable changes to an element while the submit action is running.
  * Defauts to *false* unless this template exists inside a ReactiveForm form block.

**Highlights**

> When running standalone (without being wrapped in a form block) you'll put the schema on the
template invocation.

> Be sure to add the reactive-element class to your element so that it's selected when the form action is run.


#### ReactiveForms.createForm

Create a ReactiveForms form block from a compatible template.

```javascript
ReactiveForms.createForm({
  template: 'basicForm',
  submitType: 'normal' // or 'enterKey', which captures that event in the form
});
```

**Form block template requirements**

* Template code must be *wrapped in a form tag*.
* Template must contain UI.contentBlock with the proper fields (as below).

Here's an example of a ReactiveForms form block template.

```handlebars
<template name="basicForm">
  <form>

    <!--
      Note:

      Use this UI.contentBlock exactly as it is here, in every form block template
    -->

    {{> UI.contentBlock
        schema=schema
        schemaContext=__schemaContext__
        submit=__submit__
        submitted=__submitted__
        loading=__loading__
    }}

    <!-- The below helpers represent exclusive states,
      meaning they never appear at the same time -->

    <p>
      <button type="submit">Submit</button>
      {{#if loading}}
        Loading...
      {{/if}}

      {{#if invalid}}
        Can't submit! There are {{invalidCount}} invalid fields!
      {{/if}}

      {{#if failed}}
        There was a problem submitting the form!
      {{/if}}

      {{#if success}}
        Success! Form submitted (to nowhere)
      {{/if}}
    </p>

  </form>
</template>
```

Form blocks can technically be used standalone, with normal, non-reactive form elements like
inputs and check boxes. The form's *action function*, which runs on submit, always receives
an array containing the HTML elements inside the form with the `.reactive-element` class.

However, we strongly recommend using ReactiveForm elements inside a form block, which are
reactively validated with *SimpleSchema*:

```handlebars
{{#basicForm schema=schema action=action}}
  {{> basicInput field='firstName'}}
  {{> basicInput field='lastName'}}
  {{> basicInput field='email'}}
{{/basicForm}}
```

**Form block template helpers**

Form block templates have access to the following helpers:

* `{{failed}}`
  * This is *true* if the last attempt to run the form action failed.
* `{{success}}`
  * This is *true* if the last attempt to run the form action was a success.
* `{{invalid}}`
  * This is *true* if any ReactiveForm element in the form block is invalid.
* `{{invalidCount}}`
  * This shows the number of currently invalid ReactiveForm elements in the form block.
  * As elements become valid, the number adjusts reactively.
* `{{loading}}`
  * Lets us know if a form action is currently running.
  * Use this to show a spinner or other loading indicator.

**Highlights**

> A form block's *failed*, *success*, *invalid*, and *loading* states are mutually exclusive.

> ReactiveForm elements inside a form block affect the form's validity. They are reactively
validated with *SimpleSchema* at the form-level, thanks to a shared schema context.

Contributors
------------

* [Jon James](http://github.com/jonjamz)

My goal with this package is to keep it simple and flexible, similar to core packages.

As such, it may already have everything it needs.

**Please create issues to discuss feature contributions before creating a pull request.**
