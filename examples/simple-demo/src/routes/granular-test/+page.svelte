<script lang="ts">
  export let data;
  export let form;
</script>

<h1>Granular Configuration Test</h1>
<p>{data.message}</p>
<p>Check console logs: load is wrapped, actions are not!</p>

<div>
  <h2>Test Actions (not wrapped)</h2>
  
  <form method="POST" action="?/create">
    <input name="name" placeholder="Item name" required />
    <button type="submit">Create (not wrapped)</button>
  </form>
  
  <form method="POST" action="?/delete">
    <button type="submit">Delete (not wrapped)</button>
  </form>
</div>

{#if form?.success}
  <p style="color: green;">✅ Action completed!</p>
{/if}

<a href="/">Back to home</a>
