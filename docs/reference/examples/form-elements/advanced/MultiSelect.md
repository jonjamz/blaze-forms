## Examples - Form Elements

### Select (Multi)

Return an array of values from a multi-select element.

To handle initial data, compare the individual values against the array of selected values
using a template helper.

```handlebars
<template name="multiSelectElement">
  <select class="reactive-element" multiple="multiple">
    {{#each items}}
      <option value="{{value}}" selected={{contains ../value value}}>{{name}}</option>
    {{/each}}
  </select>
</template>
```

```javascript
TemplatesForms.registerFormElement({
  template: 'multiSelectElement',
  validationEvent: 'change',
  validationValue: function (el, clean, template) {
    // jQuery handles returning an array of values automatically.
    return $(el).val() || [];
  }
});
```