<script lang="ts">
  import type { PageData } from './$types';
  
  export let data: PageData;
</script>

<h1>Opt-out Test Page</h1>
<p>{data.message}</p>
<p>Check the console - the load function should NOT show wrapper logs.</p>

<a href="/">Back to home</a>
