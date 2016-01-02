## API Reference

### Form Blocks

A form block wraps around your form elements to create a complete form. It stores data from form elements in a single object and handles submission, validation and form states. 

Form blocks are reusable components that play the same role as a typical HTML
`<form>` element, but with added features that make it significantly more powerful and useful.

#### Step 1: Create a Blaze Template

* Template code must be *wrapped in a form tag*.
* Template must contain UI.contentBlock with the proper fields (as below).

Here's an example of a compatible form block template.

```handlebars
<template name="myFormBlock">
  <form>

    <!--
      Note:

      Use this `UI.contentBlock` exactly as it is here, in every form block template.

      There are two fields.

      1. `data`:    This allows you to pass default values into the form. If you'll
                    never use the form for updating existing data, you can leave it
                    out and nothing will break.

      2. `context`: This field is required. TemplatesForms takes care of its value
                    automatically.
    -->

    {{> UI.contentBlock data=data context=context}}

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

Form block templates have access to the following helpers:

* `{{invalid}}`
  * After a submission, this is *true* if any element in the form block is invalid.
  * As soon as all elements become valid, it changes back to *false*.
  * Use this to show a form-level error message after submission.
* `{{invalidCount}}`
  * This shows the number of currently invalid elements in the form block.
  * As elements become valid, the number adjusts reactively.
* `{{changed}}` (inverse `{{unchanged}}`)
  * This is *true* if any valid value change has been made in the form block since it was rendered.
  * Initial data validation doesn't trigger `changed`, and neither do duplicate values.
  * If `changed` is triggered after `success`, it resets `submitted` and `success` to `false`.
* `{{submitted}}` (inverse `{{unsubmitted}}`)
  * This is *true* if the form has ever been submitted.
  * Submission requires all form elements to be valid.
* `{{loading}}`
  * Lets us know if a form action function is currently running.
  * Use this to show a spinner or other loading indicator.
* `{{failed}}`
  * This is *true* if the last attempt to run the form action failed.
* `{{failedMessage}}`
  * This would display "1 item failed!" in the case of `callbacks.failed('1 item failed!')` in the form action function.
* `{{success}}`
  * This is *true* if the last attempt to run the form action was a success.
  * Use this to hide elements or otherwise end the form's session.
* `{{successMessage}}`
  * This would display "Thank you!" in the case of `callbacks.success('Thank you!')` in the form action function.

>**Tip:** A form block's *failed*, *success*, *invalid*, and *loading* states are mutually exclusive.

#### Step 2: Register the Template

```javascript
TemplatesForms.registerFormBlock({
  template: 'myFormBlock',
  submitType: 'normal' // or 'enterKey', which captures that event in the form
});
```

#### Step 3: Usage

Form blocks are named so because they are technically *block helpers* in Blaze.

```handlebars
{{#basicFormBlock data=data schema=schema action=action}}
  {{> basicInput field='firstName'}}
  {{> basicInput field='lastName'}}
  {{> basicInput field='email'}}
{{/basicFormBlock}}
```

Form elements are put inside a form block as shown above. You can also put any HTML or template
logic inside a form block, and it will work as expected.

**Standalone Use** (Not Recommended)

Form blocks can technically be used standalone, with plain HTML elements like `<input>`, as
long as they have `class="reactive-element"`.

This works because the first argument in the action function, `els`, contains an array of
HTML elements inside the form block with the `.reactive-element` class.

#### Highlights

> A form block's *failed*, *success*, *invalid*, and *loading* states are mutually exclusive.

> When a form block's *success* state is `true`, setting its *changed* state to `true` will cause
both its *success* and *submitted* states to become `false`. This makes it possible for users to
edit and submit a given form many times in one session--just keep the editable elements
accessible in the UI after the first *success* (or provide a button that triggers the *changed* state).

> Elements inside a form block affect the form's validity. They are reactively
validated with a form-level schema context as their values change. 
