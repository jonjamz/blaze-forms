var utils = TemplatesForms.utils;

/**
 * Decorate an object with third-party integrations capability.
 * A single Integrations instance can be used to decorate multiple objects--so in essence,
 * this class could be used to set up app-wide integrations that are shared.
 *
 * @class Integrations
 *
 * @param {Object} scaffolding A two-level object with groups:methods.
 * @param {Object} [context]   The object to decorate.
 */
function Integrations(scaffolding, context) {
  this._groups = {};
  this._done = false;
  this._integrations = {};

  if (scaffolding)
    this.scaffold(scaffolding);

  if (context)
    this.decorate(context);
}

/**
 * Decorate an object with flat methods that reference `self._integrations`.
 * Methods are called bound to the context of the decorated object.
 *
 * @param  {Object} object The object to decorate.
 * @return {Object} this
 */
Integrations.prototype.decorate = function (object) {
  var self = this;
  _.each(self._groups, function (names) {
    _.each(names, function (name) {
      object[name] = function (options) {
        var method = self._integrations[group][name];
        method && method.call(object, options) || utils.integrationLogger(group, name);
      };
    });
  });
  return self;
};

/**
 * Set up Integrations instance to support a specified API structure.
 *
 * @param  {Object} scaffolding A two-level object with groups:methods.
 * @return {Object} this
 */
Integrations.prototype.scaffold = function (scaffolding) {
  var self = this;
  if (!self._done) {
    _.each(scaffolding, function (methods, group) {
      var names = _.keys(methods);
      self._groups[group] = names;
      self._integrations[group] = {};
    });
    self._done = true;
  }
  return self;
};

/**
 * Add an integration to Integrations instance, for a specific group.
 *
 * @param  {String} group   The name of the group.
 * @param  {[type]} methods An object of methods to integrate within the specified group.
 */
Integrations.prototype.integrate = function (group, methods) {
  var self = this,
    names = self._groups[group];
  if (names) {
    _.each(methods, function (method, name) {
      if (_.contains(names, name)) {
        self._integrations[group][name] = method;
      }
    });
  }
};

TemplatesForms.integrations = new Integrations({
  rendering: {
    createFormBlock: null,
    createFormElement: null
  },
  validation: {
    getSchemaInstance: null,
    validateField: null,
    hasInvalidFields: null
  }
});

TemplatesForms.integrations.decorate(TemplatesForms);

