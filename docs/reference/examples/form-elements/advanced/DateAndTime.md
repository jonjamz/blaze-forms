## Examples

### Date and Time

Combine values from separate date and time inputs into a single JavaScript Date Object.

Support initial data by transforming a date object to date and time strings using a template helper.

```handlebars
<template name="dateTimeElement">
  <div class="reactive-element">
    Date: <input type="date" value={{dateToString value}}><br>
    Time: <input type="time" value={{timeToString value}}>
  </div>
</template>
```

```javascript
TemplatesForms.registerFormElement({
  template: 'dateTimeElement',
  validationEvent: 'change',
  validationValue: function (el, clean, template) {
    var values = $(el).find('input').map(function () {
      return $(this).val();
    });
    return new Date(values.join('T')); // A single Date Object.
  }
});
```