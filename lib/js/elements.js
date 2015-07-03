var elements = {}, utils = TemplatesForms.utils;

function FormElement(template, options) {

}

FormElement.prototype.something = function () {

};

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