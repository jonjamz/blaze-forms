// This seems to be fully split out so far, but I'll leave it here for reference until finished.

var ReactiveForms,
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

this.ReactiveForms = ReactiveForms = (function() {
  var MODULE_NAMESPACE, Stopper, canWarn, createElement, createForm, createFormBlock, deepExtendObject, deleteByDotNotation, deprecatedLogger, dotNotationToObject, dotNotationToValue, elements, forms, isObject;
  MODULE_NAMESPACE = 'reactiveForms';
  canWarn = (typeof console !== "undefined" && console !== null ? console.warn : void 0) != null;
  Stopper = function() {};
  deprecatedLogger = function(item, alternative) {
    if (canWarn) {
      return console.warn("[forms] `" + item + "` is deprecated. Use `" + alternative + "` instead. See documentation for more information.");
    }
  };
  isObject = function(x) {
    return _.isObject(x) && !_.isArray(x) && !_.isFunction(x) && !_.isDate(x) && !_.isRegExp(x);
  };
  dotNotationToObject = function(key, val) {
    var keys;
    if (!key) {
      return;
    }
    keys = key.split('.');
    return _.reduceRight(keys, function(memo, key) {
      var obj;
      obj = {};
      obj[key] = memo;
      return obj;
    }, val);
  };
  dotNotationToValue = function(obj, key) {
    var keys, val;
    if (!obj || !key) {
      return;
    }
    keys = key.split('.');
    val = _.reduce(keys, function(memo, key) {
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
  deleteByDotNotation = function(obj, key) {
    var args;
    if (!obj || !key) {
      return;
    }
    args = [obj];
    args = args.concat(key.split('.'));
    Meteor._delete.apply(this, args);
    return args[0];
  };
  deepExtendObject = function(first, second) {
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
  forms = {};
  forms.createdFactory = function(options) {
    return function() {
      var changedValues, component, elementSelectors, elementValues, errorMessages, ext, initialData, resetElementValues, resetForm, resetFunctions, resetStates, self, setChanged, setExclusive, validatedValues;
      self = this;
      component = {};
      errorMessages = {
        schema: "[forms] The `schema` field in a Form Block is optional, but if it exists, it must be an instance of SimpleSchema.",
        action: "[forms] The `action` function is missing or invalid in your Form Block. This is a required field--you can't submit your form without it.",
        data: "[forms] The `data` field in a Form Block is optional, but if it exists, it must either be an object or a falsey value.",
        change: "[forms] The `onDataChange` hook is optional, but if it exists, it must be a function."
      };
      self.autorun(function() {
        var data, dataTest;
        data = Template.currentData();
        if (_.has(data, 'schema') && !Match.test(data.schema, Match.Optional(SimpleSchema))) {
          canWarn && console.warn(errorMessages.schema);
        }
        if (!(_.has(data, 'action') && Match.test(data.action, Function))) {
          canWarn && console.warn(errorMessages.action);
        }
        dataTest = Match.Optional(Match.Where(function(x) {
          return !x || isObject(x);
        }));
        if (_.has(data, 'data') && !Match.test(data.data, dataTest)) {
          canWarn && console.warn(errorMessages.data);
        }
        if (_.has(data, 'onDataChange') && !Match.test(data.onDataChange, Function)) {
          return canWarn && console.warn(errorMessages.change);
        }
      });
      component.changed = new ReactiveVar(false);
      component.submitted = new ReactiveVar(false);
      component.failed = new ReactiveVar(false);
      component.success = new ReactiveVar(false);
      component.invalid = new ReactiveVar(false);
      component.loading = new ReactiveVar(false);
      component.successMessage = new ReactiveVar(null);
      component.failedMessage = new ReactiveVar(null);
      setExclusive = function(activeState, message) {
        var i, len, ref, state;
        ref = ['success', 'failed', 'loading', 'invalid'];
        for (i = 0, len = ref.length; i < len; i++) {
          state = ref[i];
          component[state].set(state === activeState);
        }
        if (message && component[activeState + 'Message']) {
          return component[activeState + 'Message'].set(message);
        }
      };
      setChanged = function() {
        component.changed.set(true);
        if (component.success.get() === true) {
          component.success.set(false);
          return component.submitted.set(false);
        }
      };
      resetStates = function(hard) {
        var field, obj, results;
        component.changed.set(false);
        component.submitted.set(false);
        component.invalid.set(false);
        component.loading.set(false);
        if (hard) {
          component.failed.set(false);
          component.success.set(false);
          results = [];
          for (field in elementValues) {
            obj = elementValues[field];
            obj.changed.set(false);
            results.push(obj.valid.set(true));
          }
          return results;
        }
      };
      if (self.data.schema && self.data.schema.newContext) {
        component.schemaContext = self.data.schema.newContext();
      }
      self.autorun(function() {
        if (_.has(component, 'schemaContext')) {
          return !component.schemaContext.invalidKeys().length && component.invalid.set(false);
        }
      });
      validatedValues = {};
      changedValues = self.data.data && {} || void 0;
      elementValues = {};
      resetElementValues = function() {
        var field, obj, results;
        results = [];
        for (field in elementValues) {
          obj = elementValues[field];
          obj.original.set(null);
          obj.value.set(null);
          results.push(obj.valueDep.changed());
        }
        return results;
      };
      component.ensureElement = function(field, value) {
        return _.has(elementValues, field) && elementValues[field] || (elementValues[field] = {
          original: new ReactiveVar(value),
          value: new ReactiveVar(value),
          valueDep: new Tracker.Dependency,
          valid: new ReactiveVar(true),
          changed: new ReactiveVar(false),
          storeMethods: function(methods) {
            var method, name, results;
            results = [];
            for (name in methods) {
              if (!hasProp.call(methods, name)) continue;
              method = methods[name];
              results.push(elementValues[field][name] = method);
            }
            return results;
          }
        });
      };
      component.setValidatedValue = function(field, value, fromUserEvent) {
        var currentValue, objectWithValue, original;
        currentValue = dotNotationToValue(validatedValues, field);
        objectWithValue = dotNotationToObject(field, value);
        original = elementValues[field].original.get();
        if (!Match.test(currentValue, void 0)) {
          if (!_.isEqual(currentValue, value)) {
            validatedValues = deepExtendObject(validatedValues, objectWithValue);
            if (fromUserEvent) {
              setChanged();
              if (changedValues) {
                if (!_.isEqual(original, value)) {
                  return changedValues = deepExtendObject(changedValues, objectWithValue);
                } else {
                  return changedValues = deleteByDotNotation(changedValues, field);
                }
              }
            }
          }
        } else {
          validatedValues = deepExtendObject(validatedValues, objectWithValue);
          if (fromUserEvent) {
            setChanged();
            if (changedValues && Match.test(original, void 0)) {
              return changedValues = deepExtendObject(changedValues, objectWithValue);
            }
          }
        }
      };
      resetFunctions = [];
      component.addResetFunction = function(func) {
        return resetFunctions.push(func);
      };
      resetForm = function(hard) {
        var func, i, len;
        for (i = 0, len = resetFunctions.length; i < len; i++) {
          func = resetFunctions[i];
          func();
        }
        validatedValues = {};
        changedValues = self.data.data && {} || void 0;
        resetElementValues();
        resetStates(hard);
        if (hard) {
          component.successMessage.set(null);
          return component.failedMessage.set(null);
        }
      };
      initialData = self.data.data && self.data.data || void 0;
      self.autorun(function() {
        var ctx, data;
        data = Template.currentData();
        if (data.data) {
          if (_.has(data.data, '_id')) {
            validatedValues._id = data.data._id;
          }
          if (!_.isEqual(data.data, initialData)) {
            if (self.data.onDataChange) {
              ctx = {
                reset: resetForm,
                refresh: function(field, val) {
                  return Tracker.afterFlush(function() {
                    var methods, results;
                    if (field && _.has(elementValues, field)) {
                      return elementValues[field].refresh(val);
                    } else {
                      results = [];
                      for (field in elementValues) {
                        if (!hasProp.call(elementValues, field)) continue;
                        methods = elementValues[field];
                        results.push(methods.refresh());
                      }
                      return results;
                    }
                  });
                },
                changed: function() {
                  return setChanged();
                }
              };
              self.data.onDataChange.call(ctx, initialData, data.data);
            }
            return initialData = data.data;
          }
        }
      });
      elementSelectors = ['.reactive-element'];
      component.addCustomSelector = function(selector) {
        if (indexOf.call(elementSelectors, selector) < 0) {
          return elementSelectors.push(selector);
        }
      };
      component.submit = function() {
        var callbacks, formElements;
        component.submitted.set(true);
        if (_.has(component, 'schemaContext')) {
          if (!!component.schemaContext.invalidKeys().length) {
            setExclusive('invalid');
            return;
          }
        }
        setExclusive('loading');
        formElements = self.findAll(elementSelectors.join(', '));
        callbacks = {
          success: function(message) {
            return setExclusive('success', message);
          },
          failed: function(message) {
            return setExclusive('failed', message);
          },
          reset: function(hard) {
            return resetForm(hard);
          }
        };
        return self.data.action.call(validatedValues, formElements, callbacks, changedValues);
      };
      ext = {};
      ext[MODULE_NAMESPACE] = component;
      _.extend(self, ext);
      return options.created && options.created.call(self);
    };
  };
  forms.helpers = {
    context: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return {
        schema: _.has(inst.data, 'schema') && inst.data.schema || null,
        schemaContext: _.has(component, 'schemaContext') && component.schemaContext || null,
        submit: component.submit,
        submitted: component.submitted,
        loading: component.loading,
        success: component.success,
        failed: component.failed,
        invalid: component.invalid,
        changed: component.changed,
        ensureElement: component.ensureElement,
        setValidatedValue: component.setValidatedValue,
        addResetFunction: component.addResetFunction,
        addCustomSelector: component.addCustomSelector
      };
    },
    failed: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.failed.get();
    },
    failedMessage: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.failedMessage.get();
    },
    success: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.success.get();
    },
    successMessage: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.successMessage.get();
    },
    invalidCount: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if (_.has(component, 'schemaContext')) {
        return component.schemaContext.invalidKeys().length;
      }
    },
    invalid: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.invalid.get();
    },
    loading: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.loading.get();
    },
    changed: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.changed.get();
    },
    unchanged: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return !component.changed.get();
    },
    submitted: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.submitted.get();
    },
    unsubmitted: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return !component.submitted.get();
    }
  };
  elements = {};
  elements.createdFactory = function(options) {
    return function() {
      var cleanValue, component, data, ensured, ext, getValidationValue, i, key, len, ref, ref1, self, setValue, val, validateValue;
      self = this;
      component = {
        field: self.data.field || null,
        initValue: null,
        passThroughData: self.data.passThroughData || options.passThroughData || false,
        providesData: !self.data.standalone && options.providesData,
        parentData: null,
        isChild: false,
        distance: 0
      };
      if (!self.data.standalone) {
        while (component.distance < 6 && !component.isChild) {
          component.distance++;
          data = Template.parentData(component.distance);
          if (data && _.has(data, 'context')) {
            component.isChild = true;
            for (key in data) {
              val = data[key];
              if (key !== 'context') {
                data.context[key] = val;
              }
            }
            component.parentData = data.context;
            ref = ['submit', 'submitted', 'loading', 'success', 'schema', 'schemaContext'];
            for (i = 0, len = ref.length; i < len; i++) {
              key = ref[i];
              component[key] = component.parentData[key] || null;
            }
          } else if (data && _.has(data, 'field')) {
            component.field = data.field;
          }
        }
      }
      if (component.isChild) {
        if (component.providesData && options.validationSelector !== '.reactive-element') {
          component.parentData.addCustomSelector(options.validationSelector);
        }
        component.schema = component.parentData.schema;
        component.schemaContext = component.parentData.schemaContext;
        if (component.parentData.data) {
          component.initValue = dotNotationToValue(component.parentData.data, component.field);
        }
      } else {
        component.schema = self.data.schema || null;
        component.schemaContext = self.data.schema && self.data.schema.newContext() || null;
        if (self.data.data) {
          component.initValue = dotNotationToValue(self.data.data, component.field);
        }
      }
      ensured = component.field && ((ref1 = component.parentData) != null ? typeof ref1.ensureElement === "function" ? ref1.ensureElement(component.field, component.initValue) : void 0 : void 0);
      component.original = ensured && ensured.original || new ReactiveVar(component.initValue);
      component.value = ensured && ensured.value || new ReactiveVar(component.initValue);
      component.valueDep = ensured && ensured.valueDep || new Tracker.Dependency;
      component.valid = ensured && ensured.valid || new ReactiveVar(true);
      component.changed = ensured && ensured.changed || new ReactiveVar(false);
      validateValue = function(val) {
        var isValid, object;
        object = dotNotationToObject(component.field, val);
        isValid = component.schemaContext.validateOne(object, component.field);
        component.valid.set(isValid);
        return isValid;
      };
      (component.schemaContext != null) && self.autorun(function() {
        var invalid;
        invalid = component.schemaContext.keyIsInvalid(component.field);
        return component.valid.set(!invalid);
      });
      setValue = function(value, fromUserEvent) {
        if (!_.isEqual(component.value.get(), value)) {
          component.value.set(value);
          fromUserEvent && component.changed.set(true);
        }
        if (component.isChild && (component.parentData.setValidatedValue != null)) {
          return component.parentData.setValidatedValue(component.field, value, fromUserEvent);
        }
      };
      component.providesData && (component.schemaContext != null) && self.autorun(function() {
        val = component.value.get();
        return Tracker.nonreactive(function() {
          var isValid;
          return isValid = validateValue(val);
        });
      });
      component.remoteValueChange = new ReactiveVar(false);
      component.newRemoteValue = new ReactiveVar(component.initValue);
      component.refresh = function(val) {
        if (Match.test(val, void 0)) {
          val = component.newRemoteValue.get();
        }
        if (Match.test(component.value.get(), void 0) || !component.changed.get()) {
          setValue(val);
        }
        component.original.set(val);
        return component.valueDep.changed();
      };
      component.ignoreValueChange = function() {
        return component.remoteValueChange.set(false);
      };
      component.acceptValueChange = function() {
        component.remoteValueChange.set(false);
        return component.refresh();
      };
      self.autorun(function() {
        var fieldValue;
        data = component.isChild && Template.parentData(component.distance) || Template.currentData();
        if ((data != null ? data.data : void 0) != null) {
          fieldValue = dotNotationToValue(data.data, component.field);
          return Tracker.nonreactive(function() {
            if (!_.isEqual(component.value.get(), fieldValue)) {
              component.newRemoteValue.set(fieldValue);
              if (component.passThroughData) {
                return component.refresh();
              } else {
                return component.remoteValueChange.set(true);
              }
            }
          });
        }
      });
      if (ensured && _.has(ensured, 'storeMethods')) {
        ensured.storeMethods({
          refresh: component.refresh
        });
      }
      getValidationValue = options.validationValue || function(el, clean, template) {
        var value;
        value = $(el).val();
        return clean(value);
      };
      cleanValue = function(val, options) {
        var cln, obj;
        obj = {};
        obj[component.field] = val;
        cln = component.schema.clean(obj, options);
        return cln[component.field];
      };
      component.validateElement = function(el, fromUserEvent) {
        var ctx;
        cleanValue = (component.schemaContext != null) && cleanValue || function(arg) {
          return arg;
        };
        ctx = {
          stop: new Stopper(),
          startup: !fromUserEvent,
          validate: function(val) {
            setValue(val, fromUserEvent);
            return this.stop;
          }
        };
        val = getValidationValue.call(ctx, el, cleanValue, self);
        if (!(val instanceof Stopper)) {
          return setValue(val, fromUserEvent);
        }
      };
      ext = {};
      ext[MODULE_NAMESPACE] = component;
      _.extend(self, ext);
      return options.created && options.created.call(self);
    };
  };
  elements.renderedFactory = function(options) {
    return function() {
      var component, el, ref, self;
      self = this;
      component = self[MODULE_NAMESPACE];
      el = self.findAll(options.validationSelector);
      if (component.providesData) {
        el && component.validateElement(el, false);
      }
      options.reset && ((ref = component.parentData) != null ? typeof ref.addResetFunction === "function" ? ref.addResetFunction(function() {
        return options.reset.call(self, el);
      }) : void 0 : void 0);
      return options.rendered && options.rendered.call(self);
    };
  };
  elements.helpers = {
    value: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      component.valueDep.depend();
      return Tracker.nonreactive(function() {
        return component.value.get();
      });
    },
    reactiveValue: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.value.get();
    },
    originalValue: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.original.get();
    },
    uniqueValue: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return !_.isEqual(component.original.get(), component.value.get());
    },
    newRemoteValue: function() {
      var component, inst, value;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      value = component.newRemoteValue.get();
      return (value != null) && value.toString();
    },
    remoteValueChange: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.remoteValueChange.get();
    },
    valid: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.valid.get();
    },
    changed: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.changed.get();
    },
    unchanged: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return !component.changed.get();
    },
    isChild: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      return component.isChild;
    },
    schema: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if ((component.schema != null) && (component.field != null)) {
        return component.schema._schema[component.field];
      }
    },
    label: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if ((component.schema != null) && (component.field != null)) {
        return component.schema.label(component.field);
      }
    },
    instructions: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if ((component.schema != null) && (component.field != null)) {
        return component.schema.keyInstructions(component.field);
      }
    },
    errorMessage: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if ((component.schemaContext != null) && (component.field != null)) {
        return component.schemaContext.keyErrorMessage(component.field);
      }
    },
    submitted: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if (component.isChild) {
        return component.submitted.get();
      } else {
        return inst.data.submitted || false;
      }
    },
    unsubmitted: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if (component.isChild) {
        return !component.submitted.get();
      } else {
        return inst.data.unsubmitted || false;
      }
    },
    loading: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if (component.isChild) {
        return component.loading.get();
      } else {
        return inst.data.loading || false;
      }
    },
    success: function() {
      var component, inst;
      inst = Template.instance();
      component = inst[MODULE_NAMESPACE];
      if (component.isChild) {
        return component.success.get();
      } else {
        return inst.data.success || false;
      }
    }
  };
  createElement = function(obj) {
    var evt, i, key, len, options, ref, selectorWithEvents, template;
    check(obj, Match.ObjectIncluding({
      template: String,
      validationEvent: Match.Optional(Match.OneOf(String, [String])),
      validationValue: Match.Optional(Function),
      validationSelector: Match.Optional(String),
      reset: Match.Optional(Function),
      passThroughData: Match.Optional(Boolean),
      created: Match.Optional(Function),
      rendered: Match.Optional(Function),
      destroyed: Match.Optional(Function)
    }));
    template = Template[obj.template];
    if (template) {
      evt = {};
      options = {
        providesData: false
      };
      ref = ['validationValue', 'validationSelector', 'reset', 'passThroughData', 'created', 'rendered', 'destroyed'];
      for (i = 0, len = ref.length; i < len; i++) {
        key = ref[i];
        if (_.has(obj, key)) {
          options[key] = obj[key];
        }
      }
      if (_.has(obj, 'validationEvent')) {
        options.validationSelector = options.validationSelector || '.reactive-element';
        selectorWithEvents = Match.test(obj.validationEvent, String) && (obj.validationEvent + " " + options.validationSelector) || _.map(obj.validationEvent, function(e) {
          return e + " " + options.validationSelector;
        }).join(', ');
        evt[selectorWithEvents] = function(e, t) {
          return t[MODULE_NAMESPACE].validateElement(e.currentTarget, true);
        };
        options.providesData = true;
      }
      template.created = elements.createdFactory(options);
      template.rendered = elements.renderedFactory(options);
      options.destroyed && (template.destroyed = options.destroyed);
      template.helpers(elements.helpers);
      return template.events(evt);
    }
  };
  createFormBlock = function(obj) {
    var evt, i, key, len, options, ref, template;
    check(obj, Match.ObjectIncluding({
      template: String,
      submitType: String,
      created: Match.Optional(Function),
      rendered: Match.Optional(Function),
      destroyed: Match.Optional(Function)
    }));
    template = Template[obj.template];
    if (template) {
      options = {};
      evt = {};
      ref = ['created', 'rendered', 'destroyed'];
      for (i = 0, len = ref.length; i < len; i++) {
        key = ref[i];
        if (_.has(obj, key)) {
          options[key] = obj[key];
        }
      }
      if (obj.submitType === 'normal') {
        evt['submit form'] = function(e, t) {
          e.preventDefault();
          e.stopPropagation();
          return t[MODULE_NAMESPACE].submit();
        };
      } else if (obj.submitType === 'enterKey') {
        evt['submit form'] = function(e, t) {
          e.preventDefault();
          return e.stopPropagation();
        };
        evt['keypress form'] = function(e, t) {
          if (e.which === 13) {
            e.preventDefault();
            e.stopPropagation();
            return t[MODULE_NAMESPACE].submit();
          }
        };
      }
      template.created = forms.createdFactory(options);
      options.rendered && (template.rendered = options.rendered);
      options.destroyed && (template.destroyed = options.destroyed);
      template.helpers(forms.helpers);
      return template.events(evt);
    }
  };
  createForm = function(obj) {
    deprecatedLogger('createForm', 'createFormBlock');
    return createFormBlock(obj);
  };
  return {
    createFormBlock: createFormBlock,
    createForm: createForm,
    createElement: createElement,
    namespace: MODULE_NAMESPACE
  };
})();