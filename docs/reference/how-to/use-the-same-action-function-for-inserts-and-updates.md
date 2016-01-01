## How-To Guides

### Use the Same Action Function for Inserts and Updates

The Action Function is passed into a Form Block via a template helper, and runs when the
form is submitted.

The data context comprised of all the return values of the Form Elements is available via
`this`. Where initial data was provided, a `changed` argument is passed into the Action Function,
which makes getting only the changed data for updates trivial.

The `changed` argument is `undefined` where no initial data was provided.

```javascript
Template.createNews.helpers({

  getAction: function() {
    return function(els, callbacks, changed) {
      if (changed) {
        // Perform update query.
      } else {
        // Perform insert query.
      }
    }
  }

});

```

