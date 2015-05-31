## How-To Guides

### Reset a Form Block and All Its Elements

In the Action Function, the second argument is the `callbacks` object.

By calling `callbacks.reset()` the Form Block will reset every Form Element inside it.

```javascript
Template.createNews.helpers({

  getAction: function() {
    return function(els, callbacks, changed) {

      // Save data. If successful, then...
      callbacks.success();
      callbacks.reset();

    }
  }

});

```

This is the simplest way to completely reset a form.

See the [Action Function](../api/ActionFunction.md) section of the API Reference for more information.