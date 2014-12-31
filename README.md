About
-----

Build production-ready, reactive forms in minutes. Turn simple templates into robust form components using the provided API.

#### Facts

* Low-complexity, flexible and reliable.
* Architecture restricted to fit within Meteor's standard Templates API.
* Development workflow centered around template helpers.
* Validation handled using [SimpleSchemas](https://github.com/aldeed/meteor-simple-schema)--however, these are not required.

#### Overview

This package supports two types of reusable form components:

* **Elements**
* **Form Blocks**

***Elements*** represent single form fields, while ***Form Blocks*** are containers that control workflow and handle submission. Each type has its own set of reactive states, used to control the experience, workflow, and functionality of a given form through template helpers.

Any compatible template can be transformed into one of the above components using the provided API--and either type of component be use used standalone. But, as you'll see, the real power comes from using the two types of components together.

*Create a component by registering a normal Meteor template*

```javascript
ReactiveForms.createElement({
  template: 'basicInput',
  validationEvent: 'keyup'
});
```

*Reuse the component anywhere--each instance is self-contained*

```handlebars
{{> basicInput schema=schema field='firstName'}}
{{> basicInput schema=schema field='lastName'}}
{{> basicInput schema=schema field='email'}}
```

#### Examples

[View the Live Example](http://forms-example.meteor.com/)

Built with Bootstrap 3 and the `sacha:spin` package, it demonstrates how flexible and extensible this package is. 

Browse the full code--nicely formatted thanks to the `code-prettify` package. 

See how simple it is to build an engaging form flow in a very _Meteor_ way!

Install
-------

`meteor add templates:forms`

This package works on the client-side only.

Usage
-----

#### 1. Provide a schema and an action function.

Define these in a parent template, or in global helpers.

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
  * Running `callbacks.success()` sets `success`.
  * Running `callbacks.failed()`  sets `failed`.
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

#### 2. Add ReactiveForms components.

The `basicForm` and `basicInput` templates are included with this package.

```handlebars
<!-- Wrapped input with form-wide schema -->
<template name="testForm">
  {{#basicForm schema=schema action=action}}
    {{> basicInput field='testField'}}
  {{/basicForm}}
</template>
```

See `templates:forms.html` to view the code.

#### 3. Register the ReactiveForms components if needed.

This is where you configure the components.

```javascript
ReactiveForms.createForm({
  template: 'basicForm',
  submitType: 'normal'
});

ReactiveForms.createElement({
  template: 'basicInput',
  validationEvent: 'keyup'
});
```

You only need to register a given component **once**.

Each time a component is rendered, it will have a unique context. Elements inside a form block will always be connected to the **instance** of the form block that contains them.

API
---

ReactiveForms has only two API endpoints.

Add any custom template that satisfies the basic requirements (outlined below), and you're
ready to go!

### *ReactiveForms.createElement()*

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

#### Element template requirements

* Template must contain one *form element*, for example `<input>`.
* The form element must:
  * Have the `reactive-element` class.
  * Support the `validationEvent` type you specify in `createElement` options.

Here's an example of a ReactiveForms element template.

```handlebars
<template name="basicInput">
  <div class="reactive-input-container">
    <strong>{{label}}</strong>
    <br>
    <input placeholder={{instructions}} class="reactive-element" value={{value}}>
    <br>
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
* Element values that pass validation are stored in *form-level data context*.

#### Element template helpers

Element templates have access to the following *local* helpers:

* `{{value}}`
  * The last value of this element that was able to pass validation.
  * Useful with some form components, such as a toggle button.
  * If you specified a `data` object on the form or element, this will initially hold the value associated with the relevant field in that object.
* `{{valid}}`
  * Use this to show validation state on the element, for example a check mark.
  * Initial data passed into the element is validated on `rendered`.
  * Defaults to *true* if no schema is provided.
* `{{changed}}`
  * This is *true* once the element's value has successfully changed.
  * Use this to show or hide things until the first validated value change is made.
  * Initial data passed into the element doesn't trigger `changed`.
* `{{isChild}}`
  * This is *true* if the element is wrapped in a form block, or *false* if it's not.
  * Use this to show or hide things regardless of what a parent form block's state is--for example, some different formatting.

These helpers are available when a *SimpleSchema* is being used:

* `{{label}}`
  * From the [label](https://github.com/aldeed/meteor-simple-schema#label) field in your *SimpleSchema* for this element's `field`.
  * Use this as the title for your element, for example "First Name".
* `{{instructions}}`
  * A field we extended *SimpleSchema* with for this package.
  * Good for usability, use this as the placeholder message or an example value.
* `{{errorMessage}}`
  * A reactive error message for this field, using [messages](https://github.com/aldeed/meteor-simple-schema#customizing-validation-messages) provided by *SimpleSchema*.

While inside a form block, these *form-level* helpers will be available:

* `{{submitted}}`
  * Lets us know if a parent ReactiveForms form block has been submitted yet.
  * Use this to wrap `{{errorMessage}}` to delay showing element invalidations until submit.
* `{{loading}}`
  * Lets us know if a form action is currently running.
  * Use this to disable changes to an element while the submit action is running.
* `{{success}}`
  * This is *true* if a form action was successful.
  * Use this to hide things in the element after submission.

All the *form-level* helpers will be `false` when an element is running standalone.
However, you can override specific properties on an element when you invoke it:

```handlebars
<!-- The `basicInput` example will now show its error messages when standalone -->
{{> basicInput schema=schema field='testField' submitted=true}}
```

#### Highlights

> When running standalone (without being wrapped in a form block) you'll put the schema on the
element's template invocation. You can also override the other form-level helpers on elements this way.

> Be sure to add the reactive-element class to your element so that it's selected when the form action is run.


### *ReactiveForms.createForm()*

Create a ReactiveForms form block from a compatible template.

```javascript
ReactiveForms.createForm({
  template: 'basicForm',
  submitType: 'normal' // or 'enterKey', which captures that event in the form
});
```

#### Form block template requirements

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
        failed=__failed__
        success=__success__
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

#### Form block template helpers

Form block templates have access to the following helpers:

* `{{invalid}}`
  * This is *true* if any ReactiveForms element in the form block is invalid.
* `{{invalidCount}}`
  * This shows the number of currently invalid ReactiveForms elements in the form block.
  * As elements become valid, the number adjusts reactively.
* `{{changed}}`
  * This is *true* if any valid value change has been made in the form block since it was rendered.
  * Initial data validation doesn't trigger `changed`, and neither do duplicate values.
  * If `changed` is triggered after `success`, it resets `submitted` and `success` to `false`.
* `{{submitted}}`
  * This is *true* if the form has ever been submitted.
  * Submission requires all form elements to be valid.
* `{{loading}}`
  * Lets us know if a form action is currently running.
  * Use this to show a spinner or other loading indicator.
* `{{failed}}`
  * This is *true* if the last attempt to run the form action failed.
* `{{success}}`
  * This is *true* if the last attempt to run the form action was a success.
  * Use this to hide elements or otherwise end the form's session.


#### Highlights

> A form block's *failed*, *success*, *invalid*, and *loading* states are mutually exclusive.

> When a form block's *success* state is `true`, setting its *changed* state to `true` will cause
both its *success* and *submitted* states to become `false`. This makes it possible for users to
edit and submit a given form many times in one session--just keep the editable elements
accessible in the UI after the first *success* (or provide a button that triggers the *changed* state).

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
