## Examples - Form Elements

### Date Selector

Return a JavaScript Date Object from an HTML date input.

Support initial data by transforming the date to a string using a template helper.

```handlebars
<template name="dateElement">
  Date: <input type="date" class="reactive-element" value={{dateToString value}}>
</template>
```

```javascript
TemplatesForms.registerFormElement({
  template: 'dateElement',
  validationEvent: 'change',
  validationValue: function (el, clean, template) {
    var value = $(el).val();
    var date = value ? new Date(value) : null;
    return date;
  }
});
```