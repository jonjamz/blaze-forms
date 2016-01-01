## Examples - Form Elements

### Textarea

Return text from an HTML textarea.

Note that it's possible to limit the allowed number of characters by specifying a maximum
length in the schema.

```handlebars
<template name="textareaElement">
  <textarea class="reactive-element">{{value}}</textarea>
</template>
```

```javascript
TemplatesForms.registerFormElement({
  template: 'textareaElement',
  validationEvent: 'keyup',
  validationValue: function (el, clean, template) {
    var value = $(el).val();

    // It would be easy to do more complex things here, like split the text into an array
    // for quick-list type functionality.

    return value;
  }
});
```