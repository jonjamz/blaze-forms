var forms = {}, utils = TemplatesForms.utils;

function FormBlock(template, options) {
  var self = this;

  // States.
  self.changed = new ReactiveVar(false);
  self.submitted = new ReactiveVar(false);
  self.failed = new ReactiveVar(false);
  self.success = new ReactiveVar(false);
  self.invalid = new ReactiveVar(false);
  self.loading = new ReactiveVar(false);

  // Data.
  self.validatedValues = {};
  self.changedValues = template.data.data && {} || void 0;
  self.elementValues = {};
  self.resetFunctions = [];
  self.elementSelectors = ['.reactive-element'];
  self.initialData = template.data.data && template.data.data || void 0;

  // Messages.
  self.successMessage = new ReactiveVar(null);
  self.failedMessage = new ReactiveVar(null);

  // Schema.
  self.schemaContext;
  if (template.data.schema && template.data.schema.newContext) {
    self.schemaContext = template.data.schema.newContext();
  }
  template.autorun(function () {
    if (self.schemaContext) {
      return !self.schemaContext.invalidKeys().length && self.invalid.set(false);
    }
  });

  // Should eventually be `this.on('template:currentData')`.
  template.autorun(function () {
    var data = Template.currentData();
    self.checkTemplateData(data);
    self.loadTemplateData(data);
  });
}

FormBlock.prototype.checkTemplateData = function (data) {
  if (data.hasOwnProperty('schema') && !(schema instanceof SimpleSchema))
    utils.canWarn && console.warn(utils.errorMessages.schema);

  if (!data.hasOwnProperty('action') || !(typeof data.action === 'function'))
    utils.canWarn && console.warn(utils.errorMessages.action);

  if (data.hasOwnProperty('data') && !utils.isObject(data) && !!data)
    utils.canWarn && console.warn(utils.errorMessages.data);

  if (data.hasOwnProperty('onDataChange') && !(typeof data.onDataChange === 'function'))
    utils.canWarn && console.warn(utils.errorMessages.change);
};

FormBlock.prototype.loadTemplateData = function (data) {
  var self = this;

  if (!data.data || _.isEqual(data.data, self.initialData)) return;

  // Make sure to force `_id` even if no form elements claim that field.
  // Note: might want to just do this for all passed-in data?
  if (data.data.hasOwnProperty('_id'))
    self.validatedValues._id = data.data._id;

  // Run `onDataChange` callback whenever data changes.
  if (template.data.onDataChange) {
    var ctx = {
      reset: self.resetForm,
      refresh: function (field, val) {
        return Tracker.afterFlush(function () {
          var methods, results;
          if (field && self.elementValues.hasOwnProperty(field)) {
            return self.elementValues[field].refresh(val);
          } else {
            results = [];
            for (field in self.elementValues) {
              if (!self.elementValues.hasOwnProperty(field)) continue;
              methods = self.elementValues[field];
              results.push(methods.refresh());
            }
            return results;
          }
        });
      },
      changed: function () {
        self.setChanged();
      }
    };
    template.data.onDataChange.call(ctx, self.initialData, data.data);
  }
  self.initialData = data.data;
};

FormBlock.prototype.setExclusive = function (activeState, message) {
  var i, len, ref, state;
  ref = ['success', 'failed', 'loading', 'invalid'];
  for (i = 0, len = ref.length; i < len; i++) {
    state = ref[i];
    this[state].set(state === activeState);
  }
  if (message && this[activeState + 'Message']) {
    this[activeState + 'Message'].set(message);
  }
};

FormBlock.prototype.setChanged = function () {
  this.changed.set(true);
  if (this.success.get() === true) {
    this.success.set(false);
    this.submitted.set(false);
  }
};

FormBlock.prototype.resetStates = function (hard) {
  var self = this;
  var field, obj, results;
  self.changed.set(false);
  self.submitted.set(false);
  self.invalid.set(false);
  self.loading.set(false);
  if (hard) {
    self.failed.set(false);
    self.success.set(false);
    results = [];
    for (field in self.elementValues) {
      obj = self.elementValues[field];
      obj.changed.set(false);
      results.push(obj.valid.set(true));
    }
    return results;
  }
};

FormBlock.prototype.resetElementValues = function () {
  var field, obj, results;
  results = [];
  for (field in this.elementValues) {
    obj = this.elementValues[field];
    obj.original.set(null);
    obj.value.set(null);
    results.push(obj.valueDep.changed());
  }
  return results;
};

FormBlock.prototype.ensureElement = function (field, value) {
  var self = this;
  return self.elementValues.hasOwnProperty(field) && self.elementValues[field] || (self.elementValues[field] = {
    original: new ReactiveVar(value),
    value: new ReactiveVar(value),
    valueDep: new Tracker.Dependency,
    valid: new ReactiveVar(true),
    changed: new ReactiveVar(false),
    storeMethods: function(methods) {
      var method, name, results;
      results = [];
      for (name in methods) {
        if (!methods.hasOwnProperty(name)) continue;
        method = methods[name];
        results.push(self.elementValues[field][name] = method);
      }
      return results;
    }
  });
};

FormBlock.prototype.setValidatedValue = function (field, value, fromUserEvent) {
  var self = this;
  var currentValue = dotNotationToValue(self.validatedValues, field);
  var objectWithValue = dotNotationToObject(field, value);
  var original = self.elementValues[field].original.get();
  if (!(typeof currentValue === 'undefined')) {
    if (!_.isEqual(currentValue, value)) {
      self.validatedValues = deepExtendObject(self.validatedValues, objectWithValue);
      if (fromUserEvent) {
        self.setChanged();
        if (self.changedValues) {
          if (!_.isEqual(original, value)) {
            return self.changedValues = deepExtendObject(self.changedValues, objectWithValue);
          } else {
            return self.changedValues = deleteByDotNotation(self.changedValues, field);
          }
        }
      }
    }
  } else {
    self.validatedValues = deepExtendObject(self.validatedValues, objectWithValue);
    if (fromUserEvent) {
      self.setChanged();
      if (self.changedValues && (typeof original === 'undefined')) {
        return self.changedValues = deepExtendObject(self.changedValues, objectWithValue);
      }
    }
  }
};

FormBlock.prototype.addResetFunction = function (func) {
  this.resetFunctions.push(func);
};

FormBlock.prototype.addCustomSelector = function (selector) {
  if (indexOf.call(this.elementSelectors, selector) < 0) {
    this.elementSelectors.push(selector);
  }
};

FormBlock.prototype.resetForm = function (hard) {
  var func, i, len;
  for (i = 0, len = this.resetFunctions.length; i < len; i++) {
    func = this.resetFunctions[i];
    func();
  }
  this.validatedValues = {};
  this.changedValues = template.data.data && {} || void 0;
  this.resetElementValues();
  this.resetStates(hard);
  if (hard) {
    this.successMessage.set(null);
    this.failedMessage.set(null);
  }
};

FormBlock.prototype.submit = function () {
  var self = this;
  self.submitted.set(true);
  // Cut out if there are any invalid keys.
  if (self.schemaContext) {
    if (!!self.schemaContext.invalidKeys().length) {
      self.setExclusive('invalid');
      return;
    }
  }
  // Continue.
  self.setExclusive('loading');
  var formElements = template.findAll(self.elementSelectors.join(', '));
  var callbacks = {
    success: function (message) {
      self.setExclusive('success', message);
    },
    failed: function (message) {
      self.setExclusive('failed', message);
    },
    reset: function (hard) {
      self.resetForm(hard);
    }
  };
  template.data.action.call(self.validatedValues, formElements, callbacks, self.changedValues);
};

// Probably move this out to a separate file?
forms.createdFactory = function (options) {
  return function () {
    this.modules = this.modules || {};
    this.modules.formBlock = new FormBlock(this, options);
    return options.created && options.created.call(this);
  };
};

// This should correspond to prototype? Or internal interface/command object?
forms.helpers = {
  context: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    return {
      schema: inst.data.hasOwnProperty('schema') && inst.data.schema || null,
      schemaContext: formBlock.schemaContext || null,
      submit: formBlock.submit,
      submitted: formBlock.submitted,
      loading: formBlock.loading,
      success: formBlock.success,
      failed: formBlock.failed,
      invalid: formBlock.invalid,
      changed: formBlock.changed,
      ensureElement: formBlock.ensureElement,
      setValidatedValue: formBlock.setValidatedValue,
      addResetFunction: formBlock.addResetFunction,
      addCustomSelector: formBlock.addCustomSelector
    };
  },
  failed: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    return formBlock.failed.get();
  },
  failedMessage: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    return formBlock.failedMessage.get();
  },
  success: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    return formBlock.success.get();
  },
  successMessage: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    return formBlock.successMessage.get();
  },
  invalidCount: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    if (formBlock.schemaContext) {
      return formBlock.schemaContext.invalidKeys().length;
    }
  },
  invalid: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    return formBlock.invalid.get();
  },
  loading: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    return formBlock.loading.get();
  },
  changed: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    return formBlock.changed.get();
  },
  unchanged: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    return !formBlock.changed.get();
  },
  submitted: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    return formBlock.submitted.get();
  },
  unsubmitted: function () {
    var formBlock, inst;
    inst = Template.instance();
    formBlock = inst.modules.formBlock;
    return !formBlock.submitted.get();
  }
};

TemplatesForms.forms = forms;