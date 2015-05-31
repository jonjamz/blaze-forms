## API Reference

### Form Blocks

A TemplatesForms Form Block is a reusable component that plays the same role as a typical HTML
`<form>` element, but with added features that make it significantly more powerful and useful.

#### First Step: Create a Blaze Template

* Template code must be *wrapped in a form tag*.
* Template must contain UI.contentBlock with the proper fields (as below).

Here's an example of a compatible Form Block template.

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

      2. `form`:    This field is required. TemplatesForms takes care of its value
                    automatically.
    -->

    {{> UI.contentBlock data=data form=form}}

    <!-- An example of using some of the provided template helpers to control workflow -->
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


#### Second Step: Register the Template

```javascript
ReactiveForms.registerFormBlock({
  template: 'basicFormBlock',
  submitType: 'normal' // or 'enterKey', which captures that event in the form
});
```

#### Third Step: Usage

Form Blocks are named so because they are technically *block helpers* in Blaze.

```handlebars
{{#basicFormBlock data=data schema=schema action=action}}
  {{> basicInput field='firstName'}}
  {{> basicInput field='lastName'}}
  {{> basicInput field='email'}}
{{/basicFormBlock}}
```

Form Elements are put inside a Form Block as shown above. You can also put any HTML or template
logic inside a Form Block, and it will work as expected.

**Standalone Use** (Not Recommended)

Form Blocks can technically be used standalone, with plain HTML elements like `<input>`, as
long as they have `class="reactive-element"`.

This works because the first argument in the Action Function, `els`, contains an array of
HTML elements inside the Form Block with the `.reactive-element` class.

#### Highlights

> A Form Block's *failed*, *success*, *invalid*, and *loading* states are mutually exclusive.

> When a Form Block's *success* state is `true`, setting its *changed* state to `true` will cause
both its *success* and *submitted* states to become `false`. This makes it possible for users to
edit and submit a given form many times in one session--just keep the editable Elements
accessible in the UI after the first *success* (or provide a button that triggers the *changed* state).

> ReactiveForms Elements inside a Form Block affect the form's validity. They are reactively
validated with *SimpleSchema* at the form-level, thanks to a shared schema context.
