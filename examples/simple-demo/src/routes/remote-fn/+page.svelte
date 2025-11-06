<script lang="ts">
    import { getUser } from "$lib/user.remote";
</script>

Test
{#await getUser() then data}
    <h1>User Info</h1>
    <p>Name: {data.name}</p>
{/await}