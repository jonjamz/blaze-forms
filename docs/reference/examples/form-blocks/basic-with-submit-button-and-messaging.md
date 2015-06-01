## Examples - Form Blocks

### Basic With Submit Button and Messaging

The four states used for messaging below are exclusive. Only one will ever appear at a time.

```handlebars
<template name="myFormBlock">
  <form>

    {{> UI.contentBlock
        data=data
        form=form
    }}

    <p>
      <button type="submit">Submit</button>
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