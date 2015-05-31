## How-To Guides

### Maximize Reusability with Nested Elements

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

