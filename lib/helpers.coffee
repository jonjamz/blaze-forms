Template.registerHelper 'context', ->
  context = Template.instance() && Template.instance().data && Template.instance().data.context

  return {

    # Provide reactive helpers for dealing with form state directly
    # -------------------------------------------------------------

    failed: ->
      return context.failed.get()

    success: ->
      return context.success.get()

    invalidCount: ->
      return context.schemaContext.invalidKeys().length

    invalid: ->
      return context.invalid.get()

    loading: ->
      return context.loading.get()

    changed: ->
      return context.changed.get()

    submitted: ->
      return context.submitted.get()
  }