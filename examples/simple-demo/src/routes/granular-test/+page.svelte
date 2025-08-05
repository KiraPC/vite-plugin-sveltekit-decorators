<script lang="ts">
  import type { ActionData, PageData } from './$types';
  
  export let data: PageData;
  export let form: ActionData;
</script>

<h1>Test Configurazione Granulare</h1>
<p>{data.message}</p>
<p>Controlla i log della console: load è wrappata, actions no!</p>

<div>
  <h2>Test Actions (non wrappate)</h2>
  
  <form method="POST" action="?/create">
    <input name="name" placeholder="Nome item" required />
    <button type="submit">Create (non wrappata)</button>
  </form>
  
  <form method="POST" action="?/delete">
    <button type="submit">Delete (non wrappata)</button>
  </form>
</div>

{#if form?.success}
  <p style="color: green;">✅ Action completata!</p>
{/if}

<a href="/">Torna alla home</a>
