<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types.js';
  
  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>SvelteKit AutoWrap Simple Demo</title>
</svelte:head>

<main>
  <h1>🚀 SvelteKit AutoWrap Demo</h1>
  
  <div class="info">
    <p>Apri la console del browser (F12) per vedere i log automatici!</p>
    <p>Page loaded at: {data.timestamp}</p>
    <p>URL: {data.url}</p>
    <p><a href="/opt-out-test">Test Opt-out Page</a> (senza wrapper)</p>
    <p><a href="/granular-test">Test Configurazione Granulare</a> (load sì, actions no)</p>
  </div>

  <section class="todo-section">
    <h2>📝 Todo List (con Actions)</h2>
    
    <!-- Form per aggiungere nuovo item -->
    <form method="POST" action="?/add" use:enhance>
      <input 
        type="text" 
        name="name" 
        placeholder="Nuovo item..." 
        required 
      />
      <button type="submit">➕ Aggiungi</button>
    </form>

    {#if form?.error}
      <p class="error">❌ {form.error}</p>
    {/if}

    {#if form?.success && form?.item}
      <p class="success">✅ Item "{form.item.name}" aggiunto!</p>
    {/if}

    <!-- Lista items -->
    <div class="items">
      {#each data.items as item}
        <div class="item" class:completed={item.completed}>
          <span>{item.name}</span>
          
          <form method="POST" action="?/toggle" use:enhance>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit">
              {item.completed ? '↩️' : '✅'}
            </button>
          </form>
        </div>
      {/each}
    </div>
  </section>

  <section class="instructions">
    <h2>🔍 Come Funziona</h2>
    <ol>
      <li>Apri la console del browser (F12)</li>
      <li>Ricarica la pagina per vedere il log della <code>load</code> function</li>
      <li>Aggiungi un nuovo item per vedere il log dell'action <code>add</code></li>
      <li>Clicca su ✅ o ↩️ per vedere il log dell'action <code>toggle</code></li>
    </ol>
    
    <p>
      Tutte le funzioni server-side sono automaticamente wrapped dal plugin 
      <strong>vite-plugin-sveltekit-autowrap</strong> senza modificare il codice!
    </p>
  </section>
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }

  .info {
    background: #e3f2fd;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border-left: 4px solid #2196f3;
  }

  .todo-section {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
  }

  form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  button {
    padding: 0.5rem 1rem;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background: #1976d2;
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .item.completed {
    background: #e8f5e8;
    text-decoration: line-through;
    opacity: 0.7;
  }

  .item button {
    min-width: 40px;
    padding: 0.25rem 0.5rem;
  }

  .success {
    color: #4caf50;
    font-weight: bold;
  }

  .error {
    color: #f44336;
    font-weight: bold;
  }

  .instructions {
    background: #f9f9f9;
    padding: 2rem;
    border-radius: 12px;
  }

  .instructions h2 {
    margin-top: 0;
  }

  .instructions ol {
    line-height: 1.6;
  }

  .instructions code {
    background: #e0e0e0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }
</style>
