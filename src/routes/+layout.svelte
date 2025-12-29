<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<div class="min-h-screen bg-background text-foreground">
  {@render children()}
</div>
