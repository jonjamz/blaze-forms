## Examples - Form Blocks

### Hide Submit Button Until Valid

Use `{{invalidCount}}` for this because it changes in real-time as Element values change.

```handlebars
<template name="myFormBlock">
  <form>

    {{> UI.contentBlock
        data=data
        form=form
    }}

    <p>
      {{#unless invalidCount}}
        <button type="submit">Submit</button>
      {{/unless}}

      <span>
        {{#if loading}}
          Loading...
        {{/if}}

        {{#if invalid}}
          Can't submit! There are {{invalidCount}} invalid fields!
        {{/if}}

        {{#if failed}}
          There was a problem submitting the form!
        {{/if}}

        {{#if success}}
          Success! Form submitted (to nowhere)
        {{/if}}
      </span>
    </p>

  </form>
</template>
```