// Extend Simple Schema for better use with forms.
// -----------------------------------------------

SimpleSchema.extendOptions({
  instructions: Match.Optional(String)
});

SimpleSchema.prototype.keyInstructions = function (name) {
  if (this._schema[name] && this._schema[name].instructions)
    return this._schema[name].instructions;
  else
    return "";
};