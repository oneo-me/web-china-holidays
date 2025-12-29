<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let selectedYear = $state(new Date().getFullYear());
  let showSubscribeInfo = $state(false);

  const years = $derived(
    Object.keys(data.eventsByYear)
      .map(Number)
      .sort((a, b) => a - b),
  );
  const currentYearEvents = $derived(data.eventsByYear[selectedYear] || []);

  const monthNames = [
    '一月',
    '二月',
    '三月',
    '四月',
    '五月',
    '六月',
    '七月',
    '八月',
    '九月',
    '十月',
    '十一月',
    '十二月',
  ];

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function getWeekday(dateStr: string): string {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const date = new Date(dateStr);
    return weekdays[date.getDay()];
  }

  function getEventBadge(event: {
    isHoliday?: boolean;
    isWorkday?: boolean;
    source: string;
  }) {
    if (event.isHoliday)
      return { text: '休', class: 'bg-green-100 text-green-800' };
    if (event.isWorkday)
      return { text: '班', class: 'bg-orange-100 text-orange-800' };
    if (event.source === 'extra')
      return { text: '补', class: 'bg-blue-100 text-blue-800' };
    return null;
  }

  async function copyToClipboard() {
    const url = `${window.location.origin}/calendars.ics`;
    await navigator.clipboard.writeText(url);
    alert('订阅链接已复制！');
  }
</script>

<svelte:head>
  <title>中国节假日日历</title>
  <meta
    name="description"
    content="中国节假日日历订阅服务，包含法定节假日、调休安排及更多节日" />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <header class="mb-8">
    <h1 class="text-3xl font-bold mb-2">中国节假日日历</h1>
    <p class="text-muted-foreground">
      包含法定节假日、调休安排、西方节日、网络节日及传统节日
    </p>
  </header>

  <!-- 订阅卡片 -->
  <div class="bg-card border rounded-lg p-6 mb-8">
    <h2 class="text-xl font-semibold mb-4">订阅日历</h2>
    <div class="flex flex-col sm:flex-row gap-4">
      <input
        type="text"
        readonly
        value="{typeof window !== 'undefined' ? window.location.origin : ''}/calendars.ics"
        class="flex-1 px-4 py-2 bg-muted border rounded-md text-sm font-mono" />
      <button
        onclick={copyToClipboard}
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
        复制链接
      </button>
    </div>

    <button
      onclick={() => showSubscribeInfo = !showSubscribeInfo}
      class="mt-4 text-sm text-muted-foreground hover:text-foreground underline">
      {showSubscribeInfo ? '收起订阅说明' : '如何订阅？'}
    </button>

    {#if showSubscribeInfo}
      <div class="mt-4 p-4 bg-muted rounded-md text-sm">
        <h3 class="font-semibold mb-2">iOS / macOS 日历</h3>
        <ol class="list-decimal list-inside space-y-1 mb-4">
          <li>打开"设置" → "日历" → "账户"</li>
          <li>选择"添加账户" → "其他"</li>
          <li>选择"添加已订阅的日历"</li>
          <li>粘贴上方的订阅链接</li>
        </ol>

        <h3 class="font-semibold mb-2">Google Calendar</h3>
        <ol class="list-decimal list-inside space-y-1">
          <li>打开 Google Calendar 网页版</li>
          <li>点击左侧"其他日历"旁的"+"</li>
          <li>选择"通过网址添加"</li>
          <li>粘贴上方的订阅链接</li>
        </ol>
      </div>
    {/if}
  </div>

  <!-- 统计信息 -->
  {#if data.error}
    <div
      class="bg-destructive/10 border border-destructive rounded-lg p-4 mb-8">
      <p class="text-destructive">{data.error}</p>
    </div>
  {:else}
    <div class="flex gap-4 mb-6 flex-wrap">
      <div class="bg-card border rounded-lg px-4 py-2">
        <span class="text-muted-foreground text-sm">总计</span>
        <span class="ml-2 font-semibold">{data.totalCount}个节日</span>
      </div>
      <div class="bg-card border rounded-lg px-4 py-2">
        <span class="text-muted-foreground text-sm">当年</span>
        <span class="ml-2 font-semibold">{currentYearEvents.length}个节日</span>
      </div>
    </div>
  {/if}

  <!-- 年份选择 -->
  <div class="flex gap-2 mb-6 flex-wrap">
    {#each years as year}
      <button
        onclick={() => selectedYear = year}
        class="px-4 py-2 rounded-md transition-colors {selectedYear === year
          ? 'bg-primary text-primary-foreground'
          : 'bg-card border hover:bg-muted'}">
        {year}
      </button>
    {/each}
  </div>

  <!-- 节日列表 -->
  <div class="space-y-2">
    {#each currentYearEvents as event (event.uid)}
      {@const badge = getEventBadge(event)}
      <div
        class="flex items-center gap-4 p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors">
        <div class="w-20 text-sm text-muted-foreground">
          {formatDate(event.date)}
        </div>
        <div class="w-12 text-sm text-muted-foreground">
          {getWeekday(event.date)}
        </div>
        <div class="flex-1 font-medium">{event.summary}</div>
        {#if badge}
          <span class="px-2 py-0.5 text-xs rounded {badge.class}">
            {badge.text}
          </span>
        {/if}
        {#if event.description}
          <span class="text-xs text-muted-foreground hidden sm:inline">
            {event.description}
          </span>
        {/if}
      </div>
    {/each}
  </div>

  <!-- 图例 -->
  <div class="mt-8 p-4 bg-muted rounded-lg">
    <h3 class="font-semibold mb-2">图例说明</h3>
    <div class="flex flex-wrap gap-4 text-sm">
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 text-xs rounded bg-green-100 text-green-800"
          >休</span
        >
        <span>法定假日</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-800"
          >班</span
        >
        <span>调休上班</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800"
          >补</span
        >
        <span>补充节日</span>
      </div>
    </div>
  </div>

  <footer class="mt-12 text-center text-sm text-muted-foreground">
    <p>数据来源: Apple iCloud 中国节假日日历 + 补充节日</p>
  </footer>
</div>
