var utils = TemplatesForms.utils;

/**
 * Decorate an object with third-party integrations capability.
 * A single Integratable instance can be used to decorate multiple objects--so in essence,
 * this class could be used to set up app-wide integrations that are shared.
 * Every deorated instance shares the same integrations, but every integration method is run
 * in the context of the instance.
 *
 * @class Integratable
 *
 * @param {Object} scaffolding A two-level object with groups:methods.
 */
function Integratable(scaffolding) {
  this._groups = {};
  this._done = false;
  this._integrations = {};

  if (scaffolding)
    this.scaffold(scaffolding);
}

/**
 * Decorate an object with methods that reference an integration.
 *
 * @private
 *
 * @param {Object} object
 * @param {String} group
 * @param {Object} methods
 */
Integratable.prototype._decorateGroupMethods = function (object, group, methods) {
  var self = this;
  _.each(methods, function (name) {
    object[name] = function (options) {
      var method = self._integrations[group][name];
      method ? method.call(object, options) : utils.integrationLogger(group, name);
    };
  });
};

/**
 * Decorate an object with flat methods that reference `self._integrations`.
 * Methods are called bound to the context of the decorated object.
 * This method is compatible with prototype objects as well.
 *
 * @param  {Object} object The object to decorate.
 * @return {Object} this
 */
Integratable.prototype.decorate = function (object) {
  var self = this;
  !object.integrate && (object.integrate = {});
  _.each(self._groups, function (methods, group) {
    self._decorateGroupMethods(object, group, methods);
  });
  return self;
};

/**
 * Set up Integratable instance to support a specified API structure.
 *
 * @param  {Object} scaffolding A two-level object with groups:methods.
 * @return {Object} this
 */
Integratable.prototype.scaffold = function (scaffolding) {
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
 * Add an integration to Integratable instance, for a specific group.
 *
 * @param  {String} group   The name of the group.
 * @param  {Object} methods An object of methods to integrate within the specified group.
 */
Integratable.prototype.integrate = function (group, methods) {
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

// Add to namespace.
TemplatesForms.decorators.Integratable = Integratable;
