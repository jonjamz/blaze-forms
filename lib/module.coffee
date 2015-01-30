
@ReactiveForms = ReactiveForms = do ->





  MODULE_NAMESPACE = 'reactiveForms'





  # Utils
  # ========================================================================================
  # Generic helper functions for use throughout the module.


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

  forms.createdFactory = (options) ->

    return ->

      self = this
      component = {}

      # Validation
      # ----------
      # Validate passed-in data

      check self.data.schema, Match.Optional(SimpleSchema)
      check self.data.action, Function # (formObject) -> do something
      check self.data.data, Match.Optional Match.Where (x) ->
        return !x || _.isObject(x) && !_.isArray(x) && !_.isFunction(x) # (Issue #9, #34)

      # Schema
      # ------
      # Set schema if exists (optional)

      if self.data.schema && self.data.schema.newContext
        component.schemaContext = _.extend(self.data.schema.newContext(), {data: self.data.data}) # (Issue #4)

      # States
      # ------
      # Set by the submit method below

      component.changed   = new Blaze.ReactiveVar(false)
      component.submitted = new Blaze.ReactiveVar(false)
      component.failed    = new Blaze.ReactiveVar(false)
      component.success   = new Blaze.ReactiveVar(false)
      component.invalid   = new Blaze.ReactiveVar(false)
      component.loading   = new Blaze.ReactiveVar(false)

      # Ensure states are mutually exclusive--set with these methods only
      setSuccess = ->
        component.loading.set(false)
        component.invalid.set(false)
        component.success.set(true)
        component.failed.set(false)

      setFailed = ->
        component.loading.set(false)
        component.invalid.set(false)
        component.failed.set(true)
        component.success.set(false)

      setLoading = ->
        component.loading.set(true)
        component.invalid.set(false)
        component.failed.set(false)
        component.success.set(false)

      setInvalid = ->
        component.loading.set(false)
        component.invalid.set(true)
        component.failed.set(false)
        component.success.set(false)

      # As `success` represents the end of a form session, a subsequent `change` should
      # initiate a new session, if the UI is still editable.

      # Although, a successful `change` of one value doesn't negate `invalid` or `failed`.
      # The reactive computation below kills `invalid` when all keys become valid.
      setChanged = ->
        component.changed.set(true)

        # Add non-referenced data onto the schema context for validation (Issue #4).
        if component.schemaContext?
          component.schemaContext.data = _.extend({}, validatedValues)

        # If `success` state is active, disable it and `submitted` to refresh the session.
        # Don't let `changed` affect `submitted` except for when `success` is true.
        if component.success.get() is true
          component.success.set(false)
          component.submitted.set(false)

      # When a user fixes the invalid fields, clear invalid state
      self.autorun ->
        if !component.schemaContext.invalidKeys().length
          component.invalid.set(false)

      # Values
      # ------
      # Store validated element values as local data (can't submit invalid data anyway)

      validatedValues = {} # (non-reactive form data context)

      # Track which fields have changed when initial data is present (Issue #11)
      changedValues = self.data.data && {} || undefined

      component.setValidatedValue = (field, value) ->

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
      component.submit = ->
        component.submitted.set(true)

        # Check the schema if we're using SimpleSchema
        # If any values are bad, return without running the action function.
        if component.schemaContext?
          if !!component.schemaContext.invalidKeys().length
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

      # Add component to custom namespace (Issue #21)
      ext = {}
      ext[MODULE_NAMESPACE] = component

      _.extend(self, ext)

      # Custom callback (Issue #20)
      options.created && options.created.call(self)


  # Template helpers
  # ----------------
  # Provide helpers for any form template, along with helpers that allow us to reference
  # the form template's instance data from within UI.contentBlock (where the elements live).

  forms.helpers =

    # This is all of the below consolidated into one object (Issue #15)
    # -----------------------------------------------------

    context: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]

      return {
        schema: inst.data.schema
        schemaContext: component.schemaContext
        submit: component.submit
        submitted: component.submitted
        loading: component.loading
        success: component.success
        failed: component.failed
        invalid: component.invalid
        changed: component.changed
        setValidatedValue: component.setValidatedValue
      }

    # These are passed into the form to be in the elements' parent scope (deprecated)
    # ------------------------------------------------------------------

    __schemaContext__: ->
      deprecatedLogger('__schemaContext__', 'context')
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.schemaContext

    __setValidatedValue__: ->
      deprecatedLogger('__setValidatedValue__', 'context')
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.setValidatedValue

    __submit__: ->
      deprecatedLogger('__submit__', 'context')
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.submit

    __submitted__: ->
      deprecatedLogger('__submitted__', 'context')
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.submitted

    __loading__: ->
      deprecatedLogger('__loading__', 'context')
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.loading

    __success__: ->
      deprecatedLogger('__success__', 'context')
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.success

    # These are used as real helpers
    # ------------------------------

    failed: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.failed.get()

    success: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.success.get()

    invalidCount: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.schemaContext.invalidKeys().length

    invalid: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.invalid.get()

    loading: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.loading.get()

    changed: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.changed.get()

    submitted: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.submitted.get()





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
      component = {}
      initValue = null
      parentData = Template.parentData(1)

      # Basic setup
      # -----------

      component.field = self.data.field || null

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
      component.isChild = parentData && parentData.submit?

      if component.isChild

        # Localize parent states and schema (specific items appropriate for use in elements)
        for key in ['submit', 'submitted', 'loading', 'success', 'schema', 'schemaContext']
          component[key] = parentData[key] || null

        # Set local initial value if provided by the parent
        if parentData.data && _.has(parentData.data, component.field)
          initValue = parentData.data[component.field]

      # But if not, run standalone
      else
        component.schema = self.data.schema || null
        component.schemaContext = self.data.schema && self.data.schema.newContext() || null

        if self.data.data && _.has(self.data.data, component.field)
          initValue = self.data.data[component.field]

      # States
      # ------

      component.valid = new Blaze.ReactiveVar(true)
      component.changed = new Blaze.ReactiveVar(false)

      # Value
      # -----
      # Track this element's latest validated value, starting with init data

      component.value = new Blaze.ReactiveVar(initValue)

      # Save a value--usually after successful validation
      setValue = setValidatedValue = (value) ->

        # Initial value from passed-in data will get validated on render.
        # That shouldn't count as `changed`.
        # This fixes that, along with adding a general idempotency.
        unless _.isEqual(component.value.get(), value)
          component.value.set(value)
          component.changed.set(true)

        # Save to a parent form block if possible
        if component.isChild && parentData.setValidatedValue?
          parentData.setValidatedValue(component.field, value)

      # Validation
      # ----------

      # Get value to test from `.reactive-element` (user-provided, optionally)
      getValidationValue = options.validationValue || (el, clean, template) ->
        value = $(el).val()
        return clean(value)

      # Wrap the SimpleSchema `clean` function to add the key automatically
      cleanValue = (val, options) ->
        obj = {}
        obj[component.field] = val
        cln = component.schema.clean(obj, options)
        return cln[component.field]

      # Callback for `validationEvent` trigger
      # --------------------------------------

      component.validateElement = ->
        el = self.find('.reactive-element')

        if component.schema? and component.schemaContext?

          # Get value from DOM element and alter value to avoid validation errors
          val = getValidationValue(el, cleanValue, self)

          # We need an object to validate with--
          object = _.extend({}, component.schemaContext.data) # (Issue #4)
          object[component.field] = val

          # Get true/false for validation (validating against this field only)
          isValid = component.schemaContext.validateOne(object, component.field)

          # Set `valid` property to reflect in templates
          component.valid.set(isValid)

          # Set `value` property, locally and on `component.field` on a parent, if valid
          if isValid is true
            setValidatedValue(val)
            return

        else

          # Can't pass in `clean` method if user isn't using SimpleSchema
          # Could provide a different utility method in the future for this...
          noop = (arg) ->
            return arg

          val = getValidationValue(el, noop, self)

          # Set the value just for templates--can't validate without a schema
          setValue(val)
          return

      # Add component to custom namespace (Issue #21)
      ext = {}
      ext[MODULE_NAMESPACE] = component

      _.extend(self, ext)

      # Custom callback (Issue #20)
      options.created && options.created.call(self)


  # Rendered callback
  # -----------------
  # Does initial validation

  elements.renderedFactory = (options) ->

    return ->

      component = this[MODULE_NAMESPACE]
      component.validateElement()

      # Custom callback
      # ---------------

      options.rendered && options.rendered.call(this)


  # Template helpers
  # ----------------
  # Brings SimpleSchema functionality and other useful helpers into the template

  elements.helpers =

    value: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.value.get()

    valid: -> # (Use to show positive state on element, like a check mark)
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.valid.get()

    changed: -> # (Use to show or hide things after first valid value change)
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.changed.get()

    isChild: -> # (Use to show or hide things regardless of parent state)
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.isChild

    # These are from SimpleSchema functionality
    # -----------------------------------------

    schema: -> # Use to get allowedValues, max, etc. for this field (Issue #8)
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      if component.schema? and component.field?
        return component.schema._schema[component.field]

    label: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      if component.schema? and component.field?
        return component.schema.label(component.field)

    instructions: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      if component.schema? and component.field?
        return component.schema.keyInstructions(component.field)

    errorMessage: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      if component.schemaContext? and component.field?
        return component.schemaContext.keyErrorMessage(component.field)

    # These are from the parent form block
    # ------------------------------------
    # Default to `false` if no form block exists.

    submitted: -> # (Use to delay showing errors until first submit)
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      if component.isChild
        return component.submitted.get()
      else
        return inst.data.submitted || false # Original passed-in value (allows overwrites)

    loading: -> # (Use to disable elements while submit action is running)
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      if component.isChild
        return component.loading.get()
      else
        return inst.data.loading || false

    success: -> # (Use to hide things after a successful submission)
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      if component.isChild
        return component.success.get()
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
      validationEvent: Match.Optional(String)
      validationValue: Match.Optional(Function)

      # Allow normal callbacks for adding custom data, etc. (Issue #20)
      created: Match.Optional(Function)
      rendered: Match.Optional(Function)
      destroyed: Match.Optional(Function)

    template = Template[obj.template]

    if template
      options = {}
      evt = {}

      for key in ['validationValue', 'created', 'rendered', 'destroyed']
        if _.has(obj, key)
          options[key] = obj[key]

      if _.has(obj, 'validationEvent') # (Issue #33)
        evt[obj.validationEvent + ' .reactive-element'] = (e, t) ->
          t[MODULE_NAMESPACE].validateElement()

      template.created = elements.createdFactory(options)
      template.rendered = elements.renderedFactory(options)

      options.destroyed && template.destroyed = options.destroyed

      template.helpers(elements.helpers)
      template.events(evt)


  # Create a new form block
  # -----------------------
  # Accepts any compatible ReactiveForm form template, and a choice of submit types

  createFormBlock = (obj) ->
    check obj, Match.ObjectIncluding
      template: String
      submitType: String

      # Same as on elements... (Issue #20)
      created: Match.Optional(Function)
      rendered: Match.Optional(Function)
      destroyed: Match.Optional(Function)

    template = Template[obj.template]

    if template
      options = {}
      evt = {}

      for key in ['created', 'rendered', 'destroyed']
        if _.has(obj, key)
          options[key] = obj[key]

      if obj.submitType is 'normal'
        evt['submit form'] = (e, t) ->
          e.preventDefault()
          t[MODULE_NAMESPACE].submit()

      else if obj.submitType is 'enterKey'
        evt['submit form'] = (e, t) ->
          e.preventDefault()

        evt['keypress form'] = (e, t) ->
          if e.which is 13
            e.preventDefault()
            t[MODULE_NAMESPACE].submit()

      template.created = forms.createdFactory(options)

      options.rendered && template.rendered = options.rendered
      options.destroyed && template.destroyed = options.destroyed

      template.helpers(forms.helpers)
      template.events(evt)

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
