
@ReactiveForms = ReactiveForms = do ->

  # Utils
  # ========================================================================================
  # Generic helper functions for use throughout the package.

  # Log deprecation warning and offer alternative
  deprecatedLogger = (item, alternative) ->
    if console?.warn?
      console.warn("[forms] `#{item}` is deprecated. Use `#{alternative}` instead.
        See documentation for more information.")



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

    check self.data.schema, Match.Optional(SimpleSchema)
    check self.data.action, Function # (formObject) -> do something
    check self.data.data, Match.Optional Match.Where (x) ->
      return _.isObject(x) && !_.isArray(x) && !_.isFunction(x) # (Issue #9)

    # Schema
    # ------
    # Set schema if exists (optional)

    if self.data.schema && self.data.schema.newContext
      self.schemaContext = _.extend(self.data.schema.newContext(), {data: self.data.data}) # (Issue #4)

    # States
    # ------
    # Set by the submit method below

    self.changed   = new Blaze.ReactiveVar(false)
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

    # As `success` represents the end of a form session, a subsequent `change` should
    # initiate a new session, if the UI is still editable.

    # Although, a successful `change` of one value doesn't negate `invalid` or `failed`.
    # The reactive computation below kills `invalid` when all keys become valid.
    setChanged = ->
      self.changed.set(true)

      # Add non-referenced data onto the schema context for validation (Issue #4).
      if self.schemaContext?
        self.schemaContext.data = _.extend({}, validatedValues)

      # If `success` state is active, disable it and `submitted` to refresh the session.
      # Don't let `changed` affect `submitted` except for when `success` is true.
      if self.success.get() is true
        self.success.set(false)
        self.submitted.set(false)

    # When a user fixes the invalid fields, clear invalid state
    self.autorun ->
      if !self.schemaContext.invalidKeys().length
        self.invalid.set(false)

    # Values
    # ------
    # Store validated element values as local data (can't submit invalid data anyway)

    validatedValues = {} # (non-reactive form data context)

    # Track which fields have changed when initial data is present (Issue #11)
    changedValues = self.data.data && {} || undefined

    self.setValidatedValue = (field, value) ->

      # First, opt into setting `changed` if this is a unique update.
      if _.has(validatedValues, field) && !_.isEqual(value, validatedValues[field])

        # Set value to form data context, optionally set `changedValues`.
        validatedValues[field] = value
        changedValues && changedValues[field] = value

        setChanged()

      # If the field doesn't exist in validatedValues yet, add it.
      else
        validatedValues[field] = value

        # If initial data was provided--
        # Initial validation passing back that value shouldn't trigger `changed`.
        if self.data.data
          unless _.has(self.data.data, field) && _.isEqual(self.data.data[field], value)
            setChanged()

        # If no initial data was provided, trigger `changed` because it's a new value.
        else
          setChanged()

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
        failed: setFailed

      self.data.action.call(validatedValues, formElements, callbacks, changedValues)

    return

  # Template helpers
  # ----------------
  # Provide helpers for any form template, along with helpers that allow us to reference
  # the form template's instance data from within UI.contentBlock (where the elements live).

  forms.helpers =

    # This is all of the below consolidated into one object (Issue #15)
    # -----------------------------------------------------

    context: ->
      inst = Template.instance()

      return {
        schema: inst.data.schema
        schemaContext: inst.schemaContext
        submit: inst.submit
        submitted: inst.submitted
        loading: inst.loading
        success: inst.success
        failed: inst.failed
        invalid: inst.invalid
        changed: inst.changed
        setValidatedValue: inst.setValidatedValue
      }

    # These are passed into the form to be in the elements' parent scope (deprecated)
    # ------------------------------------------------------------------

    __schemaContext__: ->
      deprecatedLogger('__schemaContext__', 'context')
      return Template.instance().schemaContext

    __setValidatedValue__: ->
      deprecatedLogger('__setValidatedValue__', 'context')
      return Template.instance().setValidatedValue

    __submit__: ->
      deprecatedLogger('__submit__', 'context')
      return Template.instance().submit

    __submitted__: ->
      deprecatedLogger('__submitted__', 'context')
      return Template.instance().submitted

    __loading__: ->
      deprecatedLogger('__loading__', 'context')
      return Template.instance().loading

    __success__: ->
      deprecatedLogger('__success__', 'context')
      return Template.instance().success

    # These are used as real helpers
    # ------------------------------

    failed: ->
      return Template.instance().failed.get()

    success: ->
      return Template.instance().success.get()

    invalidCount: ->
      return Template.instance().schemaContext.invalidKeys().length

    invalid: ->
      return Template.instance().invalid.get()

    loading: ->
      return Template.instance().loading.get()

    changed: ->
      return Template.instance().changed.get()

    submitted: ->
      return Template.instance().submitted.get()



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
      initValue = null
      parentData = Template.parentData(1)

      # Basic setup
      # -----------

      self.field = self.data.field || null

      # Support a single context object (Issue #15)
      if parentData && _.has(parentData, 'context')
        context = parentData.context

        # Move anything outside of `context` into `context
        if Match.test(context, Object)
          for key, val of parentData when key isnt 'context'
            context[key] = val

        # Give us our new parent data
        parentData = context

      # Keep this here for now because checking against `context` would be unreliable
      self.isChild = parentData && parentData.submit?

      if self.isChild

        # Localize parent states and schema (specific items appropriate for use in elements)
        for key in ['submit', 'submitted', 'loading', 'success', 'schema', 'schemaContext']
          self[key] = parentData[key] || null

        # Set local initial value if provided by the parent
        if parentData.data && _.has(parentData.data, self.field)
          initValue = parentData.data[self.field]

      # But if not, run standalone
      else
        self.schema = self.data.schema || null
        self.schemaContext = self.data.schema && self.data.schema.newContext() || null

        if self.data.data && _.has(self.data.data, self.field)
          initValue = self.data.data[self.field]

      # States
      # ------

      self.valid = new Blaze.ReactiveVar(true)
      self.changed = new Blaze.ReactiveVar(false)

      # Value
      # -----
      # Track this element's latest validated value, starting with init data

      self.value = new Blaze.ReactiveVar(initValue)

      # Save a value--usually after successful validation
      setValue = setValidatedValue = (value) ->

        # Initial value from passed-in data will get validated on render.
        # That shouldn't count as `changed`.
        # This fixes that, along with adding a general idempotency.
        unless _.isEqual(self.value.get(), value)
          self.value.set(value)
          self.changed.set(true)

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
      cleanValue = (val, options) ->
        obj = {}
        obj[self.field] = val
        cln = self.schema.clean(obj, options)
        return cln[self.field]

      # Callback for `validationEvent` trigger
      # --------------------------------------

      self.validateElement = ->
        el = self.find('.reactive-element')

        if self.schema? and self.schemaContext?

          # Get value from DOM element and alter value to avoid validation errors
          val = getValidationValue(el, cleanValue, self)

          # We need an object to validate with--
          object = _.extend({}, self.schemaContext.data) # (Issue #4)
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

    valid: -> # (Use to show positive state on element, like a check mark)
      inst = Template.instance()
      return inst.valid.get()

    changed: -> # (Use to show or hide things after first valid value change)
      inst = Template.instance()
      return inst.changed.get()

    isChild: -> # (Use to show or hide things regardless of parent state)
      inst = Template.instance()
      return inst.isChild

    # These are from SimpleSchema functionality
    # -----------------------------------------

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

    # These are from the parent form block
    # ------------------------------------
    # Default to `false` if no form block exists.

    submitted: -> # (Use to delay showing errors until first submit)
      inst = Template.instance()
      if inst.isChild
        return inst.submitted.get()
      else
        return inst.data.submitted || false

    loading: -> # (Use to disable elements while submit action is running)
      inst = Template.instance()
      if inst.isChild
        return inst.loading.get()
      else
        return inst.data.loading || false

    success: -> # (Use to hide things after a successful submission)
      inst = Template.instance()
      if inst.isChild
        return inst.success.get()
      else
        return inst.data.success || false



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

  # Create a new form block
  # -----------------------
  # Accepts any compatible ReactiveForm form template, and a choice of submit types

  createFormBlock = (obj) ->
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

  createForm = (obj) ->
    deprecatedLogger('createForm', 'createFormBlock')
    return createFormBlock(obj)



  # Return Interface
  # ========================================================================================

  return {
    createFormBlock: createFormBlock
    createForm: createForm # Deprecated. Use `createFormBlock` instead.
    createElement: createElement
  }
