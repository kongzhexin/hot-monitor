#!/usr/bin/env node

const baseUrl = process.env.HOT_MONITOR_BASE_URL || 'http://localhost:3000';
const [command, ...args] = process.argv.slice(2);

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `request failed: ${response.status}`);
  }

  return response.json();
}

async function monitorKeywords(query, priority = 'normal', customName = '') {
  const name = customName || `Skill监控:${query}`;
  const create = await request('/api/rules', {
    method: 'POST',
    body: JSON.stringify({
      name,
      type: 'keyword',
      query,
      priority
    })
  });

  const scan = await request('/api/scan', { method: 'POST' });
  const hotspots = await request('/api/hotspots');
  const picked = hotspots.data.filter((item) => item.ruleId === create.data.id).slice(0, 10);

  return {
    createdRule: create.data,
    scan: scan.data,
    hotspots: picked
  };
}

async function discoverTrends(_topic = '') {
  const scan = await request('/api/scan', { method: 'POST' });
  const trends = await request('/api/trends');
  return {
    scan: scan.data,
    trends: trends.data
  };
}

async function validateEvent(query, title, summary, link, source = 'skill-input') {
  const payload = {
    title,
    summary,
    link,
    source,
    publishedAt: new Date().toISOString()
  };

  const result = await request('/api/skills/validate', {
    method: 'POST',
    body: JSON.stringify({ payload, query })
  });

  return result.data;
}

function printHelp() {
  console.log('Usage:');
  console.log('  node agent-skills/skills-cli.mjs monitor_keywords "query" [high|normal] [name]');
  console.log('  node agent-skills/skills-cli.mjs discover_trends [topic]');
  console.log('  node agent-skills/skills-cli.mjs validate_event "query" "title" "summary" "link" [source]');
}

async function main() {
  if (!command) {
    printHelp();
    process.exit(1);
  }

  if (command === 'monitor_keywords') {
    const [query, priority = 'normal', name = ''] = args;
    if (!query) {
      throw new Error('monitor_keywords 需要 query 参数');
    }
    const output = await monitorKeywords(query, priority, name);
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  if (command === 'discover_trends') {
    const [topic = 'AI 编程'] = args;
    const output = await discoverTrends(topic);
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  if (command === 'validate_event') {
    const [query, title, summary, link, source = 'skill-input'] = args;
    if (!query || !title || !summary || !link) {
      throw new Error('validate_event 需要 query/title/summary/link 参数');
    }
    const output = await validateEvent(query, title, summary, link, source);
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  printHelp();
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
