TemplatesForms = {};

TemplatesForms.toString = function () {
  return 'TemplatesForms';
};

// Still need to fix these...
var createElement = function(obj) {
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

var createFormBlock = function(obj) {
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

var createForm = function(obj) {
  deprecatedLogger('createForm', 'createFormBlock');
  return createFormBlock(obj);
};

_.extend(TemplatesForms, {
  createFormBlock: createFormBlock,
  createForm: createForm,
  createElement: createElement
});