## API Reference

### Action Function

```javascript
Template.createNews.helpers({
  action: function () {
    return function (els, callbacks, changed) {
      console.log("[forms] Form data!", this);
      console.log("[forms] HTML elements with `.reactive-element` class!", els);
      console.log("[forms] Callbacks!", callbacks);
      console.log("[forms] Changed fields!", changed);
      callbacks.success(); // Display success message.
      callbacks.reset();   // Run each Element's custom `reset` function to clear the form.
    };
  }
});
```

The Action Function runs when the form is submitted. Data from the form fields is available
directly from `this`. The function also provides three parameters, as you can see above:

* `els`
  * This contains any HTML elements in the Form Block with class `.reactive-element`.
  * You may use this to retrieve data and save it to the database.
  * You can also use this to clear values after the form has successfully been submitted.
* `callbacks`
  * This contains two methods to trigger the form's state, and one method for resetting the form.
  * Running `callbacks.success()` sets `success`.
  * Running `callbacks.failed()`  sets `failed`.
  * Running `callbacks.reset()`   runs the custom reset function for each Element in the Form Block
    and clears Form Block state except for `success` and `failed` states and related messages.
    This allows users to see any available feedback even if the form is reset.
    * To clear all states and messages, use `callbacks.reset(true)`.
  * The form's `{{loading}}` state (see below) will run from the time you submit to the time you call one of these.
* `changed`
  * If you passed in initial data, this contains an object with only the fields that have changed.
    If you didn't, this is `undefined`.
  * This is useful for figuring out what fields to use in an update query.

Data from Elements passed into the action function is **guaranteed to be valid**, considering:

* You provided an adequate schema.
* You used registered Form Elements inside your Form Block.
* You specified the correct field for each Element.
