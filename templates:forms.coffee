
@ReactiveForms = ReactiveForms = do ->

  # Forms
  # ========================================================================================
  # Simple template block helpers that provide advanced functionality.

  forms = {}

  # Created callback (constructor)
  # ------------------------------
  # Sets up a template to be used as a custom block helper for ReactiveForm elements,
  # at a minimum to provide a form element to wrap UI.contentBlock and pass in data.

  # NOTE: Simple Schema validation is optional, but an action function is required.

  forms.created = ->
    self = this

    check(self.data.schema, Match.Optional(SimpleSchema))
    check(self.data.action, Function) # (formObject) -> do something

    # We can use Simple Schema, or not...
    if self.data.schema
      ctx = self.data.schema.newContext()
      self.schemaContext = ctx

    self.submitted = new Blaze.ReactiveVar(false)
    self.failed    = new Blaze.ReactiveVar(false)
    self.success   = new Blaze.ReactiveVar(false)
    self.invalid   = new Blaze.ReactiveVar(false)
    self.loading   = new Blaze.ReactiveVar(false)

    # Enforce opposing states on success and failed vars
    setSuccess = ->
      self.loading.set(false)
      self.invalid.set(false)
      self.success.set(true)
      self.failed.set(false)

    setFailed = ->
      self.loading.set(false)
      self.invalid.set(false)
      self.failed.set(true)
      self.success.set(false)

    setLoading = ->
      self.loading.set(true)
      self.invalid.set(false)
      self.failed.set(false)
      self.success.set(false)

    setInvalid = ->
      self.loading.set(false)
      self.invalid.set(true)
      self.failed.set(false)
      self.success.set(false)

    # Once the user fixes the invalid fields, reactively set to valid
    self.autorun ->
      if !self.schemaContext.invalidKeys().length
        self.invalid.set(false)

    # Validate data and run provided action function
    self.submit = ->
      self.submitted.set(true)

      # Check the schema if we're using Simple Schema
      # See if any elements failed to validate--if so, return without running action.
      if self.schemaContext?
        if !!self.schemaContext.invalidKeys().length
          setInvalid()
          return

      # Invoke loading state until action function returns failed or success.
      setLoading()

      # Send form elements and callbacks to action function.
      formElements = self.findAll('.reactive-element')
      callbacks =
        success: setSuccess
        falied: setFailed

      self.data.action(formElements, callbacks)

    return

  # Template helpers
  # ----------------
  # Provide helpers for any form template, along with helpers that allow us to reference
  # the form template's instance data from within UI.contentBlock (where the elements live).

  forms.helpers =

    # These are passed into the form to be in the elements' parent scope
    # ------------------------------------------------------------------

    __schemaContext__: ->
      return Template.instance().schemaContext

    __submit__: ->
      return Template.instance().submit

    __submitted__: ->
      return Template.instance().submitted

    __loading__: ->
      return Template.instance().loading

    # These are used as real helpers
    # ------------------------------

    failed: ->
      inst = Template.instance()
      return inst.failed.get()

    success: ->
      return Template.instance().success.get()

    invalidCount: ->
      return Template.instance().schemaContext.invalidKeys().length

    invalid: ->
      return Template.instance().invalid.get()

    loading: ->
      return Template.instance().loading.get()



  # Elements
  # ========================================================================================
  # Reactive form elements that can work either standalone or within a form block.

  elements = {}

  # Created callback (constructor)
  # ------------------------------
  # Sets up its own schema and local schema context if passed (expects Simple Schema instances)
  # Otherwise, it looks for a direct parent schema (from a #form block helper) and expects
  # a passed-in context so that invalidations can be stored on the form.

  elements.created = ->
    self = this
    parentData = Template.parentData(1)

    self.valid = new Blaze.ReactiveVar(true)
    self.field = self.data.field || null
    self.isChild = parentData && parentData.submitted?

    # You can only run submit or check submitted if there's a surrounding {{#form}}
    if self.isChild
      self.submit = parentData.submit || null
      self.submitted = parentData.submitted || null
      self.loading = parentData.loading || null

    self.schema = self.data.schema || parentData.schema || null
    self.schemaContext = self.data.schema && self.data.schema.newContext() ||
      parentData.schemaContext ||
      null

    # Check schema if we're using Simple Schema, otherwise do nothing
    self.validateElement = ->

      if self.schema? and self.schemaContext? and self.field?
        el = self.find('.reactive-element')

        # validateOne() takes an object, not a single value, so...
        object = {}
        object[self.field] = el.value

        clean = self.schema.clean(object)

        isValid = self.schemaContext.validateOne(clean, self.field)
        self.valid.set(isValid)

        # console.log 'Validating reactive form element', object, isValid

    console.log 'New reactive form element created', self.schema, self.schemaContext
    return

  # Rendered callback
  # -----------------
  # Does initial validation

  elements.rendered = ->
    this.validateElement()

  # Template helpers
  # ----------------
  # Brings Simple Schema functionality into the template

  elements.helpers =

    label: ->
      inst = Template.instance()
      if inst.schema? and inst.field?
        return inst.schema.label(inst.field)

    instructions: ->
      inst = Template.instance()
      if inst.schema? and inst.field?
        return inst.schema.keyInstructions(inst.field)

    errorMessage: ->
      inst = Template.instance()
      if inst.schemaContext? and inst.field?
        return inst.schemaContext.keyErrorMessage(inst.field)

    valid: -> # (Use to show positive state on element, like a check mark)
      inst = Template.instance()
      return inst.valid.get()

    submitted: -> # (Use to delay showing errors until first submit)
      inst = Template.instance()
      if inst.isChild
        return inst.submitted.get()
      else
        return true

    loading: -> # (Use to disable elements while submit action is running)
      inst = Template.instance()
      if inst.isChild
        return inst.loading.get()
      else
        return false



  # Interface
  # ========================================================================================

  # Create a new reactive form element
  # ----------------------------------
  # Accepts any compatible ReactiveForm element template, and a choice of validation events

  createElement = (obj) ->
    check obj, Match.ObjectIncluding
      template: String
      validationEvent: String

    template = Template[obj.template]

    if template
      evt = {}
      evt[obj.validationEvent + ' .reactive-element'] = (e, t) ->
        t.validateElement()
      template.created = elements.created
      template.rendered = elements.rendered
      template.helpers(elements.helpers)
      template.events evt

  # Create a new form
  # -----------------
  # Accepts any compatible ReactiveForm form template, and a choice of submit types

  createForm = (obj) ->
    check obj, Match.ObjectIncluding
      template: String
      submitType: String

    template = Template[obj.template]

    if template
      evt = {}

      if obj.submitType is 'normal'
        evt['submit form'] = (e, t) ->
          e.preventDefault()
          t.submit()

      else if obj.submitType is 'enterKey'
        evt['submit form'] = (e, t) ->
          e.preventDefault()

        evt['keypress form'] = (e, t) ->
          if e.which is 13
            e.preventDefault()
            t.submit()

      template.created = forms.created
      template.rendered = forms.rendered
      template.helpers(forms.helpers)
      template.events evt



  # Return Interface
  # ========================================================================================

  return {
    createForm: createForm
    createElement: createElement
  }

