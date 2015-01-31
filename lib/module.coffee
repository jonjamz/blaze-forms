
@ReactiveForms = ReactiveForms = do ->





  MODULE_NAMESPACE = 'reactiveForms'





  # Utils
  # ========================================================================================
  # Generic helper functions for use throughout the module.

  canWarn = console?.warn?

  # Log deprecation warning and offer alternative
  deprecatedLogger = (item, alternative) ->
    if canWarn
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
      # Validate passed-in data.

      errorMessages = # (Issue #27, #32)

        schema: "[forms] The `schema` field in a Form Block is optional, but if it exists,
                 it must be an instance of SimpleSchema."

        action: "[forms] The `action` function is missing or invalid in your Form Block.
                 This is a required field--you can't submit your form without it."

        data:   "[forms] The `data` field in a Form Block is optional, but if it exists, it
                 must either be an object or a falsey value."

      self.autorun ->

        # Track reactive changes to data and re-validate.
        data = Template.currentData()

        check data.schema, Match.Where (x) ->
          unless Match.test x, Match.Optional(SimpleSchema)
            canWarn && console.warn(errorMessages.schema)
          return true

        check data.action, Match.Where (x) ->
          unless Match.test x, Function
            canWarn && console.warn(errorMessages.action)
          return true

        check data.data, Match.Where (x) ->
          test = Match.Optional Match.Where (x) ->
            return !x || _.isObject(x) && !_.isArray(x) && !_.isFunction(x) # (Issue #9, #34)
          unless Match.test x, test
            canWarn && console.warn(errorMessages.data)
          return true

      # Basic states
      # ------------
      # Set by the submit method below.

      component.changed   = new Blaze.ReactiveVar(false)
      component.submitted = new Blaze.ReactiveVar(false)
      component.failed    = new Blaze.ReactiveVar(false)
      component.success   = new Blaze.ReactiveVar(false)
      component.invalid   = new Blaze.ReactiveVar(false)
      component.loading   = new Blaze.ReactiveVar(false)

      # Ensure states are mutually exclusive--set with these methods only.
      setState = (activeState) ->
        for state in ['success', 'failed', 'loading', 'invalid']
          state is activeState && component[state].set(true) || component[state].set(false)

      setSuccess = ->
        setState('success')

      setFailed = ->
        setState('failed')

      setLoading = ->
        setState('loading')

      setInvalid = ->
        setState('invalid')

      # Schema
      # ------
      # Set schema if exists (optional).

      if self.data.schema && self.data.schema.newContext
        component.schemaContext = _.extend(self.data.schema.newContext(),
          {data: self.data.data}) # (Issue #4)

      # When a user fixes the invalid fields, clear invalid state
      self.autorun ->
        if _.has(component, 'schemaContext')
          !component.schemaContext.invalidKeys().length && component.invalid.set(false)

      # Changed state--a unique state
      # -----------------------------
      # As `success` represents the end of a form session, a subsequent `change` should
      # initiate a new session, if the UI is still editable.
      setChanged = ->
        component.changed.set(true)

        # Add non-referenced data onto the schema context for validation (Issue #4).
        if _.has(component, 'schemaContext')
          component.schemaContext.data = _.extend({}, validatedValues)

        # If `success` state is active, disable it and `submitted` to refresh the session.
        # Don't let `changed` affect `submitted` except for when `success` is true.
        if component.success.get() is true
          component.success.set(false)
          component.submitted.set(false)

      # Form data context
      # -----------------
      # Store validated element values as local data (can't submit invalid data anyway).

      validatedValues = {}

      # Add `_id` if present, adapting to reactive data changes (Issue #38).
      self.autorun ->
        data = Template.currentData()
        if data.data && _.has(data.data, '_id')
          validatedValues._id = data.data._id

      # When initial data is present, keep track of which fields are modified (Issue #11).
      changedValues = self.data.data && {} || undefined

      # Set validated value to form data context
      # ----------------------------------------

      component.setValidatedValue = (field, value) ->

        # First, opt into setting `changed` if this is a unique update.
        if _.has(validatedValues, field)
          if !_.isEqual(value, validatedValues[field])

            # Set value to form data context, optionally set `changedValues`.
            validatedValues[field] = value
            changedValues && changedValues[field] = value

            setChanged()

        # If the field doesn't exist in validatedValues yet, add it.
        else
          validatedValues[field] = value

          # If initial data was provided--
          # Initial validation passing back that value shouldn't trigger `changed`.
          # Neither should setting `undefined` values for the first time, which is likely
          # the result of validating `undefined` against an optional field (Issue #41).
          if self.data.data
            isInitialData = _.has(self.data.data, field) && _.isEqual(self.data.data[field], value)

            unless isInitialData || _.isUndefined(value)
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
        if _.has(component, 'schemaContext')
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

        # Prevent throwing errors for missing schema/schemaContext (Issue #27)
        schema: _.has(inst.data, 'schema') && inst.data.schema || null
        schemaContext: _.has(component, 'schemaContext') && component.schemaContext || null

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
      if _.has(component, 'schemaContext')
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
      if _.has(component, 'schemaContext')
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

    unchanged: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return !component.changed.get()

    submitted: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.submitted.get()

    unsubmitted: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return !component.submitted.get()





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

      # Support a single context object (Issue #15).
      if parentData && _.has(parentData, 'context')

        # Move any top-level keys outside of `context` into `context`.
        if Match.test(parentData.context, Object)
          for key, val of parentData when key isnt 'context'
            parentData.context[key] = val

        # Give us our new parent data
        parentData = parentData.context

      # Run within a form block or standalone
      # -------------------------------------

      component.isChild = parentData && parentData.submit?

      if component.isChild

        # Localize parent states and schema (specific items appropriate for use in elements).
        for key in ['submit', 'submitted', 'loading', 'success', 'schema', 'schemaContext']
          component[key] = parentData[key] || null

        # Set local initial value if provided by the parent.
        if parentData.data && _.has(parentData.data, component.field)
          initValue = parentData.data[component.field]

      # But if not, run standalone.
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

      # Update non-reactive helper when value changes
      component.valueDep = new Tracker.Dependency

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

      # Support remote changes (Issue #40)
      # ----------------------------------
      # When data is changed remotely during a form session, there are three ways to handle the
      # experience. First, ignore the change and let the user submit their new form. Second,
      # patch in the changes mid-session without any type of notification. Third, notify the
      # user of remote changes and give them the opportunity to add those into the current
      # session (giving them time to save their work elsewhere).
      #
      # `templates:forms` can be configured to support all three of the above options.

      # Track whether the remote value has changed (use this to show a message in the UI).
      component.remoteValueChange = new Blaze.ReactiveVar(false)

      # Ignore the presence of remote changes to the current form's data.
      component.ignoreValueChange = ->
        component.remoteValueChange.set(false)

      # Import and validate remote changes into current form context.
      component.acceptValueChange = ->
        component.remoteValueChange.set(false)
        component.value.set(component.newRemoteValue.get())
        component.valueDep.changed()

        # This is necessary otherwise the new data doesn't show in the DOM.
        Deps.afterFlush ->
          component.validateElement()

      # Store remote data changes without replacing the local value.
      component.newRemoteValue = new Blaze.ReactiveVar(initValue)

      # Track remote data changes reactively.
      self.autorun ->
        data = component.isChild && Template.parentData(1) || Template.currentData()

        if data?.data?[component.field]?
          fieldValue = data.data[component.field]

          # Update reactiveValue without tracking it.
          Tracker.nonreactive ->

            if !_.isEqual(component.value.get(), fieldValue)
              component.newRemoteValue.set(fieldValue)

              if _.isUndefined(component.value.get())
                component.value.set(fieldValue)

              component.remoteValueChange.set(true)

      # Validation
      # ----------

      # Get value to test from `.reactive-element` (user-provided, optionally).
      getValidationValue = options.validationValue || (el, clean, template) ->
        value = $(el).val()
        return clean(value)

      # Wrap the SimpleSchema `clean` function to add the key automatically.
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

          # Get value from DOM element and alter value to avoid validation errors.
          val = getValidationValue(el, cleanValue, self)

          # We need an object to validate with--
          object = _.extend({}, component.schemaContext.data) # (Issue #4)
          object[component.field] = val

          # Get true/false for validation (validating against this field only).
          isValid = component.schemaContext.validateOne(object, component.field)

          # Set `valid` property to reflect in templates.
          component.valid.set(isValid)

          # Set `value` property, locally and on `component.field` on a parent, if valid.
          if isValid is true
            setValidatedValue(val)
            return

        else

          # Can't pass in `clean` method if user isn't using SimpleSchema.
          # Could provide a different utility method in the future for this...
          noop = (arg) ->
            return arg

          val = getValidationValue(el, noop, self)

          # Set the value just for templates--can't validate without a schema.
          setValue(val)
          return

      # Add component to custom namespace (Issue #21).
      ext = {}
      ext[MODULE_NAMESPACE] = component

      _.extend(self, ext)

      # Custom callback (Issue #20)
      options.created && options.created.call(self)


  # Rendered callback
  # -----------------
  # Does initial validation.

  elements.renderedFactory = (options) ->

    return ->

      # Only run initial validation if this element provides data (Issue #42).
      if options.providesData
        component = this[MODULE_NAMESPACE]
        component.validateElement()

      options.rendered && options.rendered.call(this)


  # Template helpers
  # ----------------
  # Brings SimpleSchema functionality and other useful helpers into the template.

  elements.helpers =

    value: -> # Used for most cases
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      component.valueDep.depend() # Reruns only when remote changes have been imported.
      return Tracker.nonreactive ->
        return component.value.get()

    reactiveValue: -> # Updates reactively with each value change (use for UI state).
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.value.get()

    newRemoteValue: -> # Stores any underlying changes in the data, if reactive.
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.newRemoteValue.get()

    remoteValueChange: -> # Has there been any underlying change during this form session?
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.remoteValueChange.get()

    valid: -> # (Use to show positive state on element, like a check mark).
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.valid.get()

    changed: -> # (Use to show or hide things after first valid value change).
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.changed.get()

    unchanged: -> # (Use to show or hide things after first valid value change).
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return !component.changed.get()

    isChild: -> # (Use to show or hide things regardless of parent state).
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.isChild

    # These are from SimpleSchema functionality
    # -----------------------------------------

    schema: -> # Use to get allowedValues, max, etc. for this field (Issue #8).
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

    submitted: -> # (Use to delay showing errors until first submit).
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      if component.isChild
        return component.submitted.get()
      else
        return inst.data.submitted || false # Original passed-in value (allows overwrites).

    unsubmitted: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      if component.isChild
        return !component.submitted.get()
      else
        return inst.data.unsubmitted || false

    loading: -> # (Use to disable elements while submit action is running).
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      if component.isChild
        return component.loading.get()
      else
        return inst.data.loading || false

    success: -> # (Use to hide things after a successful submission).
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
  # Accepts any compatible ReactiveForm element template, and a choice of validation events.

  createElement = (obj) ->
    check obj, Match.ObjectIncluding
      template: String
      validationEvent: Match.Optional(String)
      validationValue: Match.Optional(Function)

      # Allow normal callbacks for adding custom data, etc. (Issue #20).
      created: Match.Optional(Function)
      rendered: Match.Optional(Function)
      destroyed: Match.Optional(Function)

    template = Template[obj.template]

    if template
      evt = {}
      options =

        # Use this to reduce demands from non-input (nested) elements (Issue #42).
        providesData: false

      for key in ['validationValue', 'created', 'rendered', 'destroyed']
        if _.has(obj, key)
          options[key] = obj[key]

      if _.has(obj, 'validationEvent') # (Issue #33)
        evt[obj.validationEvent + ' .reactive-element'] = (e, t) ->
          t[MODULE_NAMESPACE].validateElement()

        # It has `validationEvent`, so assume it tracks events and inputs data.
        options.providesData = true

      template.created = elements.createdFactory(options)
      template.rendered = elements.renderedFactory(options)

      options.destroyed && template.destroyed = options.destroyed

      template.helpers(elements.helpers)
      template.events(evt)


  # Create a new form block
  # -----------------------
  # Accepts any compatible ReactiveForm form template, and a choice of submit types.

  createFormBlock = (obj) ->
    check obj, Match.ObjectIncluding
      template: String
      submitType: String

      # Same as on elements... (Issue #20).
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
    namespace: MODULE_NAMESPACE # (Issue #43)
  }
