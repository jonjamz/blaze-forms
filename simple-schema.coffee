# Extend Simple Schema for better use with forms
# ----------------------------------------------

SimpleSchema.extendOptions
  instructions: Match.Optional(String)

SimpleSchema.prototype.keyInstructions = (name) ->
  self = this
  if self._schema[name]?.instructions?
    return self._schema[name].instructions
  else
    return ""