## Examples - Form Elements

### Adjustable Number of Inputs

Create a simple template to enumerate inputs, with a button to add more.

```handlebars
<template name="inputElement">
  <div class="reactive-element">
    {{#each numberOfFields}}
      <input class="reactive-element" value={{getValueFor . ../value}}>
    {{/each}}
  </div>
  <button class="add-field">Add another field</button>
</template>
```

As Form Elements are just Blaze templates, you can add whatever custom helpers and events
you want to get added functionality in those components. Everything will be instance-scoped.

```javascript
// Add helpers for the custom state
Template['inputElement'].helpers({
  numberOfFields: function () {
    var currentFieldCount = Template.instance().numberOfFields.get();
    var times = [];
    _.times(currentFieldCount, function (n) {
      times.push(n);
    });
    return times;
  },
  getValueFor: function (n, values) {
    if (n && values && values[n]) {
      return values[n];
    }
  }
});

// Add event to change custom state
Tempate['inputElement'].events({
  'click .add-field': function (event, template) {
    event.preventDefault();
    var currentFieldCount = Template.instance().numberOfFields.get();
    currentFieldCount++;
    Template.instance().numberOfFields.set(currentFieldCount);
  }
});
```

Use the optional `validationValue` method to transform data from the DOM before it gets
validated and sent to the form's internal data context.

```javascript
// Add ReactiveVar here using the `created` callback
TemplatesForms.registerFormElement({
  template: 'inputElement',
  validationEvent: 'keyup',
  validationValue: function (el, clean, template) {
    var values = $.map($(el).find("input"), function (e) {
      return $(e).val();
    });
    return values; // An array with all your input values
  },
  created: function () {
    this.numberOfFields = new ReactiveVar(1); // Default to one field
  }
});
```
