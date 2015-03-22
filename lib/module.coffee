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

        # Schema is optional (Issue #27).
        if _.has(data, 'schema') && !Match.test data.schema, Match.Optional(SimpleSchema)
          canWarn && console.warn(errorMessages.schema)

        # Action is required.
        unless _.has(data, 'action') && Match.test data.action, Function
          canWarn && console.warn(errorMessages.action)

        # Initial data is optional.
        dataTest = Match.Optional Match.Where (x) ->
          return !x || _.isObject(x) && !_.isArray(x) && !_.isFunction(x) # (Issue #9, #34)

        if _.has(data, 'data') && !Match.test data.data, dataTest
          canWarn && console.warn(errorMessages.data)

      # States
      # ------
      # Set by the submit method below.

      component.changed   = new ReactiveVar(false)
      component.submitted = new ReactiveVar(false)
      component.failed    = new ReactiveVar(false)
      component.success   = new ReactiveVar(false)
      component.invalid   = new ReactiveVar(false)
      component.loading   = new ReactiveVar(false)

      # State messages
      component.successMessage = new ReactiveVar(null)
      component.failedMessage  = new ReactiveVar(null)

      # Ensure states are mutually exclusive--set with these methods only.
      setExclusive = (activeState, message) ->
        for state in ['success', 'failed', 'loading', 'invalid']
          component[state].set(state is activeState)
        if message && component[activeState + 'Message']
          component[activeState + 'Message'].set(message)

      resetStates = (hard) ->
        component.changed.set(false)
        component.submitted.set(false)
        component.invalid.set(false)
        component.loading.set(false)

        if hard
          component.failed.set(false)
          component.success.set(false)

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

      # Element reactive data
      # ---------------------
      # When elements are wrapped in a form block, store the element's reactive data here.

      # Value format is `fieldName: { value: new ReactiveVar(), dep: new Tracker.Dependency }`
      elementValues = {}

      # Reactively reset all stored element values.
      resetElementValues = ->
        for field, obj of elementValues
          obj.value.set(null)
          obj.dep.changed()

      # Set new reactive value in `elementValues` or get the existing property.
      # Also provide a dependency for element templates to track.
      component.ensureElementValue = (field, value) ->
        return _.has(elementValues, field) && elementValues[field] ||
          elementValues[field] =
            value: new ReactiveVar(value)
            dep: new Tracker.Dependency

      # Set validated value in form data context
      # ----------------------------------------

      component.setValidatedValue = (field, value, fromUserEvent) ->

        # First, opt into setting `changed` if this is a unique update.
        if _.has(validatedValues, field)
          if !_.isEqual(value, validatedValues[field])

            # Set value in form data context, optionally set `changedValues`.
            validatedValues[field] = value

            if fromUserEvent
              changedValues && changedValues[field] = value
              setChanged()

        # If the field doesn't exist in validatedValues yet, add it.
        else
          validatedValues[field] = value

          # If this was a user-enacted change to the data, set `changed`.
          # Initial data and schema-provided data will not trigger `changed` (Issue #46).
          if fromUserEvent
            setChanged()

      # Reset
      # -----

      # Store all the custom reset functions for elements.
      resetFunctions = []

      component.addResetFunction = (func) ->
        resetFunctions.push(func)

      # Reset form.
      resetForm = (hard) ->

        # Always clear values in DOM and reset form/element data contexts.
        for func in resetFunctions
          func()
        validatedValues = {}
        resetElementValues()

        # Reset all form states to init values (false).
        # For hard reset, kill the last success/failed states too.
        resetStates(hard)
        if hard
          component.successMessage.set(null)
          component.failedMessage.set(null)

      # Selectors
      # ---------
      # Track any custom `validationSelector` from elements.

      elementSelectors = ['.reactive-element']

      component.addCustomSelector = (selector) ->
        unless selector in elementSelectors
          elementSelectors.push(selector)

      # Submit
      # ------

      # Validate data and run provided action function
      component.submit = ->
        component.submitted.set(true)

        # Check the schema if we're using SimpleSchema
        # If any values are bad, return without running the action function.
        if _.has(component, 'schemaContext')
          if !!component.schemaContext.invalidKeys().length
            setExclusive('invalid')
            return

        # Invoke loading state until action function returns failed or success.
        setExclusive('loading')

        # Send form elements and callbacks to action function.
        # The action function is bound to validatedValues.
        formElements = self.findAll(elementSelectors.join(', '))
        callbacks =
          success: (message) -> setExclusive('success', message)
          failed:  (message) -> setExclusive('failed',  message)
          reset:      (hard) -> resetForm(hard) # A hard reset clears success/failed state.

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
        schema: _.has(inst.data, 'schema') && inst.data.schema || null
        schemaContext: _.has(component, 'schemaContext') && component.schemaContext || null
        submit: component.submit
        submitted: component.submitted
        loading: component.loading
        success: component.success
        failed: component.failed
        invalid: component.invalid
        changed: component.changed
        ensureElementValue: component.ensureElementValue
        setValidatedValue: component.setValidatedValue
        addResetFunction: component.addResetFunction
        addCustomSelector: component.addCustomSelector
      }

    # These are used as real helpers
    # ------------------------------

    failed: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.failed.get()

    failedMessage: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.failedMessage.get()

    success: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.success.get()

    successMessage: ->
      inst = Template.instance()
      component = inst[MODULE_NAMESPACE]
      return component.successMessage.get()

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

      # Config
      # ------

      component =

        # A field to connect this element with in the schema.
        field: self.data.field || null

        # Initial value from passed-in data in the parent form block.
        initValue: null

        # Allow for remote data changes to pass through silently.
        passThroughData: self.data.passThroughData || options.passThroughData || false

        # Element contributes to parent form block's data context.
        providesData: !self.data.standalone && options.providesData

        # Context passed from parent form block, if exists.
        parentData: null

        # Element is inside a form block.
        isChild: false

        # Contexts to traverse until form block context.
        distance: 0

      # Try setting up with a parent element/form block if not explicitly standalone.
      unless self.data.standalone

        # Traverse contexts to determine if it's a child element or sub-element.
        while component.distance < 6 && !component.isChild

          # Start at 1
          component.distance++

          data = Template.parentData(component.distance)

          # Child element in this context?
          if data && _.has(data, 'context')
            component.isChild = true

            # Move any top-level keys outside of `context` into `context`.
            for key, val of data when key isnt 'context'
              data.context[key] = val

            # Add `context` key as `parentData`.
            component.parentData = data.context

            # Localize parent states and schema (specific items appropriate for use in elements).
            for key in ['submit', 'submitted', 'loading', 'success', 'schema', 'schemaContext']
              component[key] = component.parentData[key] || null

          # Sub-element in this context? Take parent's field.
          else if data && _.has(data, 'field')
            component.field = data.field

      # Basic setup
      # -----------

      # Ok, now we know if it's actually a child.
      if component.isChild

        # If this element has a custom selector, register that with the form block.
        # This is for the `els` argument in the action function.
        if component.providesData && options.validationSelector isnt '.reactive-element'
          component.parentData.addCustomSelector(options.validationSelector)

        component.schema = component.parentData.schema
        component.schemaContext = component.parentData.schemaContext

        if component.parentData.data && _.has(component.parentData.data, component.field)
          component.initValue = component.parentData.data[component.field]

      else
        component.schema = self.data.schema || null
        component.schemaContext = self.data.schema && self.data.schema.newContext() || null

        if self.data.data && _.has(self.data.data, component.field)
          component.initValue = self.data.data[component.field]

      # States
      # ------

      component.valid = new ReactiveVar(true)
      component.changed = new ReactiveVar(false)

      component.schemaContext? && self.autorun ->
        invalid = component.schemaContext.keyIsInvalid(component.field)
        component.valid.set(!invalid)

      # Validation
      # ----------

      validateValue = (val) ->

        # We need an object to validate with--
        object = _.extend({}, component.schemaContext.data) # (Issue #4)
        object[component.field] = val

        # Get true/false for validation (validating against this field only).
        isValid = component.schemaContext.validateOne(object, component.field)

        # Set `valid` property to reflect in templates.
        component.valid.set(isValid)
        return isValid

      # Value
      # -----
      # Track this element's latest validated value, starting with init data

      # Get reactive value and deps from form block if available.
      ensureValue = component.field &&
        component.parentData?.ensureElementValue?(component.field, component.initValue)
      component.value = ensureValue && ensureValue.value || new ReactiveVar(component.initValue)
      component.valueDep = ensureValue && ensureValue.dep || new Tracker.Dependency

      # Save a value--usually after successful validation
      setValue = (value, fromUserEvent) ->

        # Initial value from passed-in data will get validated on render.
        # That shouldn't count as `changed`.
        # This fixes that, (with `fromUserEvent`) along with adding a general idempotency.
        unless _.isEqual(component.value.get(), value)
          component.value.set(value)
          fromUserEvent && component.changed.set(true)

        # Save to a parent form block if possible
        if component.isChild && component.parentData.setValidatedValue?
          component.parentData.setValidatedValue(component.field, value, fromUserEvent)

      # Automatically validate every time the value changes.
      # Because we check `options.providesData` this should only fire once per element.
      # Also, this will only run if we're using SimpleSchema.
      component.providesData && component.schemaContext? && self.autorun ->
        value = component.value.get()

        Tracker.nonreactive ->

          # Use `validateValue` to skip dealing with the DOM (this is below).
          isValid = validateValue(value)

          # Add validated value to parent form block's `validatedValues`
          #
          # XXX We could send data to the form block's context if we knew whether the change
          # came from a user event. Unfortunately, we can't tell here, so we need to send it
          # up before it gets validated.
          #
          # This doesn't actually cause any problems, but it's not ideal--
          # Invalid data should never make its way to the form data context.
          #
          # Need to possibly update how we handle `changed` event.

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
      component.remoteValueChange = new ReactiveVar(false)

      # Ignore the presence of remote changes to the current form's data.
      component.ignoreValueChange = ->
        component.remoteValueChange.set(false)

      # Import and validate remote changes into current form context.
      component.acceptValueChange = ->
        component.remoteValueChange.set(false)
        setValue(component.newRemoteValue.get()) # Set even if invalid. Autorun validates.
        component.valueDep.changed()

      # Store remote data changes without replacing the local value.
      component.newRemoteValue = new ReactiveVar(component.initValue)

      # Track remote data changes reactively.
      self.autorun ->
        data = component.isChild && Template.parentData(component.distance) ||
          Template.currentData()

        if data?.data?[component.field]?
          fieldValue = data.data[component.field]

          # Update reactiveValue without tracking it.
          Tracker.nonreactive ->

            # If the remote value is different from what's in initial data, set `newRemoteValue`.
            # Otherwise, leave it--the user's edits are still just as valid.
            if !_.isEqual(component.value.get(), fieldValue)

              # Allow for remote data changes to pass through without user action.
              # This is important for the experience of some components.
              if component.passThroughData
                setValue(fieldValue)
                component.valueDep.changed()
              else

                # Set value and let us know there's been a remote change.
                component.newRemoteValue.set(fieldValue)
                component.remoteValueChange.set(true)

      # Callback for `validationEvent` trigger
      # --------------------------------------

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

      component.validateElement = (el, fromUserEvent) ->

        # Can't pass in `clean` method if user isn't using SimpleSchema.
        cleanValue = component.schemaContext? && cleanValue || (arg) ->
          return arg

        # Check `instanceof Stopper` to make sure we don't mistake stops for user input.
        Stopper = ->

        # Create a useful context to bind `getValidationValue` to.
        ctx =
          stop: new Stopper()
          validate: (val) ->
            setValue(val, fromUserEvent)
            return this.stop # Prevents automatic validator from running (see below).

        # Call `getValidationValue` bound to a context with `validate` method (Issue #36).
        val = getValidationValue.call(ctx, el, cleanValue, self)

        # You can return `this.stop` if you're running manual validation.
        # Returning the result of `this.validate(val)` does this automatically, too.
        unless val instanceof Stopper
          setValue(val, fromUserEvent)

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
      self = this

      # Only run initial validation if this element provides data (Issue #42).
      component = self[MODULE_NAMESPACE]

      # Find matching element(s) using the proper selector.
      el = self.findAll(options.validationSelector)

      if component.providesData

        # Validate any initial data if this element provides data to schema context.
        el && component.validateElement(el, false)

      # Send reset function to form block so it's called with proper context and element(s).
      options.reset && component.parentData?.addResetFunction? ->
        options.reset.call(self, el)

      options.rendered && options.rendered.call(self)


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
      value = component.newRemoteValue.get()
      return value? && value.toString()

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
      validationEvent: Match.Optional(Match.OneOf(String, [String]))
      validationValue: Match.Optional(Function)
      validationSelector: Match.Optional(String)
      reset: Match.Optional(Function)
      passThroughData: Match.Optional(Boolean)

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

      for key in [
        'validationValue'
        'validationSelector'
        'reset'
        'passThroughData'
        'created'
        'rendered'
        'destroyed'
      ]
        if _.has(obj, key)
          options[key] = obj[key]

      if _.has(obj, 'validationEvent') # (Issue #33)

        # Compile selector in `options`. Allow array for `validationEvent` (Issue #52).
        # -----------------------------------------------------------------------------

        # Use default selector `.reactive-element` if custom selector isn't available.
        options.validationSelector = options.validationSelector || '.reactive-element'

        # Map all events to selector and return a single string.
        selectorWithEvents = Match.test(obj.validationEvent, String) &&
          "#{obj.validationEvent} #{options.validationSelector}" ||
          _.map(obj.validationEvent, (e) -> return "#{e} #{options.validationSelector}").join(', ')

        # Create event handler to pass value through validation.
        evt[selectorWithEvents] = (e, t) ->

          # Flag `fromUserEvent` as true.
          t[MODULE_NAMESPACE].validateElement(e.currentTarget, true)

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
          e.stopPropagation() # Allow nested form blocks.
          t[MODULE_NAMESPACE].submit()

      else if obj.submitType is 'enterKey'
        evt['submit form'] = (e, t) ->
          e.preventDefault()
          e.stopPropagation()

        evt['keypress form'] = (e, t) ->
          if e.which is 13
            e.preventDefault()
            e.stopPropagation()
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