var utils = TemplatesForms.utils;

// Logging.
utils.errorMessages = {
  action: "The `action` function is missing or invalid in your Form Block. This is a required field--you can't submit your form without it.",
  data: "The `data` field in a Form Block is optional, but if it exists, it must either be an object or a falsey value.",
  change: "The `onDataChange` hook is optional, but if it exists, it must be a function."
};

utils.canWarn = typeof console !== "undefined" && console.hasOwnProperty('warn');

utils.logger = function (message) {
  if (utils.canWarn)
    console.warn("[TemplatesForms] " + message);
};

utils.integrationLogger = function (type, method) {
  utils.logger("The `" + type + "` integration is missing for `" + method+ "`. See documentation for instructions.");
};

utils.deprecatedLogger = function (item, alternative) {
  utils.logger("`" + item + "` is deprecated. Use `" + alternative + "` instead. See documentation for more information.");
};

// Check instance rather than value.
utils.Stopper = function () {};

// Pretty much all of the below will be replaced by `Store`.
utils.isObject = function (x) {
  return _.isObject(x) && !_.isArray(x) && !_.isFunction(x) && !_.isDate(x) && !_.isRegExp(x);
};

utils.dotNotationToObject = function (key, val) {
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

utils.dotNotationToValue = function (obj, key) {
  var keys, val;
  if (!obj || !key) {
    return;
  }
  keys = key.split('.');
  val = _.reduce(keys, function (memo, key) {
    if (_.has(memo, key)) {
      return memo[key];
    } else {
      return new utils.Stopper();
    }
  }, obj);
  if (!(val instanceof utils.Stopper)) {
    return val;
  }
};

utils.deleteByDotNotation = function (obj, key) {
  var args;
  if (!obj || !key) {
    return;
  }
  args = [obj];
  args = args.concat(key.split('.'));
  Meteor._delete.apply(this, args);
  return args[0];
};

utils.deepExtendObject = function (first, second) {
  var prop;
  for (prop in second) {
    if (!second.hasOwnProperty(prop)) continue;
    if (_.has(first, prop) && utils.isObject(first[prop])) {
      deepExtendObject(first[prop], second[prop]);
    } else {
      first[prop] = second[prop];
    }
  }
  return first;
};
