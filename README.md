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
      console.log("[forms] Form data!", this);
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

Also, all validated form values are available with no extra work from `this`:

```javascript
// Inside the action function...
console.log(this); // Returns {testField: "xxx"}
```

Data from elements passed into the action function is **guaranteed to be valid**, considering:
* You provided an adequate schema.
* You used ReactiveForms elements.
* You specified the correct schema field for each element (see `basicInput` in the next example).

Hopefully, this satisfies your needs.

**2. Add the ReactiveForms form block and elements to the parent template**.

```handlebars
<!-- Wrapped input with form-wide schema -->
<template name="testForm">
  {{#basicForm schema=schema action=action}}
    {{> basicInput field='testField'}}
  {{/basicForm}}
</template>
```

**3. Register the form block and elements with ReactiveForms**.

This is where you can specify how the form gets submitted, and how the element gets validated.

```javascript
ReactiveForms.createForm({
  template: 'basicForm',
  submitType: 'normal'
});

ReactiveForms.createElement({
  template: 'basicInput',
  validationEvent: 'keyup',
  validationValue: function (el, clean, template) {
    return clean(el.value);
  }
});
```

The `basicForm` and `basicInput` templates are **included** with this package, however you still need to **register** them.

See `templates:forms.html` to see the code.

You only need to register a given form block or element template once--each time it's rendered, it will have a unique context. For elements, they'll always be connected to the instance of the form block that contains them.

### API

ReactiveForms has only two API endpoints.

Add any custom template that satisfies the basic requirements (outlined below), and you're
ready to go!

#### ReactiveForms.createElement

Create a ReactiveForms element from a compatible template.

```javascript
ReactiveForms.createElement({
  template: 'basicInput',
  validationEvent: 'keyup',
  validationValue: function (el, clean, template) {
    // This is an optional method that lets you hook into the validation event
    // and return a custom value to validate with.

    // Shown below is the ReactiveForms default. Clearly, this won't work in the case
    // of a multi-select form, but you could get those values and put them in an array.

    // The `clean` argument comes from SimpleSchema, but has been wrapped--
    // it now takes and returns just a value, not an object.
    console.log('Specifying my own validation value!');
    value = $(el).val();
    return clean(value);
  }
});
```

**Element template requirements**

* Template must contain *one form element*, for example `<input>`.
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

* `{{value}}`
  * The last value of this element that was able to pass validation.
  * Useful with some form components, such as a toggle button.
  * If you specified a `data` object on the form or element, this will initially hold the value associated with the relevant field in that object.
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
* `{{changed}}`
  * This is *true* once the element's value has successfully changed.
  * Use this to show or hide things until the first validated value change is made.
  * Initial data passed into the element doesn't trigger `changed`.
* `{{submitted}}`
  * Lets us know if a parent ReactiveForms form block has been submitted yet.
  * Used to wrap `{{errorMessage}}` to delay showing element invalidations until submit.
  * Defaults to *true* unless this template exists inside a ReactiveForms form block.
* `{{loading}}`
  * Lets us know if a form action is currently running.
  * Use this to disable changes to an element while the submit action is running.
  * Defauts to *false* unless this template exists inside a ReactiveForms form block.

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

      Use this UI.contentBlock exactly as it is here, in every form block template.
      The first field (data) is optional, and lets you pass in default values.
    -->

    {{> UI.contentBlock
        data=data
        schema=schema
        schemaContext=__schemaContext__
        setValidatedValue=__setValidatedValue__
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
inputs and check boxes. The form's **action function**, which runs on submit, always receives
an array containing the HTML elements inside the form with the `.reactive-element` class.

However, we strongly recommend using ReactiveForms elements inside a form block, which are
reactively validated with *SimpleSchema*:

```handlebars
{{#basicForm schema=schema action=action}}
  {{> basicInput field='firstName'}}
  {{> basicInput field='lastName'}}
  {{> basicInput field='email'}}
{{/basicForm}}
```

If you do this, you can trust that the data passed to your action function is already valid.
All you'll need to do then is get the data from the form elements and save it somewhere!

**Form block template helpers**

Form block templates have access to the following helpers:

* `{{failed}}`
  * This is *true* if the last attempt to run the form action failed.
* `{{success}}`
  * This is *true* if the last attempt to run the form action was a success.
* `{{invalid}}`
  * This is *true* if any ReactiveForms element in the form block is invalid.
* `{{invalidCount}}`
  * This shows the number of currently invalid ReactiveForms elements in the form block.
  * As elements become valid, the number adjusts reactively.
* `{{loading}}`
  * Lets us know if a form action is currently running.
  * Use this to show a spinner or other loading indicator.
* `{{changed}}`
  * This is *true* if any valid value change has been made in the form.
  * Initial data validation doesn't trigger `changed`.
* `{{submitted}}`
  * This is *true* if the form has ever been submitted.

**Highlights**

> A form block's *failed*, *success*, *invalid*, and *loading* states are mutually exclusive.

> ReactiveForms elements inside a form block affect the form's validity. They are reactively
validated with *SimpleSchema* at the form-level, thanks to a shared schema context.

Other Forms Packages
--------------------

Here's the low-down on other Meteor forms packages and how they compare to this one.

**[AutoForm](https://github.com/aldeed/meteor-autoform)**

> While AutoForm strives to offer every option under the sun, `templates:forms` is minimalist in nature--it
gives you what you need to build your own stuff, and doesn't make too many assumptions!

* AutoForm is a much heavier package than `templates:forms`, as it aims to do much more.
* Its API is significantly more verbose.
* It has many features and options--perhaps too many, depending on your taste.
  * AutoForm will auto-generate HTML forms for you off your schema.
  * AutoForm integrates with [Collection2](https://github.com/aldeed/meteor-collection2).
  * It will fully handle form submission for you, including database inserts.
* It also validates with [SimpleSchema](https://github.com/aldeed/meteor-simple-schema).
* It comes from the pre-1.0 era of Meteor, and isn't fully optimized for the new Template API.
  * In comparison, `templates:forms` always keeps things self-contained in template instances.
* It has some nice plugins created by community members.

*Know of another good forms package? Fork this repo, add it here, and create a PR!*

Contributors
------------

* [Jon James](http://github.com/jonjamz)

My goal with this package is to keep it simple and flexible, similar to core packages.

As such, it may already have everything it needs.

**Please create issues to discuss feature contributions before creating a pull request.**
