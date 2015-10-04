var utils = TemplatesForms.utils;

function FormElement(parent, options) {
  var self = this;

  var ext, getValidationValue, i, key, len, ref, ref1, setValue;

  var component = {
    field: self.data.field || null,
    initValue: null,
    passThroughData: self.data.passThroughData || options.passThroughData || false,
    providesData: !self.data.standalone && options.providesData,
    parentData: null,
    isChild: false,
    distance: 0
  };

  // This unique context traversal should happen outside the FormElement class, or perhaps
  // as part of a before hook in a formalized method where a child integrates with a parent.
  // Because this is something Blaze-specific and should be decoupled from the actual
  // components.
  if (!self.data.standalone) {
    var data, key, val, ref;
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
  var ensured = component.field && ((ref1 = component.parentData) != null ? typeof ref1.ensureElement === "function" ? ref1.ensureElement(component.field, component.initValue) : void 0 : void 0);
  component.original = ensured && ensured.original || new ReactiveVar(component.initValue);
  component.value = ensured && ensured.value || new ReactiveVar(component.initValue);
  component.valueDep = ensured && ensured.valueDep || new Tracker.Dependency;
  component.valid = ensured && ensured.valid || new ReactiveVar(true);
  component.changed = ensured && ensured.changed || new ReactiveVar(false);

  // So this is how validation currently works, and it's simple:
  // - validateValue runs `validateOne` from SimpleSchema and sets the `valid` state to the result
  // - a separate autorun function watches a reactive method from SimpleSchema to check if this key is valid.
  // There's another aspect coupling us to SimpleSchema, and that's the validation messages.
  // But actually, those messages don't need to be a feature of TemplatesForms.
  // The integration of any schema should have the following methods:
  // - validateField
  // -
  var validateValue = function (val) {
    var isValid, object;
    object = dotNotationToObject(component.field, val);
    isValid = component.schemaContext.validateOne(object, component.field);
    component.valid.set(isValid);
    return isValid;
  };
  (component.schemaContext != null) && self.autorun(function () {
    var invalid;
    // We're doing it this way, so there's no real need to use SimpleSchema's internal context.
    // We could literally observe the field's event channel from the form block and
    invalid = component.schemaContext.keyIsInvalid(component.field);
    return component.valid.set(!invalid);
  });
  setValue = function (value, fromUserEvent) {
    if (!_.isEqual(component.value.get(), value)) {
      component.value.set(value);
      fromUserEvent && component.changed.set(true);
    }
    if (component.isChild && (component.parentData.setValidatedValue != null)) {
      return component.parentData.setValidatedValue(component.field, value, fromUserEvent);
    }
  };
  component.providesData && (component.schemaContext != null) && self.autorun(function () {
    val = component.value.get();
    return Tracker.nonreactive(function () {
      var isValid;
      return isValid = validateValue(val);
    });
  });
  component.remoteValueChange = new ReactiveVar(false);
  component.newRemoteValue = new ReactiveVar(component.initValue);
  component.refresh = function (val) {
    if (Match.test(val, void 0)) {
      val = component.newRemoteValue.get();
    }
    if (Match.test(component.value.get(), void 0) || !component.changed.get()) {
      setValue(val);
    }
    component.original.set(val);
    return component.valueDep.changed();
  };
  component.ignoreValueChange = function () {
    return component.remoteValueChange.set(false);
  };
  component.acceptValueChange = function () {
    component.remoteValueChange.set(false);
    return component.refresh();
  };
  self.autorun(function () {
    var fieldValue;
    data = component.isChild && Template.parentData(component.distance) || Template.currentData();
    if ((data != null ? data.data : void 0) != null) {
      fieldValue = dotNotationToValue(data.data, component.field);
      return Tracker.nonreactive(function () {
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
  getValidationValue = options.validationValue || function (el, clean, template) {
    var value;
    value = $(el).val();
    return clean(value);
  };

  component.validateElement = function (el, fromUserEvent) {
    var ctx = {
      stop: new utils.Stopper(),
      startup: !fromUserEvent,
      validate: function (val) {
        setValue(val, fromUserEvent);
        return this.stop;
      }
    };
    val = getValidationValue.call(ctx, el, cleanValue, self);
    if (!(val instanceof Stopper)) {
      return setValue(val, fromUserEvent);
    }
  };
}

FormElement.prototype.something = function () {

};

// Add to namespace.
TemplatesForms.components.FormElement = FormElement;