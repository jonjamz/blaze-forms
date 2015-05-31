## How-To Guides

### Provide a Reset Function for a Custom Element

In order for the global reset to work properly, each Element being used needs to have specified a `reset`
function when it was registered with TemplatesForms.

The `reset` function receives the element with `.reactive-element` class as its only argument.
This should be sufficient even for advanced resetting functionality in a complex Element.

```javascript
TemplatesForms.registerElement({
  template: 'myInput',
  validationEvent: 'keyup',
  reset: function (el) {
    $(el).val('');
  }
});
```

