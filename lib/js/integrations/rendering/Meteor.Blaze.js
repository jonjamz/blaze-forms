var utils = TemplatesForms.utils;

var formBlocks = {}, formElements = {};

// Meteor/Blaze implementation.
// `schema` is a schema class.
formBlocks.createdFactory = function (options) {
  function onCreated() {
    // Set up schema here, passing in an interface in the options.
    // If we actually did this in the createdFactory "options" that would truly decouple this
    // from any specific schema lib?

    // Abstract SchemaContext class.
    // Extend this with other schema libs as shown in docs (normal prototype extend).
    function SchemaContext(ref) {
      this._ref = ref || null;
    }

    SchemaContext.prototype.validateField = function (field) {
      if (this._ref) {
        var message = ;
        message += ;
        utils.logger(message);
      }
    };

    SchemaContext.prototype.isValid = function (field) {
      if (this._ref) {
        utils.logger(message);
      }
    };

    // Form the options from data that was passed into the template instance.
    var _options = _.extend({
      data: this.data.data,
      schema: this.data.schema, // This can be any object, it gets loaded into a provided schema instance.
      schemaClass:
    }, options);

    this.modules = this.modules || {};
    this.modules.formBlock = new FormBlock(this, options);

    //
    if (options.schemaClass) {

    }
    this.schemaContext;
    if (this.data.schema && this.data.schema.newContext) {
      this.schemaContext = this.data.schema.newContext();
    }

    // This autorun stuff should be done outside the actual FormBlock class.
    // Because it's Meteor-specific and Blaze-specific and should be decoupled.
    template.autorun(function () {
      if (self.schemaContext) {
        return !self.schemaContext.invalidKeys().length && self.invalid.set(false);
      }
    });

    // Should eventually be `messaging.on('storage', 'change')`.
    template.autorun(function () {
      var data = Template.currentData();
      self.checkTemplateData(data);
      self.loadTemplateData(data);
    });

    options.created && options.created.call(this);
  }
  return onCreated;
};

// This should correspond to prototype? Or internal interface/command object?
formBlocks.helpers = {
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

// Meteor/Blaze implementation.
formElements.createdFactory = function (options) {
  return function () {
    this.modules = this.modules || {};
    this.modules.formElement = new FormElement(this, options);
    return options.created && options.created.call(this);
  };
};

// Meteor/Blaze implementation (should call `after rendered` hook in component).
formElements.renderedFactory = function (options) {
  return function () {
    var component, el, ref, self;
    self = this;
    component = self[MODULE_NAMESPACE];
    el = self.findAll(options.validationSelector);
    if (component.providesData) {
      el && component.validateElement(el, false);
    }
    options.reset && ((ref = component.parentData) != null ? typeof ref.addResetFunction === "function" ? ref.addResetFunction(function () {
      return options.reset.call(self, el);
    }) : void 0 : void 0);
    return options.rendered && options.rendered.call(self);
  };
};

formElements.helpers = {
  value: function () {
    var component, inst;
    inst = Template.instance();
    component = inst[MODULE_NAMESPACE];
    component.valueDep.depend();
    return Tracker.nonreactive(function () {
      return component.value.get();
    });
  },
  reactiveValue: function () {
    var component, inst;
    inst = Template.instance();
    component = inst[MODULE_NAMESPACE];
    return component.value.get();
  },
  originalValue: function () {
    var component, inst;
    inst = Template.instance();
    component = inst[MODULE_NAMESPACE];
    return component.original.get();
  },
  uniqueValue: function () {
    var component, inst;
    inst = Template.instance();
    component = inst[MODULE_NAMESPACE];
    return !_.isEqual(component.original.get(), component.value.get());
  },
  newRemoteValue: function () {
    var component, inst, value;
    inst = Template.instance();
    component = inst[MODULE_NAMESPACE];
    value = component.newRemoteValue.get();
    return (value != null) && value.toString();
  },
  remoteValueChange: function () {
    var component, inst;
    inst = Template.instance();
    component = inst[MODULE_NAMESPACE];
    return component.remoteValueChange.get();
  },
  valid: function () {
    var component, inst;
    inst = Template.instance();
    component = inst[MODULE_NAMESPACE];
    return component.valid.get();
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
  isChild: function () {
    var component, inst;
    inst = Template.instance();
    component = inst[MODULE_NAMESPACE];
    return component.isChild;
  },
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
  },
  submitted: function () {
    var component, inst;
    inst = Template.instance();
    component = inst[MODULE_NAMESPACE];
    if (component.isChild) {
      return component.submitted.get();
    } else {
      return inst.data.submitted || false;
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
  success: function () {
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

TemplatesForms.integrations.integrate('rendering', {
  createFormElement: function(obj) {
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
  },
  createFormBlock: function(obj) {
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
  }
});