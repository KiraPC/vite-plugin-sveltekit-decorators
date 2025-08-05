<script lang="ts">
  import { enhance } from '$app/forms';
  
  export let data;
  export let form;
</script>

<svelte:head>
  <title>SvelteKit AutoWrap Simple Demo</title>
</svelte:head>

<main>
  <h1>🚀 SvelteKit AutoWrap Demo</h1>
  
  <div class="info">
    <p>Open the browser console (F12) to see automatic logs!</p>
    <p>Page loaded at: {data.timestamp}</p>
    <p>URL: {data.url}</p>
    <p><a href="/opt-out-test">Test Opt-out Page</a> (without wrapper)</p>
    <p><a href="/granular-test">Test Granular Configuration</a> (load yes, actions no)</p>
  </div>

  <section class="todo-section">
    <h2>📝 Todo List (with Actions)</h2>
    
    <!-- Form to add new item -->
    <form method="POST" action="?/add" use:enhance>
      <input 
        type="text" 
        name="name" 
        placeholder="New item..." 
        required 
      />
      <button type="submit">➕ Add</button>
    </form>

    {#if form?.error}
      <p class="error">❌ {form.error}</p>
    {/if}

    {#if form?.success && form?.item}
      <p class="success">✅ Item "{form.item.name}" added!</p>
    {/if}

    <!-- Items list -->
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
    <h2>🔍 How It Works</h2>
    <ol>
      <li>Open the browser console (F12)</li>
      <li>Reload the page to see the <code>load</code> function log</li>
      <li>Add a new item to see the <code>add</code> action log</li>
      <li>Click on ✅ or ↩️ to see the <code>toggle</code> action log</li>
    </ol>
    
    <p>
      All server-side functions are automatically wrapped by the 
      <strong>vite-plugin-sveltekit-autowrap</strong> plugin without modifying the code!
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
