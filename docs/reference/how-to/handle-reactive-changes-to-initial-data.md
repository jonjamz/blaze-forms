## How-To Guides

### Handle Reactive Changes to Initial Data

Due to the real-time nature of Meteor, one can only assume that while editing some existing
data in a form, the original data might change before the edited work is submitted.

When data is changed remotely during a form session, there are three obvious ways to handle the experience:

1. Ignore the change and let the user submit their new form.
2. Patch in the changes mid-session without any real prompt.
3. Notify the user of remote changes and give them the opportunity to view and import those changes into the current session.

This package supports all three of the above options, but special care has been taken to ensure a good experience in the case of #3.

Here's a working example of how easy it is to present a user with the option to accept or ignore remote changes.

This is purely focused on text inputs--the other types of form elements will have different experiences and constraints.

```handlebars
<template name="inputElement">
  <input type={{type}} placeholder={{schema.instructions}} class="reactive-element" value={{value}}>
  {{#if remoteValueChange}}
    <p style="color:black">
      This field has been updated remotely. Load the latest
      <span title={{newRemoteValue}}>changes</span>?
      <button class="accept-changes">Load</button> <button class="ignore-changes">Ignore</button>
    </p>
  {{/if}}
</template>
```

```javascript
Template['inputElement'].events({
  'click .accept-changes': function (e, t) {
    e.preventDefault();
    var inst = Template.instance();
    inst[ReactiveForms.namespace].acceptValueChange();
  },
  'click .ignore-changes': function (e, t) {
    e.preventDefault();
    var inst = Template.instance();
    inst[ReactiveForms.namespace].ignoreValueChange();
  }
});
```

As you can see, we have access to the following template helpers:

* `{{remoteValueChange}}`
  * This is *true* if this Element's data has changed elsewhere during the current session.
    It resets every time changes are accepted or ignored.
  * Use this to toggle the message.
* `{{newRemoteValue}}`
  * This contains the actual value of the changed data. In our example, we put it in a `name`
    attribute, but it could be used for a tooltip or anything else.

We can control how we deal with remote changes using these template instance methods:

* `acceptValueChange()`
  * A method that copies the changed data into the current form data context (and thus into
    the Elements, depending on your configuration).
* `ignoreValueChange()`
  * A method that resets `remoteValueChange` to *false*.

For more fine-grained control over how your form handles remote data changes, specify an `onDataChange` hook
via a template helper (just like *schema*, *action*, and *data*):

```javascript
Template['testForm'].helpers({
  onDataChange: function() {
    return function(oldData, newData) {
      if (!_.isEqual(oldData, newData)) {

        // Use one or more of the below methods.
        // Usually, you should only need `this.refresh()`.
        // Create an issue if you need something else here.

        // Reset the form (equivalent to `callbacks.reset()` in the action function).
        this.reset(true);

        // Refresh unchanged Elements to reflect new data.
        // Optionally: `this.refresh('dot.notation', customValue)`.
        this.refresh();

        // This sets the form's `changed` state to `true`.
        this.changed();

      }
    };
  }
});

```

This hook allows you to update your entire form during remote data changes without needing
to use `passThroughData` on individual elements.
