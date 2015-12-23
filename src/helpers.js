Template.registerHelper('formContext', function () {

  // XXX This should have a more unique check for `templates:forms` like a more unique
  // namespace than `context`.
  var context = this.context;

  return {

    // Provide reactive helpers for dealing with form state directly.
    // --------------------------------------------------------------

    field: function (field) {
      if (context.elementValues[field])
        return context.elementValues[field].value.get();
    },
    failed: function () {
      if (context && context.failed && context.failed.get)
        return context.failed.get();
    },
    failedMessage: function (argument) {
      if (context && context.failedMessage && context.failedMessage.get)
        return context.failedMessage.get();
    },
    success: function () {
      if (context && context.success && context.success.get)
        return context.success.get();
    },
    successMessage: function (argument) {
      if (context && context.successMessage && context.successMessage.get)
        return context.successMessage.get();
    },
    invalidCount: function () {
      if (context && context.getInvalidCount)
        return context.getInvalidCount();
    },
    invalid: function () {
      if (context && context.invalid && context.invalid.get)
        return context.invalid.get();
    },
    loading: function () {
      if (context && context.loading && context.loading.get)
        return context.loading.get();
    },
    changed: function () {
      if (context && context.changed && context.changed.get)
        return context.changed.get();
    },
    unchanged: function () {
      if (context && context.changed && context.changed.get)
        return !context.changed.get();
    },
    submitted: function () {
      if (context && context.submitted && context.submitted.get)
        return context.submitted.get();
    },
    unsubmitted: function () {
      if (context && context.submitted && context.submitted.get)
        return !context.submitted.get();
    }
  };
});