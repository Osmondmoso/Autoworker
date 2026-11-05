import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { steelClient } from './server/steel.ts';
import { agentManager } from './server/agent.ts';
import { skillsRegistry } from './server/skills/registry.ts';
import { getNvidiaApiKey, setNvidiaApiKey } from './server/llm.ts';
import { conversationManager } from './server/conversations.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health and Status Check
app.get('/api/health', async (_req, res) => {
  const nvKey = getNvidiaApiKey();
  const maskedNvKey = nvKey ? (nvKey.slice(0, 6) + '...' + nvKey.slice(-4)) : '';
  try {
    const sessions = await steelClient.listSessions();
    res.json({
      status: 'ok',
      steelConnected: true,
      sessionsCount: Array.isArray(sessions) ? sessions.length : (sessions?.sessions?.length || 0),
      geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
      nvidiaKeyConfigured: !!nvKey,
      nvidiaModel: 'nvidia/nemotron-3-ultra-550b-a55b',
      maskedNvidiaKey: maskedNvKey,
      steelKeyConfigured: !!steelClient.getApiKey(),
      maskedKey: steelClient.getApiKey().slice(0, 7) + '...' + steelClient.getApiKey().slice(-4),
    });
  } catch (err: any) {
    res.json({
      status: 'warning',
      steelConnected: false,
      error: err.message,
      geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
      nvidiaKeyConfigured: !!nvKey,
      nvidiaModel: 'nvidia/nemotron-3-ultra-550b-a55b',
      maskedNvidiaKey: maskedNvKey,
      steelKeyConfigured: !!steelClient.getApiKey(),
    });
  }
});

// Update Steel API Key
app.post('/api/config/key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'API key is required' });
  }
  steelClient.setApiKey(apiKey.trim());
  res.json({
    success: true,
    maskedKey: apiKey.slice(0, 7) + '...' + apiKey.slice(-4),
  });
});

// Update NVIDIA API Key
app.post('/api/config/nvidia-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'API key is required' });
  }
  setNvidiaApiKey(apiKey.trim());
  res.json({
    success: true,
    maskedKey: apiKey.slice(0, 6) + '...' + apiKey.slice(-4),
  });
});

// List Sessions
app.get('/api/sessions', async (_req, res) => {
  try {
    const list = await steelClient.listSessions();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Session
app.post('/api/sessions/create', async (req, res) => {
  try {
    const session = await steelClient.createSession(req.body);
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Session
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const session = await steelClient.getSession(req.params.id);
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Release Session
app.post('/api/sessions/:id/release', async (req, res) => {
  try {
    const success = await steelClient.releaseSession(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manual Interactive Action
app.post('/api/sessions/:id/action', async (req, res) => {
  try {
    const result = await agentManager.performManualAction(req.params.id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Run Autonomous Agent Task
app.post('/api/agent/run', async (req, res) => {
  try {
    const { goal, initialUrl, maxSteps, autoRelease, existingSessionId } = req.body;
    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ error: 'Goal is required' });
    }

    const task = await agentManager.runTask({
      goal: goal.trim(),
      initialUrl: initialUrl?.trim(),
      maxSteps: maxSteps ? parseInt(maxSteps, 10) : 10,
      autoRelease: !!autoRelease,
      existingSessionId,
    });

    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List Recent Tasks
app.get('/api/agent/tasks', (_req, res) => {
  res.json(agentManager.getAllTasks());
});

// Get Single Task Status
app.get('/api/agent/task/:taskId', (req, res) => {
  const task = agentManager.getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// SSE Streaming for Real-Time Agent Progress
app.get('/api/agent/stream/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = agentManager.getTask(taskId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial task snapshot if already exists
  if (task) {
    res.write(`data: ${JSON.stringify({ type: 'task_snapshot', payload: task })}\n\n`);
  }

  // Subscribe to live events
  const unsubscribe = agentManager.subscribe(taskId, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// Stop Task
app.post('/api/agent/stop/:taskId', async (req, res) => {
  try {
    await agentManager.stopTask(req.params.taskId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Pause Task
app.post('/api/agent/pause/:taskId', async (req, res) => {
  try {
    await agentManager.pauseTask(req.params.taskId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Resume Task
app.post('/api/agent/resume/:taskId', async (req, res) => {
  try {
    await agentManager.resumeTask(req.params.taskId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Consequential Approval Resolution
app.post('/api/agent/approval/:taskId', (req, res) => {
  try {
    const { approved } = req.body;
    const ok = agentManager.resolveApproval(req.params.taskId, !!approved);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Conversation Management Endpoints
app.get('/api/conversations', (_req, res) => {
  res.json(conversationManager.getAll());
});

app.get('/api/conversations/active', (_req, res) => {
  res.json(conversationManager.getOrCreateDefault());
});

app.post('/api/conversations', (req, res) => {
  const { title } = req.body;
  const conv = conversationManager.createConversation(title);
  res.json(conv);
});

app.get('/api/conversations/:id', (req, res) => {
  const conv = conversationManager.get(req.params.id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json(conv);
});

app.delete('/api/conversations/:id', (req, res) => {
  const success = conversationManager.deleteConversation(req.params.id);
  res.json({ success });
});

app.post('/api/conversations/:id/messages', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const resultMsg = await conversationManager.processUserMessage(req.params.id, message);
    const updatedConv = conversationManager.get(req.params.id);
    res.json({ message: resultMsg, conversation: updatedConv });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Skills Registry Endpoints
app.get('/api/skills', (_req, res) => {
  try {
    const list = skillsRegistry.getAllSkills();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/skills/:id', (req, res) => {
  try {
    const skill = skillsRegistry.getSkill(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json(skill);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/skills/:id/toggle', (req, res) => {
  try {
    const { active } = req.body;
    const ok = skillsRegistry.toggleSkillStatus(req.params.id, active);
    res.json({ success: ok, skill: skillsRegistry.getSkill(req.params.id) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/skills/:id/approve', (req, res) => {
  try {
    const updated = skillsRegistry.approveSkill(req.params.id);
    res.json({ success: true, skill: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/skills/:id', (req, res) => {
  try {
    const ok = skillsRegistry.deleteCustomSkill(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/skills/propose', (req, res) => {
  try {
    const proposed = skillsRegistry.proposeNewSkill(req.body);
    res.json({ success: true, skill: proposed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

import fs from 'fs';

// Vite Middleware or Static Production Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Development SPA HTML fallback
    app.use('*', async (req, res, next) => {
      // Ignore API routes so they fall through to 404 if unmatched
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Steel Agent Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
