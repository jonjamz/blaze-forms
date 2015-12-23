*Note: The latest release, `v2.0.0`, brings many great improvements and only one breaking change to the public API. Updated documentation is forthcoming. Please see the `History.md` document for details.*

About
-----

Build production-ready, reactive forms in minutes. Even complex workflows can be achieved with just a few lines of code.

#### Facts

* Low-complexity architecture.
* Easy development using template helpers and reusable custom components.
* Built with Meteor's standard Template API for maximum compatibility.
* Uses [SimpleSchemas](https://github.com/aldeed/meteor-simple-schema) for reactive validation, if provided.

#### Overview

This package supports two types of reusable form components:

* **Elements**
* **Form Blocks**

While ***Elements*** represent single form fields, ***Form Blocks*** are containers that control workflow and handle submission. Each type has its own set of reactive states, used to control the experience, workflow, and functionality of a given form through template helpers.

Any compatible template can be transformed into one of the above components using the provided API--and either type of component be use used standalone. But, as you'll see, the real power comes from using the two types of components together.

*Create a component by registering a normal Meteor template.*

```javascript
ReactiveForms.createElement({
  template: 'basicInput',
  validationEvent: 'keyup'
});
```

*Reuse the component anywhere--each instance is self-contained.*

```handlebars
{{> basicInput schema=schema field='firstName'}}
{{> basicInput schema=schema field='lastName'}}
{{> basicInput schema=schema field='email'}}
```

#### Examples

[View the Live Example](http://forms-example.meteor.com/)

Built with Bootstrap 3 and the `sacha:spin` package, it demonstrates how flexible and extensible this package is.

[View a Package User's Example](https://github.com/dmiskiew/meteor-templates-forms-example)

One of the package users, Darek Miskiewicz, has put together a great example in the form of a GitHub repo that you might prefer over the live example. 

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
    return function (els, callbacks, changed) {
      console.log("[forms] Action running!");
      console.log("[forms] Form data!", this);
      console.log("[forms] HTML elements with `.reactive-element` class!", els);
      console.log("[forms] Callbacks!", callbacks);
      console.log("[forms] Changed fields!", changed);
      callbacks.success(); // Display success message.
      callbacks.reset();   // Run each Element's custom `reset` function to clear the form.
    };
  }
});
```

The **action function** runs when the form is submitted. It takes three params, as shown above:

* `els`
  * This contains any HTML elements in the Form Block with class `.reactive-element`.
  * You may use this to retrieve data and save it to the database.
  * You can also use this to clear values after the form has successfully been submitted.
* `callbacks`
  * This contains two methods to trigger the form's state, and one method for resetting the form.
  * Running `callbacks.success()` sets `success`.
  * Running `callbacks.failed()`  sets `failed`.
  * Running `callbacks.reset()`   runs the custom reset function for each Element in the Form Block
    and clears Form Block state except for `success` and `failed` states and related messages.
    This allows users to see any available feedback even if the form is reset.
    * To clear all states and messages, use `callbacks.reset(true)`.
  * The form's `{{loading}}` state (see below) will run from the time you submit to the time you call one of these.
* `changed`
  * If you passed in initial data, this contains an object with only the fields that have changed.
    If you didn't, this is `undefined`.
  * This is useful for figuring out what fields to use in an update query.
  
##### Retrieve Form Values with `this`
All validated form values are available with no extra work:

```javascript
// Inside the action function...
console.log(this); // Returns {testField: "xxx"}
```

Data from Elements passed into the action function is **guaranteed to be valid**, considering:

* You provided an adequate schema.
* You used ReactiveForms Elements.
* You specified the correct schema field for each Element (see `basicInput` in the next example).

Hopefully, this satisfies your needs.

#### 2. Add ReactiveForms components.

The `basicFormBlock` and `basicInput` templates are included with this package.

Connect Elements to the schema in a surrounding Form Block using the `field` property.

```handlebars
<!-- Wrapped input with form-wide schema -->
<template name="testForm">
  {{#basicFormBlock schema=schema action=action}}
    {{> basicInput field='testField'}}
  {{/basicFormBlock}}
</template>
```

See the `templates` folder to view the code.

#### 3. Register the ReactiveForms components if needed.

This is where you configure the components.

```javascript
ReactiveForms.createFormBlock({
  template: 'basicFormBlock',
  submitType: 'normal'
});

ReactiveForms.createElement({
  template: 'basicInput',
  validationEvent: 'keyup',
  reset: function (el) {
    $(el).val('');
  }
});
```

You only need to register a given component **once**.

Each time a component is rendered, it will have a unique context. Elements inside a Form Block will always be connected to the **instance** of the Form Block that contains them.

API
---

ReactiveForms has only two API endpoints.

Add any custom template that satisfies the basic requirements (outlined below), and you're
ready to go!

### *ReactiveForms.createElement()*

Create a ReactiveForms Element from a compatible template.

```javascript
ReactiveForms.createElement({
  template: 'basicInput',
  validationEvent: 'keyup', // Can also be an array of events as of 1.13.0!
  validationValue: function (el, clean, template) {
    // This is an optional method that lets you hook into the validation event
    // and return a custom value to validate with.

    // Shown below is the ReactiveForms default. Clearly, this won't work in the case
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

#### Element template requirements

* Template must contain one *HTML element*, for example `<input>`.
* The HTML element must:
  * Have the `reactive-element` class (or a custom selector you specify using `validationSelector`).
  * Support the `validationEvent` type(s) you specify in `createElement` options.

> You can also put the `reactive-element` class on a container in the Element to delegate the event.

Here's an example of a ReactiveForms Element template.

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

Elements can be used standalone, with a *SimpleSchema* specified, like this:

```handlebars
{{> basicInput schema=schema field='testField'}}
```

However, Elements are usually used within a Form Block helper, where they transparently
integrate with the parent form component.

```handlebars
{{#basicFormBlock schema=schema action=action}}
  {{> basicInput field='testField'}}
{{/basicFormBlock}}
```

Here's what changes when this happens:

* Elements *use the form-level schema*--the `field` property on the Element specifies which field in the form's schema to use.
* An Element that fails validation will *prevent the form from submitting*.
* Elements *get access to form-level state*, enabling helpers like `{{loading}}`.
* Element values that pass validation are stored in *form-level data context*.

#### Element template helpers

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
  * Lets us know if a parent ReactiveForms Form Block has been submitted yet.
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

#### Using nested Elements for cleaner code

As you build out your elements, you may start to feel like abstracting some common code.

Well, it only takes two steps:

1. Create a partial Element template, but without the usual `.reactive-element`
HTML element inside. You can use all the usual Element template helpers.

2. Register the template using `ReactiveForms.createElement()`, but don't include the usual
`validationEvent` field.

Here are examples of two types of possible nested elements:

*Separate templates for labels and error messages.*

```handlebars
<template name="bootstrapLabel">
  <label class="control-label">
    {{#if schema.label}}
      {{schema.label}}
    {{else}}
      {{field}}
    {{/if}}
  </label>
</template>

<template name="bootstrapErrorMsg">
  <p class="help-block">
    {{#if ../valid}}
      {{instructions}}
    {{else}}
      {{errorMessage}}
    {{/if}}
  </p>
</template>

<template name="bootstrapInput">
  <div class="form-group  {{#unless valid}}has-error{{/unless}}">
    {{> bootstrapLabel}}
    <input name="{{field}}" class="form-control reactive-element" value="{{value}}">
    {{> bootstrapErrorMsg}}
  </div>
</template>
```

*Wrapper template for Elements (use as a block helper).*

```handlebars
<!-- Block helper to wrap any Elements -->
<template name="myElementContainer">
  <div>
    <label>{{label}}</label>
    <br>
    {{> UI.contentBlock}}
    <!-- Show error if submitted but not successful -->
    {{#if submitted}}
      {{#if errorMessage}}<p class="error-message">{{errorMessage}}</p>{{/if}}
    {{/if}}
  </div>
</template>

<!-- Element template -->
<template name="myInputElement">
  <input placeholder={{schema.instructions}} class="reactive-element" value={{value}}>
</template>

<!-- Here's a form using all the above components -->
<template name="myLeadGenForm">
  {{#defaultFormBlock action=action schema=schema data=data}}
    {{#if success}}
      <p>Success! Form submitted.</p>
    {{else}}
      {{#myElementContainer field='firstName'}}
        {{> myInputElement field='firstName'}}
      {{/myElementContainer}}

      {{#myElementContainer field='lastName'}}
        {{> myInputElement field='lastName'}}
      {{/myElementContainer}}

      {{#myElementContainer field='phoneNumber'}}
        {{> myInputElement field='phoneNumber'}}
      {{/myElementContainer}}
    {{/if}}
    <hr>
    <button type="submit">Submit</button>
  {{/defaultFormBlock}}
</template>
```

Of course the above component templates need to be registered with `ReactiveForms` to work.

#### Highlights

> When running standalone (without being wrapped in a Form Block) you'll put the schema on the
Element's template invocation. You can also override the other form-level helpers on Elements this way.

> To force an element to run in standalone mode, you can specify `standalone=true` in the template's invocation.

> Be sure to add the reactive-element class to your Element so that it's selected when the form action is run.

> Partial element templates can be used to abstract out common code. You can even create element block templates to wrap your elements.


### *ReactiveForms.createFormBlock()*

Create a ReactiveForms Form Block from a compatible template.

```javascript
ReactiveForms.createFormBlock({
  template: 'basicFormBlock',
  submitType: 'normal' // or 'enterKey', which captures that event in the form
});
```

#### Form Block template requirements

* Template code must be *wrapped in a form tag*.
* Template must contain UI.contentBlock with the proper fields (as below).

Here's an example of a ReactiveForms Form Block template.

```handlebars
<template name="basicFormBlock">
  <form>

    <!--
      Note:

      Use this `UI.contentBlock` exactly as it is here, in every Form Block template.

      There are two fields.

      1. `data`:    This allows you to pass default values into the form. If you'll
                    never use the form for updating existing data, you can leave it
                    out and nothing will break.

      2. `context`: This field is required. ReactiveForms takes care of the value
                    automatically.
    -->

    {{> UI.contentBlock data=data context=context}}

    <!-- The below helpers represent exclusive states,
      meaning they never appear at the same time -->

    <p>
      <button type="submit">Submit</button>
      <span>
        {{#if loading}}
          Loading...
        {{/if}}

        {{#if invalid}}
          Can't submit! There are {{invalidCount}} invalid fields!
        {{/if}}

        {{#if failed}}
          <strong>{{#if failedMessage}}{{failedMessage}}{{else}}Unable to submit the form.{{/if}}</strong>
        {{/if}}

        {{#if success}}
          <strong>{{#if successMessage}}{{successMessage}}{{else}}Saved!{{/if}}</strong>
        {{/if}}
      </span>
    </p>

  </form>
</template>
```

Form Blocks can technically be used standalone, with normal, non-reactive form elements like
inputs and check boxes. The form's **action function**, which runs on submit, always receives
an array containing the HTML elements inside the form with the `.reactive-element` class.

However, we strongly recommend using ReactiveForms Elements inside a Form Block, which are
reactively validated with *SimpleSchema*:

```handlebars
{{#basicFormBlock schema=schema action=action}}
  {{> basicInput field='firstName'}}
  {{> basicInput field='lastName'}}
  {{> basicInput field='email'}}
{{/basicFormBlock}}
```

If you do this, you can trust that the data passed to your action function is already valid.
All you'll need to do then is get the data from the form elements and save it somewhere!

#### Form Block template helpers

Form Block templates have access to the following helpers:

* `{{invalid}}`
  * After a submission, this is *true* if any ReactiveForms Element in the Form Block is invalid.
  * As soon as all Elements become valid, it changes back to *false*.
  * Use this to show a form-level error message after submission.
* `{{invalidCount}}`
  * This shows the number of currently invalid ReactiveForms Elements in the Form Block.
  * As Elements become valid, the number adjusts reactively.
* `{{changed}}` (inverse `{{unchanged}}`)
  * This is *true* if any valid value change has been made in the Form Block since it was rendered.
  * Initial data validation doesn't trigger `changed`, and neither do duplicate values.
  * If `changed` is triggered after `success`, it resets `submitted` and `success` to `false`.
* `{{submitted}}` (inverse `{{unsubmitted}}`)
  * This is *true* if the form has ever been submitted.
  * Submission requires all form Elements to be valid.
* `{{loading}}`
  * Lets us know if a form action is currently running.
  * Use this to show a spinner or other loading indicator.
* `{{failed}}`
  * This is *true* if the last attempt to run the form action failed.
* `{{failedMessage}}`
  * This would display "1 item failed!" in the case of `callbacks.failed('1 item failed!')`.
* `{{success}}`
  * This is *true* if the last attempt to run the form action was a success.
  * Use this to hide Elements or otherwise end the form's session.
* `{{successMessage}}`
  * This would display "Thank you!" in the case of `callbacks.success('Thank you!')`.


#### Highlights

> A Form Block's *failed*, *success*, *invalid*, and *loading* states are mutually exclusive.

> When a Form Block's *success* state is `true`, setting its *changed* state to `true` will cause
both its *success* and *submitted* states to become `false`. This makes it possible for users to
edit and submit a given form many times in one session--just keep the editable Elements
accessible in the UI after the first *success* (or provide a button that triggers the *changed* state).

> ReactiveForms Elements inside a Form Block affect the form's validity. They are reactively
validated with *SimpleSchema* at the form-level, thanks to a shared schema context.

Working With Reactive Form Data
-------------------------------

Due to the real-time nature of Meteor, one can only assume that while editing some existing
data in a form, the original data might change before the edited work is submitted.

When data is changed remotely during a form session, there are three obvious ways to handle the experience:

1. Ignore the change and let the user submit their new form.
2. Patch in the changes mid-session without any real prompt.
3. Notify the user of remote changes and give them the opportunity to view and import those changes into the current session.

This package supports all three of the above options, but special care has been taken to ensure a good experience in the case of #3.

Here's a working example of how easy it is to present a user with the option to accept or ignore remote changes.

This is purely focused on text inputs--the other types of form elements will have different experiences and constraints.

```handlebars
<template name="inputElement">
  <input type={{type}} placeholder={{schema.instructions}} class="reactive-element" value={{value}}>
  {{#if remoteValueChange}}
    <p style="color:black">
      This field has been updated remotely. Load the latest
      <span title={{newRemoteValue}}>changes</span>?
      <button class="accept-changes">Load</button> <button class="ignore-changes">Ignore</button>
    </p>
  {{/if}}
</template>
```

```javascript
Template['inputElement'].events({
  'click .accept-changes': function (e, t) {
    e.preventDefault();
    var inst = Template.instance();
    inst[ReactiveForms.namespace].acceptValueChange();
  },
  'click .ignore-changes': function (e, t) {
    e.preventDefault();
    var inst = Template.instance();
    inst[ReactiveForms.namespace].ignoreValueChange();
  }
});
```

As you can see, we have access to the following template helpers:

* `{{remoteValueChange}}`
  * This is *true* if this Element's data has changed elsewhere during the current session.
    It resets every time changes are accepted or ignored.
  * Use this to toggle the message.
* `{{newRemoteValue}}`
  * This contains the actual value of the changed data. In our example, we put it in a `name`
    attribute, but it could be used for a tooltip or anything else.

We can control how we deal with remote changes using these template instance methods:

* `acceptValueChange()`
  * A method that copies the changed data into the current form data context (and thus into
    the Elements, depending on your configuration).
* `ignoreValueChange()`
  * A method that resets `remoteValueChange` to *false*.

For more fine-grained control over how your form handles remote data changes, specify an `onDataChange` hook
via a template helper (just like *schema*, *action*, and *data*):

```javascript
Template['testForm'].helpers({
  onDataChange: function() {
    return function(oldData, newData) {
      if (!_.isEqual(oldData, newData)) {

        // Use one or more of the below methods.
        // Usually, you should only need `this.refresh()`.
        // Create an issue if you need something else here.

        // Reset the form (equivalent to `callbacks.reset()` in the action function).
        this.reset(true);

        // Refresh unchanged Elements to reflect new data.
        // Optionally: `this.refresh('dot.notation', customValue)`.
        this.refresh();

        // This sets the form's `changed` state to `true`.
        this.changed();

      }
    };
  }
});

```

This hook allows you to update your entire form during remote data changes without needing
to use `passThroughData` on individual elements.

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

> Special thanks to [steph643](https://github.com/steph643) for significant testing and review.

My goal with this package is to keep it simple and flexible, similar to core packages.

As such, it may already have everything it needs.

**Please create issues to discuss feature contributions before creating a pull request.**
