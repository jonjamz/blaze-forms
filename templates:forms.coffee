
# Add the next upcoming version here to test!
# Now working on: v1.1.0

@ReactiveNext = do ->

  # Forms
  # ========================================================================================
  # Simple template block helpers that provide advanced functionality.

  forms = {}

  # Created callback (constructor)
  # ------------------------------
  # Sets up a template to be used as a custom block helper for ReactiveForm elements,
  # at a minimum to provide a form element to wrap UI.contentBlock and pass in data.

  # NOTE: SimpleSchema validation is optional, but an action function is required.

  forms.created = ->
    self = this

    # Validation
    # ----------
    # Validate passed-in data

    check(self.data.schema, Match.Optional(SimpleSchema))
    check(self.data.action, Function) # (formObject) -> do something
    check(self.data.data, Match.Optional(Object))

    # Schema
    # ------
    # Set schema if exists (optional)

    if self.data.schema
      ctx = self.data.schema.newContext()
      self.schemaContext = ctx

    # Values
    # ------
    # Store validated element values as local data (can't submit invalid data anyway)

    validatedValues = {} # (non-reactive)

    self.setValidatedValue = (field, value) ->
      validatedValues[field] = value

    # States
    # ------
    # Set by the submit method below

    self.submitted = new Blaze.ReactiveVar(false)
    self.failed    = new Blaze.ReactiveVar(false)
    self.success   = new Blaze.ReactiveVar(false)
    self.invalid   = new Blaze.ReactiveVar(false)
    self.loading   = new Blaze.ReactiveVar(false)

    # Ensure states are mutually exclusive--set with these methods only
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

    # When a user fixes the invalid fields, clear invalid state
    self.autorun ->
      if !self.schemaContext.invalidKeys().length
        self.invalid.set(false)

    # Submit
    # ------

    # Validate data and run provided action function
    self.submit = ->
      self.submitted.set(true)

      # Check the schema if we're using SimpleSchema
      # If any values are bad, return without running the action function.
      if self.schemaContext?
        if !!self.schemaContext.invalidKeys().length
          setInvalid()
          return

      # Invoke loading state until action function returns failed or success.
      setLoading()

      # Send form elements and callbacks to action function.
      # The action function is bound to validatedValues.
      formElements = self.findAll('.reactive-element')
      callbacks =
        success: setSuccess
        falied: setFailed

      self.data.action.call(validatedValues, formElements, callbacks)

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

    __setValidatedValue__: ->
      return Template.instance().setValidatedValue

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
  # Sets up its own schema and local schema context if passed (expects SimpleSchema instances)
  # Otherwise, it looks for a direct parent schema (from a form block helper) and expects
  # a passed-in context so that invalidations can be stored on the form.

  elements.createdFactory = (options) ->
    return ->

      self = this
      parentData = Template.parentData(1)

      self.valid = new Blaze.ReactiveVar(true)
      self.field = self.data.field || null
      self.isChild = parentData && parentData.submitted?

      # Setup
      # -----

      # Integrate with parent data and methods if possible
      if self.isChild
        self.submit = parentData.submit || null
        self.submitted = parentData.submitted || null
        self.loading = parentData.loading || null
        self.schema = parentData.schema || null
        self.schemaContext = parentData.schemaContext || null
        initValue = parentData.data && parentData.data[self.field] || null

      # But if not, run standalone
      else
        self.schema = self.data.schema || null
        self.schemaContext = self.data.schema && self.data.schema.newContext() || null
        initValue = self.data.data && self.data.data[self.field] || null

      # Value
      # -----
      # Track this element's latest validated value, starting with init data

      self.value = new Blaze.ReactiveVar(initValue)

      # Save a value--usually after successful validation
      setValue = setValidatedValue = (value) ->

        self.value.set(value)

        # Save to a parent form block if possible
        if self.isChild && parentData.setValidatedValue?
          parentData.setValidatedValue(self.field, value)

      # Validation
      # ----------

      # Get value to test from `.reactive-element` (user-provided, optionally)
      getValidationValue = options.validationValue || (el, clean, template) ->
        value = $(el).val()
        return clean(value)

      # Wrap the SimpleSchema `clean` function to add the key automatically
      cleanValue = (val) ->
        obj = {}
        obj[self.field] = val
        cln = self.schema.clean(obj)
        return cln[self.field]

      # Callback for `validationEvent` trigger
      # --------------------------------------

      self.validateElement = ->
        el = self.find('.reactive-element')

        if self.schema? and self.schemaContext?

          # Get value from DOM element and alter value to avoid validation errors
          val = getValidationValue(el, cleanValue, self)

          # We need an object to validate with--
          object = {}
          object[self.field] = val

          # Get true/false for validation (validating against this field only)
          isValid = self.schemaContext.validateOne(object, self.field)

          # Set `valid` property to reflect in templates
          self.valid.set(isValid)

          # Set `value` property, locally and on `self.field` on a parent, if valid
          if isValid is true
            setValidatedValue(val)
            return

        else

          # Can't pass in `clean` method if user isn't using SimpleSchema
          # Could provide a different utility method in the future for this...
          val = getValidationValue(el, self)

          # Set the value just for templates--can't validate without a schema
          setValue(val)
          return

  # Rendered callback
  # -----------------
  # Does initial validation

  elements.rendered = ->
    this.validateElement()

  # Template helpers
  # ----------------
  # Brings SimpleSchema functionality and other useful helpers into the template

  elements.helpers =

    value: ->
      inst = Template.instance()
      return inst.value.get()

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
      validationValue: Match.Optional(Function)

    template = Template[obj.template]

    options = {}
    if obj.validationValue?
      options.validationValue = obj.validationValue

    if template
      evt = {}
      evt[obj.validationEvent + ' .reactive-element'] = (e, t) ->
        t.validateElement()
      template.created = elements.createdFactory(options)
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

