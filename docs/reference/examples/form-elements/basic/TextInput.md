## Examples - Form Elements

### Text Input

A basic text input.

```handlebars
<template name="inputElement">
  <input type="text" class="reactive-element" value={{value}}>
</template>
```

If no `valudationValue` method is provided, the package defaults to using `$(el).val()`.

```javascript
TemplatesForms.registerFormElement({
  template: 'inputElement',
  validationEvent: 'keyup'
});
```