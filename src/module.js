




var MODULE_NAMESPACE = 'reactiveForms';





// Polyfills.
var hasProp = {}.hasOwnProperty;

var indexOf = [].indexOf || function (item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (i in this && this[i] === item)
      return i;
  }
  return -1;
};


// Custom empty classes to explicitly represent actions we would otherwise infer from
// built-in types. Used with `new` and `instanceof`.
var Stopper = function () {};


// Utility functions.
var canWarn = typeof console !== "undefined" && console.warn ? console.warn : false;

var deprecatedLogger = function (item, alternative) {
  if (canWarn) {
    return console.warn("[forms] `" + item + "` is deprecated. Use `" + alternative + "` instead. See documentation for more information.");
  }
};

var isObject = function (x) {
  return _.isObject(x) && !_.isArray(x) && !_.isFunction (x) && !_.isDate(x) && !_.isRegExp(x);
};


// Functions used to work with the internal form data.
// Supports working with dot notation, but doesn't currently support arrays.
// Will be replaced with a custom store package.
var dotNotationToObject = function (key, val) {
  var keys;
  if (!key) {
    return;
  }
  keys = key.split('.');
  return _.reduceRight(keys, function (memo, key) {
    var obj;
    obj = {};
    obj[key] = memo;
    return obj;
  }, val);
};

var dotNotationToValue = function (obj, key) {
  var keys, val;
  if (!obj || !key) {
    return;
  }
  keys = key.split('.');
  val = _.reduce(keys, function (memo, key) {
    if (_.has(memo, key)) {
      return memo[key];
    } else {
      return new Stopper();
    }
  }, obj);
  if (!(val instanceof Stopper)) {
    return val;
  }
};

var deleteByDotNotation = function (obj, key) {
  var args;
  if (!obj || !key) {
    return;
  }
  args = [obj];
  args = args.concat(key.split('.'));
  Meteor._delete.apply(this, args);
  return args[0];
};

var deepExtendObject = function (first, second) {
  var prop;
  for (prop in second) {
    if (!hasProp.call(second, prop)) continue;
    if (isObject(first[prop]) && _.has(first, prop)) {
      deepExtendObject(first[prop], second[prop]);
    } else {
      first[prop] = second[prop];
    }
  }
  return first;
};


// Add error messages here to keep things clean.
var errorMessages = {
  schema: "[forms] The `schema` field in a Form Block is optional, but if it exists, it must be an instance of SimpleSchema.",
  action: "[forms] The `action` function is missing or invalid in your Form Block. This is a required field--you can't submit your form without it.",
  data: "[forms] The `data` field in a Form Block is optional, but if it exists, it must either be an object or a falsey value.",
  change: "[forms] The `onDataChange` hook is optional, but if it exists, it must be a function.",
  options: "[forms] The `options` parameter in a Form Block is optional, but if it exists, it must be an object."
};


// Module.
ReactiveForms = (function () {





  // Forms
  // ========================================================================================
  // Simple template block helpers that provide advanced functionality.

  var forms = {};


  // Created callback (constructor)
  // ------------------------------
  // Returns a function to be passed into `onCreated` for a template.

  forms.createdFactory = function (options) {

    return function () {

      var self = this;
      var component = {};

      // A unique ID for this instance (used for named contexts, and whatever else we need).
      component.ID = _.uniqueId();

      // Store all the custom reset functions for elements.
      component.resetFunctions = [];

      // Full data (non-reactive).
      //
      // Store all validated element values at the form-level.
      // Note: we are now storing data here before validation, so this is a bit of a misnomer.
      // However, when a schema is present, the form still can't be submitted with invalid data.
      component.validatedValues = {};

      // Changed data (non-reactive).
      //
      // When initial data is present, store only changed data here (useful for updates--Issue #11).
      component.changedValues = self.data.data && {} || undefined;

      // Individual element data (reactive).
      //
      // Element values consist of the following:
      //
      // `fieldName: {
      //   original: new ReactiveVar(value), // Used to track changes against initial data.
      //   value: new ReactiveVar(value),    // The current stored value.
      //   valueDep: new Tracker.Dependency, // Used to show remotely changed data in templates.
      //   valid: new ReactiveVar(true),     // Whether the current value is valid according to schema.
      //   changed: new ReactiveVar(false),  // Whether the element has been changed by a user.
      //   storeMethods: function () { ... } // Used to pass element-level methods to form-level.
      // }`
      //
      // They will also contain any methods passed from elements using `storeMethods`.
      component.elementValues = {};

      // Initial data.
      component.initialData = self.data.data && self.data.data || void 0;

      // Reactively check options passed into the UI component.
      // This includes tracking reactive changes to data and re-validating.
      // Schema, action, data (initial data), onDataChange (custom function).
      // Log warnings if there are any issues.
      self.autorun(function () {
        var data = Template.currentData();

        var dataTest = Match.Optional(Match.Where(function (x) {
          return !x || isObject(x);
        }));

        if (_.has(data, 'schema') && !Match.test(data.schema, Match.Optional(SimpleSchema))) {
          canWarn && console.warn(errorMessages.schema);
        }
        if (!(_.has(data, 'action') && Match.test(data.action, Function))) {
          canWarn && console.warn(errorMessages.action);
        }
        if (_.has(data, 'data') && !Match.test(data.data, dataTest)) {
          canWarn && console.warn(errorMessages.data);
        }
        if (_.has(data, 'onDataChange') && !Match.test(data.onDataChange, Function)) {
          canWarn && console.warn(errorMessages.change);
        }
        if (_.has(data, 'options') && !Match.test(data.options, dataTest)) {
          canWarn && console.warn(errorMessages.options);
        }
      });

      // Options
      // -------

      component.options = _.extend({

        // Are we looking to validate only the fields that are present in the form as elements?
        // If so, custom validation that references other fields is not possible.
        ignoreMissingFields: true

      }, self.data.options || {});

      // States
      // ------
      // Set by the submit method below.

      component.changed = new ReactiveVar(false);
      component.submitted = new ReactiveVar(false);
      component.failed = new ReactiveVar(false);
      component.success = new ReactiveVar(false);
      component.invalid = new ReactiveVar(false);
      component.loading = new ReactiveVar(false);

      // State messages.
      component.successMessage = new ReactiveVar(null);
      component.failedMessage = new ReactiveVar(null);

      // Ensure certain states are mutually exclusive--set with these methods only.
      component.setExclusive = function (activeState, message) {
        var i, len, ref, state;
        ref = ['success', 'failed', 'loading', 'invalid'];
        for (i = 0, len = ref.length; i < len; i++) {
          state = ref[i];
          component[state].set(state === activeState);
        }
        if (message && component[activeState + 'Message']) {
          component[activeState + 'Message'].set(message);
        }
      };

      // Set `changed` state.
      // As `success` represents the end of a form session, a subsequent `change` should
      // initiate a new session, if the UI is still editable.
      component.setChanged = function () {
        component.changed.set(true);
        if (component.success.get() === true) {
          component.success.set(false);
          component.submitted.set(false);
        }
      };

      // Reset form and element states (called from inside `component.resetForm` below).
      component.resetStates = function (hard) {
        var field, obj;
        component.changed.set(false);
        component.submitted.set(false);
        component.invalid.set(false);
        component.loading.set(false);

        if (hard) {
          component.failed.set(false);
          component.success.set(false);

          // Reset element states (see if this works here?)
          for (field in component.elementValues) {
            obj = component.elementValues[field];
            obj.changed.set(false);
            obj.valid.set(true);
          }
        }
      };

      // Schema
      // ------

      // Set up SimpleSchema if available.
      component.schema = self.data.schema || null;

      // Use this instance's unique Id as the named context.
      component.schemaContext = component.schema ? component.schema.namedContext(component.ID) : null;

      // Enable getting a reactive count of current invalid fields.
      component.getInvalidCount = function () {
        if (component.schemaContext) {
          return component.schemaContext.invalidKeys().length;
        }
      };

      // When a user fixes the invalid fields, clear invalid state.
      self.autorun(function () {
        if (component.schemaContext) {
          !component.getInvalidCount() && component.invalid.set(false);
        }
      });

      // Validate existing form data based on options.
      // This is called at the element-level when input data is received.
      component.validate = function (field) {
        if (!component.schemaContext) return;

        // Validate only for the field in question.
        if (field && component.options.ignoreMissingFields === true) {
          component.schemaContext.validateOne(component.validatedValues, field);

        // Validate for all fields in the schema.
        // Note: required fields that are not present as form elements will stop the form
        // from being submitted unless we provided them as part of the initial data (assuming
        // they are valid there).
        } else {
          component.schemaContext && component.schemaContext.validate(component.validatedValues);
        }

      };

      // Remove an existing field from the schema validation context.
      component.removeFromValidation = function (field) {
        if (!component.schemaContext) return;

        // SimpleSchema fix to remove field from schema context (Issue #87).
        // See: https://github.com/aldeed/meteor-simple-schema/blob/master/simple-schema-context.js#L108
        var invalidKeys = component.schemaContext._invalidKeys;
        component.schemaContext._invalidKeys = _.reject(invalidKeys, function (item) {
          return item.name === field;
        });
        component.schemaContext._markKeysChanged([field]);
      };

      // Form field data
      // ---------------

      // Reactively reset all stored element values.
      component.resetElementValues = function () {
        var field, obj;
        for (field in component.elementValues) {
          obj = component.elementValues[field];
          obj.original.set(null);
          obj.value.set(null);
          obj.valueDep.changed();
        }
      };

      // Set new reactive value in `component.elementValues` or get the existing property.
      // Also provide a dependency for element templates to track.
      component.ensureElement = function (field, value) {
        return _.has(component.elementValues, field) && component.elementValues[field] || (component.elementValues[field] = {
          original: new ReactiveVar(value),
          value: new ReactiveVar(value),
          valueDep: new Tracker.Dependency,
          valid: new ReactiveVar(true),
          changed: new ReactiveVar(false),

          // Here `methods` is an object.
          storeMethods: function (methods) {
            var method, name;
            for (name in methods) {
              if (!hasProp.call(methods, name)) continue;
              method = methods[name];
              component.elementValues[field][name] = method;
            }
          }
        });
      };

      // Remove an element from the form.
      component.removeElement = function (field) {
        delete component.elementValues[field];
        deleteByDotNotation(component.changedValues, field);
        deleteByDotNotation(component.validatedValues, field);
        component.removeFromValidation(field);
      };

      // Set values to form field data.
      // Note: `field` here is a string in dot notation.
      component.setFormDataField = function (field, value, fromUserEvent) {
        var currentValue, objectWithValue, original;
        currentValue = dotNotationToValue(component.validatedValues, field);
        objectWithValue = dotNotationToObject(field, value);
        original = component.elementValues[field].original.get();

        // First, opt into setting `changed` if this is a unique update.
        if (!Match.test(currentValue, void 0)) {
          if (!_.isEqual(currentValue, value)) {

            // Set value in form data context, optionally set `component.changedValues`.
            component.validatedValues = deepExtendObject(component.validatedValues, objectWithValue);
            if (fromUserEvent) {
              component.setChanged();

              // Deal with the fact that some fields might not exist in initial data.
              if (component.changedValues) {

                // Check new value against original and adjust `component.changedValues` (Issue #56).
                // XXX: possibly run this on submit instead, or defer it.
                if (!_.isEqual(original, value)) {

                  // If the value is unique from the original, add to `component.changedValues`.
                  component.changedValues = deepExtendObject(component.changedValues, objectWithValue);
                } else {

                  // If it's the same, remove this field altogether from `component.changedValues`.
                  // This should only contain fields that are different from the originals.
                  component.changedValues = deleteByDotNotation(component.changedValues, field);
                }
              }
            }
          }

        // If the field doesn't exist in `component.validatedValues` yet, add it.
        } else {
          component.validatedValues = deepExtendObject(component.validatedValues, objectWithValue);

          // If this was a user-enacted change to the data, set `changed`.
          // Initial data and schema-provided data will not trigger `changed` (Issue #46).
          if (fromUserEvent) {
            component.setChanged();

            // If there was initial data, but this field wasn't in it, include in `changed`
            // the first time.
            if (component.changedValues && Match.test(original, void 0)) {
              component.changedValues = deepExtendObject(component.changedValues, objectWithValue);
            }
          }
        }
      };

      // Reset
      // -----
      // Clear form field data, or "form data context"; reset states; run all element-level
      // reset methods (these can be specified in `createElement`).

      component.addResetFunction = function (func) {
        component.resetFunctions.push(func);
      };

      // Reset the form.
      component.resetForm = function (hard) {

        // Always clear values in DOM and reset form/element data contexts.
        for (var i = 0, len = component.resetFunctions.length; i < len; i++) {
          component.resetFunctions[i]();
        }
        component.validatedValues = {};
        component.changedValues = self.data.data && {} || void 0;
        component.resetElementValues();

        // Reset all form states to init values.
        // For hard reset, kill the last success/failed states and element states.
        component.resetStates(hard);
        if (hard) {
          component.successMessage.set(null);
          component.failedMessage.set(null);
        }
      };

      // Initial data
      // ------------

      // Hook into underlying data changes at the form-level.
      self.autorun(function () {
        var ctx;
        var data = Template.currentData();

        // If there is data, handle it.
        if (data.data) {

          // Add `_id` to form field data if present (Issue #38)--other fields are tracked
          // reactively in their respective elements.
          if (_.has(data.data, '_id')) {
            component.validatedValues._id = data.data._id;
          }
          if (!_.isEqual(data.data, component.initialData)) {

            // Run provided `onDataChange` hook if available (Issue #55).
            if (self.data.onDataChange) {

              // Add useful methods here (create an issue if you have a request).
              ctx = {

                reset: component.resetForm,

                // Arguments are optional--`field` accepts dot notation.
                // If no arguments are passed, all fields will refresh, meaning all elements will
                // accept any updates to underlying (initial) data.
                refresh: function (field, val) {

                  // Postpone executing this until `newRemoteValue` is set in elements.
                  // This also ensures that `refresh` is behind `reset` when they're both called
                  // in the hook.
                  Tracker.afterFlush(function () {
                    if (field && _.has(component.elementValues, field)) {
                      component.elementValues[field].refresh(val);
                    } else {
                      for (field in component.elementValues) {
                        if (!hasProp.call(component.elementValues, field)) continue;
                        component.elementValues[field].refresh();
                      }
                    }
                  });
                },
                changed: function () {
                  return component.setChanged();
                }
              };

              // Call hook bound to context, passing in old and new data for comparison.
              self.data.onDataChange.call(ctx, component.initialData, data.data);
            }

            // Set `component.initialData` to new value (so it's "old" the next time around).
            component.initialData = data.data;
          }
        }
      });

      // Selectors
      // ---------
      // Track any custom `validationSelector` from elements.
      //
      // XXX: this may return unintended matches if a custom selector from one element is present in
      // another but not used for a form field.

      component.elementSelectors = ['.reactive-element'];

      component.addCustomSelector = function (selector) {
        if (indexOf.call(component.elementSelectors, selector) < 0) {
          component.elementSelectors.push(selector);
        }
      };

      // Submit
      // ------

      // Validate data and run provided action function
      component.submit = function () {
        var callbacks, formElements;
        component.submitted.set(true);

        // Check the schema if we're using SimpleSchema
        // If any values are bad, return without running the action function.
        if (component.schemaContext) {
          if (!!component.schemaContext.invalidKeys().length) {
            component.setExclusive('invalid');
            return;
          }
        }

        // Invoke loading state until action function returns failed or success.
        component.setExclusive('loading');

        // Form action
        // -----------
        // Send form elements and callbacks to action function.
        //
        // The action function is bound to component.validatedValues.
        var formElements = self.findAll(component.elementSelectors.join(', '));
        var callbacks = {
          success: function (message) {
            return component.setExclusive('success', message);
          },
          failed: function (message) {
            return component.setExclusive('failed', message);
          },
          reset: function (hard) {
            return component.resetForm(hard);
          }
        };
        return self.data.action.call(component.validatedValues, formElements, callbacks, component.changedValues);
      };

      // Add component to custom namespace (Issue #21)
      self[MODULE_NAMESPACE] = component;

      // Custom callback (Issue #20)
      // Call custom `created` function (could deprecate this because it's not necessary really).
      options.created && options.created.call(self);
    };

  };


  // Template helpers
  // ----------------
  // Provide helpers for any form template, along with helpers that allow us to reference
  // the form template's instance data from within UI.contentBlock (where the elements live).

  forms.helpers = {

    // This gets passed down to elements (Issue #15).
    //
    // XXX: `context` is a poor namespace.
    //
    // Elements must receive the form component in order to connect with it.
    // (In the future, this might pass down a form class instance.)
    // ---------------------------------------------------------------------

    context: function () {
      var inst = Template.instance();
      return inst[MODULE_NAMESPACE];
    },

    // Form field value.
    // -----------------

    field: function (field) {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if (component.elementValues[field]) {
        return component.elementValues[field].value.get();
      }
    },

    // Form states.
    // ------------

    failed: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.failed.get();
    },

    failedMessage: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.failedMessage.get();
    },

    success: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.success.get();
    },

    successMessage: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.successMessage.get();
    },

    invalid: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.invalid.get();
    },

    loading: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.loading.get();
    },

    changed: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.changed.get();
    },

    unchanged: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return !component.changed.get();
    },

    submitted: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.submitted.get();
    },

    unsubmitted: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return !component.submitted.get();
    },

    // Schema functionality.
    // ---------------------

    invalidCount: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.getInvalidCount();
    }
  };





  // Elements
  // ========================================================================================
  // Reactive form elements that can work either standalone or within a form block.

  elements = {}


  // Created callback (constructor)
  // ------------------------------
  // Sets up its own schema and local schema context if passed (expects SimpleSchema instances)
  // Otherwise, it looks for a direct parent schema (from a form block helper) and expects
  // a passed-in context so that invalidations can be stored on the form.

  elements.createdFactory = function (options) {

    return function () {

      var self = this;

      // Config
      // ------

      var component = {

        // A field to connect this element with in the schema.
        field: self.data.field || null,

        // Initial value from passed-in data in the parent form block.
        initValue: null,

        // Allow for remote data changes to pass through silently.
        passThroughData: self.data.passThroughData || options.passThroughData || false,

        // Element contributes to parent form block's data context.
        providesData: !self.data.standalone && options.providesData,

        // Context passed from parent form block, if exists.
        parentData: null,

        // Element is inside a form block.
        isChild: false,

        // Parent contexts to traverse until form block context.
        distance: 0
      };

      // Integrate with parent form block.
      component.integrateWithFormBlock = function (dataAtDistance) {

        // Move any top-level keys outside of `context` into `context`.
        for (var key in dataAtDistance) {
          if (key !== 'context') {
            dataAtDistance.context[key] = dataAtDistance[key];
          }
        }

        // Add `context` key as `parentData`.
        component.parentData = dataAtDistance.context;

        // Localize parent states and schema (specific items appropriate for use in elements).
        var states = ['submit', 'submitted', 'loading', 'success', 'schema', 'schemaContext'];

        for (var i = 0, len = states.length; i < len; i++) {
          component[states[i]] = component.parentData[states[i]] || null;
        }
      };

      // Integrate with parent form element.
      component.integrateWithFormElement = function (dataAtDistance) {
        component.field = dataAtDistance.field;
      };

      // Try setting up with a parent element/form block.
      component.establishParentContext = function () {

        // Traverse parent contexts to determine if it's a child element or sub-element.
        while (component.distance < 6 && !component.isChild) {

          // Start at 1.
          component.distance++;

          // Parent data from current distance.
          var dataAtDistance = Template.parentData(component.distance);

          // Child element in this context?
          // In the Blaze implementation, we tell by checking for `data.context`.
          if (dataAtDistance && _.has(dataAtDistance, 'context')) {
            component.isChild = true;
            component.integrateWithFormBlock(dataAtDistance);

          // Sub-element in this context? Take parent's field.
          } else if (dataAtDistance && _.has(dataAtDistance, 'field')) {
            component.integrateWithFormElement(dataAtDistance);
          }
        }
      };

      // Establish parent context unless explicitly standalone.
      if (!self.data.standalone)
        component.establishParentContext();

      // Basic setup
      // -----------

      // Ok, now we know if it's actually a child.
      // Configure schema and get initial value if available, supporting dot notation.

      // Case #1: This element is inside a form block.
      if (component.isChild) {

        // If this element has a custom selector, register that with the form block.
        // This is for the `els` argument in the action function.
        if (component.providesData && options.validationSelector !== '.reactive-element')
          component.parentData.addCustomSelector(options.validationSelector);

        // Reference form block schema and schema context locally.
        component.schema = component.parentData.schema;
        component.schemaContext = component.parentData.schemaContext;

        // Get the initial value for this field from the form block.
        if (component.parentData.data)
          component.initValue = dotNotationToValue(component.parentData.data, component.field);

      // Case #2: This element is not inside a form block--it runs standalone.
      } else {

        // Create a new local schema context if a schema was provided directly to this element.
        component.schema = self.data.schema || null;
        component.schemaContext = self.data.schema && self.data.schema.newContext() || null;

        // Get the initial value for this field from the element template itself.
        if (self.data.data)
          component.initValue = dotNotationToValue(self.data.data, component.field);
      }

      // Ensured setup
      // -------------
      // Set up localized properties, integrating with parent form context if available.

      var ensured = false;

      // Get reactive value and deps from form block if available.
      if (component.field && component.parentData && _.isFunction(component.parentData.ensureElement))
        ensured = component.parentData.ensureElement(component.field, component.initValue);

      // Get `original` used to support comparing values against the original (Issue #56).
      component.original = ensured && ensured.original || new ReactiveVar(component.initValue);
      component.value = ensured && ensured.value || new ReactiveVar(component.initValue);
      component.valueDep = ensured && ensured.valueDep || new Tracker.Dependency;
      component.valid = ensured && ensured.valid || new ReactiveVar(true);
      component.changed = ensured && ensured.changed || new ReactiveVar(false);

      // Validation
      // ----------

      // Validate the current value for this field.
      //
      // If this element is inside a form block, use the form block's `validate` method.
      //
      // Otherwise, use `validateOne` and compile an object to test against.
      component.validate = function (val) {

        // We are inside a form block--call form block's `validate` method to validate this
        // field in the larger form data context.
        if (component.parentData && component.parentData.validate)
          return component.parentData.validate(component.field);

        // We are not inside a form block--compile an object with just this field/value to
        // test.
        var object = dotNotationToObject(component.field, val);

        // Get true/false for validation (validating against this field only).
        //
        // This should propagate the results to the general schema context and not require
        // using the return value (see the reactive computation below).
        component.schemaContext.validateOne(object, component.field);
      };

      // Couple the schema's reactive validation with the element's own `valid` state.
      (component.schemaContext != null) && self.autorun(function () {

        // Check this field's reactive validity in the schema--if we move to using our own
        // internal validation context, we won't need to rely on SimpleSchema for this.
        var invalid = component.schemaContext.keyIsInvalid(component.field);

        component.valid.set(!invalid);
      });

      // Value
      // -----

      // Save a value and then validate it.
      component.setValue = function (value, fromUserEvent) {

        // Initial value from passed-in data will get validated on render.
        // That shouldn't count as `changed`.
        // This fixes that, (with `fromUserEvent`) along with adding a general idempotency.
        if (!_.isEqual(component.value.get(), value)) {
          component.value.set(value);
          fromUserEvent && component.changed.set(true);
        }

        // Save to a parent form block also, if possible, and validate there (Issue #84).
        if (component.isChild && (component.parentData.setFormDataField != null))
          component.parentData.setFormDataField(component.field, value, fromUserEvent);

        // Validate the new value.
        component.validate(value);
      };

      // Support remote changes (Issue #40)
      // ----------------------------------
      // With this package, there are three ways to handle remote changes to initial data
      // during a form session.
      // 1. Ignore the change and let the user submit their new form.
      // 2. Patch in the changes mid-session without any type of notification.
      // 3. Notify the user of remote changes and give them the opportunity to patch those
      // into the current session (giving them time to save their work elsewhere).

      // Track whether the remote value has changed (use this to show a message in the UI).
      component.remoteValueChange = new ReactiveVar(false);

      // Store remote data changes without replacing the local value.
      component.newRemoteValue = new ReactiveVar(component.initValue);

      // Import and validate remote changes into current form context.
      // Optionally, pass a custom value to accept as a remote change.
      component.refresh = function (val) {
        if (Match.test(val, void 0))
          val = component.newRemoteValue.get();

        // Set the new value if the user has no unique changes for this field.
        if (Match.test(component.value.get(), void 0) || !component.changed.get())
          component.setValue(val);

        component.original.set(val); // Use new value as original.
        component.valueDep.changed(); // Recompute template helpers to show new value.
      };

      // Ignore the presence of remote changes to the current form's data.
      component.ignoreValueChange = function () {
        return component.remoteValueChange.set(false);
      };

      // Accept remote changes to the current form's data.
      component.acceptValueChange = function () {
        component.remoteValueChange.set(false);
        return component.refresh();
      };

      // Track remote data changes reactively.
      self.autorun(function () {
        var data = component.isChild && Template.parentData(component.distance) || Template.currentData();

        if ((data != null ? data.data : void 0) != null) {
          var fieldValue = dotNotationToValue(data.data, component.field);

          // Update reactiveValue without tracking it.
          return Tracker.nonreactive(function () {

            // If the remote value is different from what's in initial data, set `newRemoteValue`.
            // Otherwise, leave it--the user's edits are still just as valid.
            if (!_.isEqual(component.value.get(), fieldValue)) {
              component.newRemoteValue.set(fieldValue);

              // Allow for remote data changes to pass through without user action.
              // This is important for the experience of some components.
              if (component.passThroughData) {
                component.refresh();
              } else {
                component.remoteValueChange.set(true);
              }
            }
          });
        }
      });

      // Store methods
      // -------------

      // Send a few methods to form-level context, if possible (Issue #55).
      if (ensured && _.has(ensured, 'storeMethods')) {
        ensured.storeMethods({
          refresh: component.refresh
        });
      }

      // Callback for `validationEvent` trigger
      // --------------------------------------

      // Get value to test from `.reactive-element` (user-provided, optionally).
      component.getValidationValue = options.validationValue || function (el, clean, template) {
        var value;
        value = $(el).val();
        return clean(value);
      };

      // Wrap the SimpleSchema `clean` function to add the key automatically.
      component.cleanValue = function (val, options) {
        var cln, obj;
        obj = {};
        obj[component.field] = val;
        cln = component.schema.clean(obj, options);
        return cln[component.field];
      };

      component.validateElement = function (el, fromUserEvent) {
        var ctx;

        // Can't pass in `clean` method if user isn't using SimpleSchema.
        var cleanValue = (component.schemaContext != null) && component.cleanValue || function (arg) {
          return arg;
        };

        // Create a useful context to bind `component.getValidationValue` to.
        var ctx = {
          stop: new Stopper(),
          startup: !fromUserEvent,
          validate: function (val) {
            component.setValue(val, fromUserEvent);
            return this.stop; // Prevents automatic validator from running (see below).
          }
        };

        // Call `component.getValidationValue` bound to a context with `validate` method (Issue #36).
        var val = component.getValidationValue.call(ctx, el, cleanValue, self);

        // You can return `this.stop` if you're running manual validation.
        // Returning the result of `this.validate(val)` does this automatically, too.
        if (!(val instanceof Stopper)) {
          component.setValue(val, fromUserEvent);
        }
      };

      // Add component to custom namespace (Issue #21).
      self[MODULE_NAMESPACE] = component;

      // Custom callback (Issue #20)
      // Call custom `created` function (could deprecate this because it's not necessary really).
      options.created && options.created.call(self);
    };
  };


  // Rendered callback
  // -----------------
  // Does initial validation.

  elements.renderedFactory = function (options) {

    return function () {

      var self = this;

      // Only run initial validation if this element provides data (Issue #42).
      var component = self[MODULE_NAMESPACE];

      // Find matching element(s) using the proper selector.
      var el = self.findAll(options.validationSelector);

      // Validate any initial data if this element provides data to the form data context.
      if (component.providesData)
        el && component.validateElement(el, false);

      // Send reset function to form block so it's called with proper context and element(s).
      if (options.reset && component.parentData && _.isFunction(component.parentData.addResetFunction)) {
        component.parentData.addResetFunction(function () {
          options.reset.call(self, el);
        });
      }

      // Custom callback (Issue #20)
      // Call custom `rendered` function (could deprecate this because it's not necessary really).
      options.rendered && options.rendered.call(self);
    };
  };


  // Destroyed callback
  // -----------------
  // Removes destroyed elements from the form data context.

  elements.destroyedFactory = function (options) {

    return function () {

      var self = this;

      var component = self[MODULE_NAMESPACE];

      // Remove this element from the form data context.
      if (component.providesData && component.parentData && _.isFunction(component.parentData.removeElement)) {
        component.parentData.removeElement(component.field);
      }

      // Custom callback (Issue #20)
      // Call custom `destroyed` function (could deprecate this because it's not necessary really).
      options.destroyed && options.destroyed.call(self);
    };
  };


  // Template helpers
  // ----------------
  // Brings SimpleSchema functionality and other useful helpers into the template.

  elements.helpers = {

    // Value and remote changes.
    // -------------------------

    // Used for most cases.
    value: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      component.valueDep.depend(); // Reruns only when remote changes have been imported.
      return Tracker.nonreactive(function () {
        return component.value.get();
      });
    },

    // Updates reactively with each value change (use for UI state).
    reactiveValue: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.value.get();
    },

    // Use to show the original value of initial data for this field.
    originalValue: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.original.get();
    },

    // Has the value changed from the original (initial) value?
    uniqueValue: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return !_.isEqual(component.original.get(), component.value.get());
    },

    // Stores any underlying changes in the data, if reactive.
    newRemoteValue: function () {
      var component, inst, value;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      value = component.newRemoteValue.get();
      return (value != null) && value.toString();
    },

    // Has there been any underlying change during this form session?
    remoteValueChange: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.remoteValueChange.get();
    },

    // States (element).
    // -----------------

    // Use to show positive state on element, like a check mark.
    valid: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.valid.get();
    },

    // Use to show or hide things after first valid value change.
    changed: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.changed.get();
    },

    // Use to show or hide things after first valid value change.
    unchanged: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return !component.changed.get();
    },

    // Use to show or hide things regardless of parent state.
    isChild: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.isChild;
    },

    // States (form block).
    // --------------------
    // Default to `false` if no form block exists.

    // Use to delay showing errors until first submit.
    submitted: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if (component.isChild) {
        return component.submitted.get();
      } else {
        return inst.data.submitted || false; // Original passed-in value (allows overwrites).
      }
    },

    unsubmitted: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if (component.isChild) {
        return !component.submitted.get();
      } else {
        return inst.data.unsubmitted || false;
      }
    },

    // Use to disable elements while submit action is running.
    loading: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if (component.isChild) {
        return component.loading.get();
      } else {
        return inst.data.loading || false;
      }
    },

    // Use to hide things after a successful submission.
    success: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if (component.isChild) {
        return component.success.get();
      } else {
        return inst.data.success || false;
      }
    },

    // Schema functionality.
    // ---------------------

    // Use to get allowedValues, max, etc. for this field (Issue #8).
    schema: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if ((component.schema != null) && (component.field != null)) {
        return component.schema._schema[component.field];
      }
    },

    label: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if ((component.schema != null) && (component.field != null)) {
        return component.schema.label(component.field);
      }
    },

    instructions: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if ((component.schema != null) && (component.field != null)) {
        return component.schema.keyInstructions(component.field);
      }
    },

    errorMessage: function () {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if ((component.schemaContext != null) && (component.field != null)) {
        return component.schemaContext.keyErrorMessage(component.field);
      }
    }
  };





  // Interface
  // ========================================================================================


  // Create a new reactive form element
  // ----------------------------------
  // Accepts any compatible ReactiveForm element template, and a choice of validation events.

  var createElement = function (obj) {

    check(obj, Match.ObjectIncluding({
      template: String,
      validationEvent: Match.Optional(Match.OneOf(String, [String])),
      validationValue: Match.Optional(Function),
      validationSelector: Match.Optional(String),
      reset: Match.Optional(Function),
      passThroughData: Match.Optional(Boolean),

      // Allow normal callbacks for adding custom data, etc. (Issue #20).
      created: Match.Optional(Function),
      rendered: Match.Optional(Function),
      destroyed: Match.Optional(Function)
    }));

    var template = Template[obj.template];

    if (template) {
      var options = {
        // Use this to reduce demands from non-input (nested) elements (Issue #42).
        providesData: false
      };
      var evt = {};
      var keys = ['validationValue', 'validationSelector', 'reset', 'passThroughData', 'created', 'rendered', 'destroyed'];

      for (var i = 0, len = keys.length; i < len; i++) {
        if (_.has(obj, keys[i])) {
          options[keys[i]] = obj[keys[i]];
        }
      }

      if (_.has(obj, 'validationEvent')) { // (Issue #33).

        // Compile selector in `options`. Allow array for `validationEvent` (Issue #52).
        // -----------------------------------------------------------------------------

        // Use default selector `.reactive-element` if custom selector isn't available.
        options.validationSelector = options.validationSelector || '.reactive-element';

        // Map all events to selector and return a single string.
        var selectorWithEvents = Match.test(obj.validationEvent, String) && (obj.validationEvent + " " + options.validationSelector) || _.map(obj.validationEvent, function (e) {
          return e + " " + options.validationSelector;
        }).join(', ');

        // Create event handler to pass value through validation.
        evt[selectorWithEvents] = function (e, t) {

          // Flag `fromUserEvent` as true.
          t[MODULE_NAMESPACE].validateElement(e.currentTarget, true);
        };

        // It has `validationEvent`, so assume it tracks events and inputs data.
        options.providesData = true;

      }
      template.created = elements.createdFactory(options);
      template.rendered = elements.renderedFactory(options);
      template.destroyed = elements.destroyedFactory(options);

      options.destroyed && (template.destroyed = options.destroyed);

      template.helpers(elements.helpers);
      template.events(evt);
    }
  };


  // Create a new form block
  // -----------------------
  // Accepts any compatible ReactiveForm form template, and a choice of submit types.

  var createFormBlock = function (obj) {

    check(obj, Match.ObjectIncluding({
      template: String,
      submitType: String,

      // Same as on elements... (Issue #20).
      created: Match.Optional(Function),
      rendered: Match.Optional(Function),
      destroyed: Match.Optional(Function)
    }));

    var template = Template[obj.template];

    if (template) {
      var options = {};
      var evt = {};
      var keys = ['created', 'rendered', 'destroyed'];

      for (var i = 0, len = keys.length; i < len; i++) {
        if (_.has(obj, keys[i])) {
          options[keys[i]] = obj[keys[i]];
        }
      }

      if (obj.submitType === 'normal') {

        evt['submit form'] = function (e, t) {
          e.preventDefault();
          e.stopPropagation(); // Allow nested form blocks.
          t[MODULE_NAMESPACE].submit();
        };

      } else if (obj.submitType === 'enterKey') {

        evt['submit form'] = function (e, t) {
          e.preventDefault();
          e.stopPropagation();
        };

        evt['keypress form'] = function (e, t) {
          if (e.which === 13) {
            e.preventDefault();
            e.stopPropagation();
            t[MODULE_NAMESPACE].submit();
          }
        };

      }

      template.created = forms.createdFactory(options);

      options.rendered && (template.rendered = options.rendered);
      options.destroyed && (template.destroyed = options.destroyed);

      template.helpers(forms.helpers);
      template.events(evt);
    }
  };

  var createForm = function (obj) {
    deprecatedLogger('createForm', 'createFormBlock');
    createFormBlock(obj);
  };





  // Return Interface
  // ========================================================================================

  return {
    createFormBlock: createFormBlock,
    createForm: createForm,
    createElement: createElement,
    namespace: MODULE_NAMESPACE
  };

}());



