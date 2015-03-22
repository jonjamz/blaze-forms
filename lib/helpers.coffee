Template.registerHelper 'context', ->
  context = Template.instance?().data?.context

  return {

    # Provide reactive helpers for dealing with form state directly
    # -------------------------------------------------------------

    failed: ->
      if context?.failed?.get?
        return context.failed.get()

    success: ->
      if context?.success?.get?
        return context.success.get()

    invalidCount: ->
      if context?.schemaContext?.invalidKeys?
        return context.schemaContext.invalidKeys().length

    invalid: ->
      if context?.invalid?.get?
        return context.invalid.get()

    loading: ->
      if context?.loading?.get?
        return context.loading.get()

    changed: ->
      if context?.changed?.get?
        return context.changed.get()

    unchanged: ->
      if context?.changed?.get?
        return !context.changed.get()

    submitted: ->
      if context?.submitted?.get?
        return context.submitted.get()

    unsubmitted: ->
      if context?.submitted?.get?
        return !context.submitted.get()
  }