## How-To Guides

### Extend Simple-Schema for Better Use With Forms

The code snippet below was included in templates:forms before `v2.0.0`. We are transitioning away from Simple-Schema dependency in the core.

```javascript

SimpleSchema.extendOptions({
  instructions: Match.Optional(String)
});

SimpleSchema.prototype.keyInstructions = function (name) {
  var self = this;
  if (self._schema[name] && self._schema[name].instructions) {
    return self._schema[name].instructions;
  } else {
    return "";
  }
};

```

The `{{instructions}}` helper is still available as of right now, but may be removed in favor of `{{schema.instructions}}` after further testing.

Top-level helpers specific to a third-party schema package need to all be eventually removed.