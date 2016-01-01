## Examples - Form Elements

### Select (Drop-down)

Provide data by passing `items` into the template instance.

Support initial data by comparing values against the selected value using a template helper.

When no value has been selected, a placeholder prompting to choose a value is shown.

```handlebars
<template name="selectElement">
  <select class="reactive-element">
    {{#unless value}}
      <option value="" disabled selected style='display:none;'>Choose...</option>
    {{/unless}}
    {{#each items}}
      <option value="{{value}}" selected={{isEqual ../value value}}>{{name}}</option>
    {{/each}}
  </select>
</template>
```

```javascript
TemplatesForms.registerFormElement({
  template: 'selectElement',
  validationEvent: 'change',
  validationValue: function (el, clean, template) {
    return $(el).val();
  }
});
```