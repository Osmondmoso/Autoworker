import fs from 'fs';
import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import { steelClient } from './steel.ts';
import { skillsRegistry } from './skills/registry.ts';
import { skillVerifier } from './skills/verifier.ts';
import { generateAgentLLM } from './llm.ts';
import type { 
  ActiveTask, 
  AgentEvent, 
  AgentStep, 
  ConsequentialApprovalRequest, 
  SkillDefinition, 
  TaskPlanItem, 
  TaskReport 
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

export class AgentManager {
  private tasks: Map<string, ActiveTask> = new Map();
  private eventListeners: Map<string, Set<(event: AgentEvent) => void>> = new Map();
  private activeBrowsers: Map<string, Browser> = new Map();
  private pendingApprovals: Map<string, (approved: boolean) => void> = new Map();

  constructor() {
    this.ensureDataDir();
    this.loadTasksFromDisk();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('Failed to create data directory for tasks:', err);
    }
  }

  private loadTasksFromDisk() {
    try {
      if (fs.existsSync(TASKS_FILE)) {
        const raw = fs.readFileSync(TASKS_FILE, 'utf-8');
        const list: ActiveTask[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((t) => {
            // If server restarted while task was in 'running' state, mark as stopped or paused
            if (t.status === 'running' || t.status === 'planning') {
              t.status = 'paused';
            }
            this.tasks.set(t.id, t);
          });
          console.log(`[Tasks] Loaded ${this.tasks.size} persistent tasks from disk.`);
        }
      }
    } catch (err) {
      console.warn('Failed to load tasks from disk:', err);
    }
  }

  saveTasksToDisk() {
    try {
      this.ensureDataDir();
      const list = Array.from(this.tasks.values());
      // Sanitize screenshots to keep file lightweight
      const sanitized = list.map((t) => ({
        ...t,
        steps: (t.steps || []).map((s) => ({
          ...s,
          screenshot: undefined, // drop historical step screenshots from disk to keep under 1MB
        })),
        latestScreenshot: t.latestScreenshot ? (t.latestScreenshot.length > 300000 ? t.latestScreenshot.slice(0, 100) + '...' : t.latestScreenshot) : undefined,
      }));
      fs.writeFileSync(TASKS_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Failed to save tasks to disk:', err);
    }
  }

  getTask(taskId: string): ActiveTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): ActiveTask[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  subscribe(taskId: string, listener: (event: AgentEvent) => void): () => void {
    if (!this.eventListeners.has(taskId)) {
      this.eventListeners.set(taskId, new Set());
    }
    this.eventListeners.get(taskId)!.add(listener);

    return () => {
      const listeners = this.eventListeners.get(taskId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(taskId);
        }
      }
    };
  }

  private emit(taskId: string, event: AgentEvent) {
    const listeners = this.eventListeners.get(taskId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(`Error notifying listener for task ${taskId}:`, err);
        }
      });
    }
  }

  async resolveApproval(taskId: string, approved: boolean) {
    const resolver = this.pendingApprovals.get(taskId);
    if (resolver) {
      this.pendingApprovals.delete(taskId);
      const task = this.tasks.get(taskId);
      if (task) {
        task.pendingApproval = undefined;
        task.status = approved ? 'running' : 'paused';
      }

      this.emit(taskId, {
        type: 'approval_resolved',
        taskId,
        timestamp: new Date().toISOString(),
        payload: { approved },
      });

      resolver(approved);
    }
  }

  private waitForApproval(taskId: string, request: ConsequentialApprovalRequest): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'waiting_approval';
      task.pendingApproval = request;
    }

    this.emit(taskId, {
      type: 'approval_required',
      taskId,
      timestamp: new Date().toISOString(),
      payload: request,
    });

    return new Promise((resolve) => {
      this.pendingApprovals.set(taskId, resolve);
    });
  }

  async stopTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'stopped';
    const browser = this.activeBrowsers.get(taskId);
    if (browser) {
      try {
        if (browser.connected) {
          await browser.disconnect();
        }
      } catch (err) {
        console.warn('Error disconnecting browser on stop:', err);
      }
      this.activeBrowsers.delete(taskId);
    }

    // Cancel any waiting approvals
    const resolver = this.pendingApprovals.get(taskId);
    if (resolver) {
      this.pendingApprovals.delete(taskId);
      resolver(false);
    }

    if (task.sessionId && task.autoRelease) {
      await steelClient.releaseSession(task.sessionId);
    }

    this.emit(taskId, {
      type: 'task_stopped',
      taskId,
      timestamp: new Date().toISOString(),
      payload: { message: 'Task stopped by user' },
    });
  }

  async pauseTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task && (task.status === 'running' || task.status === 'waiting_approval')) {
      task.status = 'paused';
      this.emit(taskId, {
        type: 'task_paused',
        taskId,
        timestamp: new Date().toISOString(),
        payload: { message: 'Task paused. You can interact with the live browser.' },
      });
    }
  }

  async resumeTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'paused') {
      task.status = 'running';
      this.emit(taskId, {
        type: 'task_resumed',
        taskId,
        timestamp: new Date().toISOString(),
        payload: { message: 'Task resumed.' },
      });
    }
  }

  async runTask(params: {
    goal: string;
    initialUrl?: string;
    maxSteps?: number;
    autoRelease?: boolean;
    existingSessionId?: string;
  }): Promise<ActiveTask> {
    const taskId = 'task_' + Math.random().toString(36).substring(2, 10);
    const maxSteps = params.maxSteps || 10;
    const autoRelease = params.autoRelease ?? false;

    const task: ActiveTask = {
      id: taskId,
      goal: params.goal,
      initialUrl: params.initialUrl,
      status: 'planning',
      createdAt: new Date().toISOString(),
      currentStepIndex: 0,
      steps: [],
      maxSteps,
      autoRelease,
      selectedSkills: [],
    };

    this.tasks.set(taskId, task);
    this.saveTasksToDisk();

    // Run execution asynchronously
    this.executeAutonomousLoop(task, params.existingSessionId).catch((err) => {
      console.error(`Task ${taskId} execution failed:`, err);
      task.status = 'failed';
      task.error = err.message || 'Unknown error during execution';
      this.saveTasksToDisk();
      this.emit(taskId, {
        type: 'task_failed',
        taskId,
        timestamp: new Date().toISOString(),
        payload: { error: task.error },
      });
    });

    return task;
  }

  private async executeAutonomousLoop(task: ActiveTask, existingSessionId?: string) {
    let sessionData: any;

    if (existingSessionId) {
      sessionData = await steelClient.getSession(existingSessionId);
    } else {
      sessionData = await steelClient.createSession({
        sessionTimeout: 600000, // 10 minutes
        dimensions: { width: 1280, height: 800 },
        debugConfig: { interactive: true, systemCursor: true },
      });
    }

    task.sessionId = sessionData.id;
    task.sessionViewerUrl = sessionData.sessionViewerUrl || `https://app.steel.dev/sessions/${sessionData.id}`;
    task.debugUrl = sessionData.debugUrl;
    task.websocketUrl = sessionData.websocketUrl;
    task.status = 'running';

    this.emit(task.id, {
      type: 'session_ready',
      taskId: task.id,
      timestamp: new Date().toISOString(),
      payload: {
        sessionId: task.sessionId,
        sessionViewerUrl: task.sessionViewerUrl,
        debugUrl: task.debugUrl,
        websocketUrl: task.websocketUrl,
      },
    });

    console.log(`[Agent ${task.id}] Connected to Steel session ${task.sessionId}`);

    // Connect Puppeteer to Steel
    const browser = await puppeteer.connect({
      browserWSEndpoint: sessionData.websocketUrl,
      defaultViewport: { width: 1280, height: 800 },
    });
    this.activeBrowsers.set(task.id, browser);

    const pages = await browser.pages();
    let page: Page = pages.length > 0 ? pages[0] : await browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 800 });
    } catch {}

    const isAdUrl = (u: string) => /aliexpress|shopee|bet365|doubleclick|adservice|popunder|casino|betting|monetag|adsterra/i.test(u);

    // Auto-track new tabs or popup targets with ad-isolation guardrail
    browser.on('targetcreated', async (target) => {
      if (target.type() === 'page') {
        try {
          const newP = await target.page();
          if (newP && !newP.isClosed()) {
            const targetUrl = newP.url() || target.url();
            if (isAdUrl(targetUrl)) {
              console.log(`[Browser Security] Intercepted and closed ad popup tab: ${targetUrl}`);
              await newP.close().catch(() => {});
            } else {
              page = newP;
              await page.setViewport({ width: 1280, height: 800 }).catch(() => {});
              await page.bringToFront().catch(() => {});
            }
          }
        } catch {}
      }
    });

    // Safe helper to obtain currently active open page
    const getSafePage = async (): Promise<Page | null> => {
      if (!browser.connected) return null;
      if (page && !page.isClosed() && !isAdUrl(page.url())) return page;
      try {
        const currentPages = await browser.pages();
        // Close any ad popups that opened silently
        for (const p of currentPages) {
          if (!p.isClosed() && isAdUrl(p.url())) {
            await p.close().catch(() => {});
          }
        }
        
        const remainingPages = await browser.pages();
        for (let i = remainingPages.length - 1; i >= 0; i--) {
          if (!remainingPages[i].isClosed()) {
            page = remainingPages[i];
            return page;
          }
        }
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 }).catch(() => {});
        return page;
      } catch {
        return null;
      }
    };

    // Safe helper to capture screenshot without TargetCloseError throwing
    const captureSafeScreenshot = async (): Promise<string | undefined> => {
      try {
        if (!browser.connected) return undefined;
        const activePage = await getSafePage();
        if (!activePage || activePage.isClosed()) return undefined;
        return await activePage.screenshot({ 
          encoding: 'base64', 
          type: 'jpeg', 
          quality: 80 
        });
      } catch (err: any) {
        const msg = err?.message || '';
        if (!msg.includes('Target closed') && !msg.includes('Session closed')) {
          console.warn('Screenshot capture skipped:', msg);
        }
        return undefined;
      }
    };

    // =========================================================================
    // LIFECYCLE STAGE 1: UNDERSTAND OBJECTIVE & SELECT SKILLS
    // =========================================================================
    const activeSkillsList = skillsRegistry.getActiveSkills();
    const skillsCatalogSummary = activeSkillsList.map(s => 
      `- ID: "${s.id}" | Name: "${s.name}" | Category: "${s.category}" | Permission: "${s.permissionLevel}"\n  Description: ${s.description}\n  Activation: ${s.activationConditions.join('; ')}`
    ).join('\n\n');

    let selectedSkills: SkillDefinition[] = [];

    try {
      const skillSelectionPrompt = `You are the master coordinator for an autonomous browser agent.
Analyze the user's objective and select the most appropriate skill(s) from the available Skills Registry.

User Goal: "${task.goal}"
Initial URL: "${task.initialUrl || 'None specified'}"

Available Active Skills:
${skillsCatalogSummary}

Evaluate:
1. Which skills directly cover this task? (You may select multiple skills to coordinate, e.g. web-research + data-analysis, or forms-applications + browser-security).
2. Is this an unfamiliar task with a missing capability? If so, draft a new proposed skill.

Respond ONLY with a JSON object in this schema:
{
  "selectedSkillIds": ["skill-id-1", ...],
  "selectionRationale": "Brief explanation of why these skills were chosen",
  "isUnfamiliar": boolean,
  "proposedSkill": { // Optional, provide ONLY if isUnfamiliar is true
    "id": "suggested-kebab-id",
    "name": "Skill Name",
    "category": "Category",
    "description": "Clear description",
    "activationConditions": ["condition 1", "condition 2"],
    "requiredTools": ["navigate", "click", "type", "extract"],
    "procedures": [
      { "id": 1, "action": "navigate", "description": "...", "expectedEvidence": "..." }
    ],
    "errorRecovery": ["recovery 1"],
    "verificationCriteria": ["criteria 1"],
    "permissionLevel": "read_only" | "browser_interaction" | "form_preparation" | "file_modification" | "external_submission" | "consequential_action",
    "rationale": "Why this new skill is proposed"
  }
}`;

      const skillText = await generateAgentLLM({
        prompt: skillSelectionPrompt,
        jsonResponse: true,
      });

      const parsedSelection = JSON.parse(skillText || '{}');
      const chosenIds: string[] = Array.isArray(parsedSelection.selectedSkillIds) ? parsedSelection.selectedSkillIds : [];
      
      selectedSkills = activeSkillsList.filter(s => chosenIds.includes(s.id));
      if (selectedSkills.length === 0) {
        // Fallback to default web research if none explicitly matched
        const defaultSkill = skillsRegistry.getSkill('web-research');
        if (defaultSkill) selectedSkills.push(defaultSkill);
      }

      task.selectedSkills = selectedSkills.map(s => s.id);
      task.activeSkillId = selectedSkills[0]?.id;

      this.emit(task.id, {
        type: 'skills_selected',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        payload: {
          skills: selectedSkills.map(s => ({ id: s.id, name: s.name, category: s.category, permission: s.permissionLevel })),
          rationale: parsedSelection.selectionRationale || 'Matched based on activation conditions.',
        },
      });

      // Handle Skill Learning / Proposal if Gemini identified an unfamiliar capability
      if (parsedSelection.isUnfamiliar && parsedSelection.proposedSkill) {
        try {
          const proposed = skillsRegistry.proposeNewSkill(parsedSelection.proposedSkill);
          this.emit(task.id, {
            type: 'skill_proposed',
            taskId: task.id,
            timestamp: new Date().toISOString(),
            payload: { skill: proposed },
          });
          console.log(`[Skills Engine] Proposed new skill for review: ${proposed.name} (${proposed.id})`);
        } catch (err: any) {
          console.warn('Error saving proposed skill:', err.message);
        }
      }
    } catch (err) {
      console.warn('Error in skill selection phase:', err);
      const defaultSkill = skillsRegistry.getSkill('web-research');
      if (defaultSkill) selectedSkills = [defaultSkill];
      task.selectedSkills = selectedSkills.map(s => s.id);
    }

    // =========================================================================
    // LIFECYCLE STAGE 2: LOAD INSTRUCTIONS & CREATE TASK EXECUTION PLAN
    // =========================================================================
    const compiledSkillInstructions = selectedSkills.map(s => `### SKILL: ${s.name} (v${s.version}) [Permission: ${s.permissionLevel}]
${s.description}

Standard Procedures:
${s.procedures.map(p => `  ${p.id}. [${p.action.toUpperCase()}] ${p.description} (Evidence: ${p.expectedEvidence})`).join('\n')}

Verification Criteria:
${s.verificationCriteria.map(v => `  - ${v}`).join('\n')}

Error Recovery:
${s.errorRecovery.map(e => `  - ${e}`).join('\n')}
`).join('\n\n');

    try {
      const planPrompt = `You are an elite autonomous browser planning engine.
Formulate a task execution plan coordinating the selected skills to satisfy the user goal.

User Goal: "${task.goal}"
Initial URL: "${task.initialUrl || 'None specified'}"

Selected Active Skills & Standard Operating Procedures:
${compiledSkillInstructions}

CRITICAL RULES:
1. Multi-Step Form & Login Discipline:
   If this involves authentication or forms (especially Google/Gmail, Microsoft, etc.), separate Email entry (Screen 1) from Password entry (Screen 2).
   Never enter password into the email field!
2. Observable Evidence:
   Each milestone must have a verifiable observable expected evidence (confirmed URL, DOM element, extracted records).

Respond ONLY with a JSON object:
{
  "plan": [
    { 
      "id": 1, 
      "title": "Milestone title", 
      "description": "Specific action to take", 
      "skillId": "which skill ID governs this step" 
    }
  ],
  "recommendedMaxSteps": number
}`;

      const planText = await generateAgentLLM({
        prompt: planPrompt,
        jsonResponse: true,
      });

      const parsedPlan = JSON.parse(planText || '{}');
      if (Array.isArray(parsedPlan.plan) && parsedPlan.plan.length > 0) {
        task.plan = parsedPlan.plan.map((p: any, idx: number) => ({
          id: p.id || idx + 1,
          title: p.title || `Milestone ${idx + 1}`,
          description: p.description || '',
          status: idx === 0 ? 'in_progress' : 'pending',
          skillId: p.skillId || selectedSkills[0]?.id,
        }));

        if (parsedPlan.recommendedMaxSteps && parsedPlan.recommendedMaxSteps >= 3) {
          task.maxSteps = Math.min(Math.max(parsedPlan.recommendedMaxSteps, (task.plan?.length || 0) + 3), 20);
        }

        this.emit(task.id, {
          type: 'plan_ready',
          taskId: task.id,
          timestamp: new Date().toISOString(),
          payload: { plan: task.plan, maxSteps: task.maxSteps },
        });
      }
    } catch (err) {
      console.warn('Error generating task plan:', err);
    }

    const startTime = Date.now();
    let currentStepNum = 0;
    let verificationsPassed = 0;
    let verificationsTotal = 0;
    const extractedItems: any[] = [];
    const executionHistory: string[] = [];

    // Navigate to initial URL if provided, or default search / relevant site
    if (task.initialUrl && task.initialUrl.trim().length > 0) {
      currentStepNum++;
      const stepId = `step_${currentStepNum}`;
      const step: AgentStep = {
        id: stepId,
        stepNumber: currentStepNum,
        thought: `Navigating directly to requested initial URL: ${task.initialUrl}`,
        action: 'navigate',
        params: { url: task.initialUrl },
        status: 'running',
        timestamp: new Date().toISOString(),
        skillId: selectedSkills[0]?.id,
        skillName: selectedSkills[0]?.name,
      };
      task.steps.push(step);
      this.emit(task.id, {
        type: 'step_start',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        payload: { step },
      });

      const sStart = Date.now();
      const prevUrl = task.currentUrl || 'about:blank';
      const prevTitle = task.currentTitle || '';

      try {
        const activePage = await getSafePage();
        if (activePage) {
          await activePage.goto(task.initialUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await new Promise((r) => setTimeout(r, 1500));
          task.currentUrl = activePage.url();
          task.currentTitle = await activePage.title().catch(() => '');
          step.durationMs = Date.now() - sStart;
          step.status = 'completed';
          step.result = `Navigated to ${task.currentUrl} ("${task.currentTitle}")`;
          executionHistory.push(`Step ${currentStepNum}: Navigated to ${task.currentUrl}`);
        } else {
          throw new Error('Browser session closed');
        }
      } catch (err: any) {
        step.status = 'failed';
        step.result = `Navigation error: ${err.message}`;
        executionHistory.push(`Step ${currentStepNum}: Navigation to ${task.initialUrl} encountered an issue: ${err.message}`);
      }

      // Verification of initial navigation
      verificationsTotal++;
      const evidence = skillVerifier.verifyStep({
        action: 'navigate',
        params: { url: task.initialUrl },
        previousUrl: prevUrl,
        currentUrl: task.currentUrl || 'about:blank',
        previousTitle: prevTitle,
        currentTitle: task.currentTitle || '',
        domSnippet: '',
        activeSkill: selectedSkills[0],
        extractedCount: 0,
      });
      step.verification = evidence;
      if (evidence.verified) verificationsPassed++;

      const screenshot = await captureSafeScreenshot();
      if (screenshot) {
        step.screenshot = screenshot;
        task.latestScreenshot = screenshot;
        this.emit(task.id, {
          type: 'step_screenshot',
          taskId: task.id,
          timestamp: new Date().toISOString(),
          payload: { stepNumber: currentStepNum, screenshot },
        });
      }

      this.emit(task.id, {
        type: 'step_complete',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        payload: { step },
      });
    }

    // =========================================================================
    // LIFECYCLE STAGE 3: EXECUTE WITH SKILLS, VERIFY STEPS & EVIDENCE
    // =========================================================================
    while (currentStepNum < task.maxSteps && (task.status as any) !== 'stopped' && (task.status as any) !== 'completed') {
      // Check if paused or waiting for approval
      while ((task.status as any) === 'paused' || (task.status as any) === 'waiting_approval') {
        await new Promise((r) => setTimeout(r, 1000));
      }
      if ((task.status as any) === 'stopped') break;

      // Verify browser connection
      if (!browser.connected) {
        console.log(`[Agent ${task.id}] Browser disconnected or session ended.`);
        break;
      }

      currentStepNum++;
      const stepId = `step_${currentStepNum}`;

      // 1. Observe current page state with rich DOM tagging
      let pageUrl = task.currentUrl || 'about:blank';
      let pageTitle = task.currentTitle || '';
      let domSummary = '';
      let rawSnippet = '';

      try {
        const activePage = await getSafePage();
        if (!activePage || activePage.isClosed()) {
          console.log(`[Agent ${task.id}] No active page available.`);
          break;
        }

        pageUrl = activePage.url();
        pageTitle = await activePage.title().catch(() => '');
        task.currentUrl = pageUrl;
        task.currentTitle = pageTitle;

        // Tag every interactive element with unique data-steel-id and collect detailed schema
        domSummary = await activePage.evaluate(() => {
          const items: string[] = [];
          
          // Form inputs
          const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select')).slice(0, 20);
          inputs.forEach((el: any, i) => {
            const steelId = `input-${i + 1}`;
            el.setAttribute('data-steel-id', steelId);

            const type = (el.type || 'text').toLowerCase();
            const id = el.id ? ` id="${el.id}"` : '';
            const name = el.name ? ` name="${el.name}"` : '';
            const placeholder = el.placeholder ? ` placeholder="${el.placeholder}"` : '';
            const aria = el.getAttribute('aria-label') ? ` aria-label="${el.getAttribute('aria-label')}"` : '';
            const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
            const valuePreview = type === 'password' ? ' (value hidden)' : (el.value ? ` value="${el.value.slice(0, 30)}"` : ' (empty)');

            items.push(`[TARGET_ID: "${steelId}"] <input type="${type}"${id}${name}${placeholder}${aria}> visible=${isVisible}${valuePreview}`);
          });

          // Clickable buttons and links
          const interactives = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]')).slice(0, 35);
          interactives.forEach((el: any, i) => {
            const steelId = `click-${i + 1}`;
            el.setAttribute('data-steel-id', steelId);

            const tag = el.tagName.toLowerCase();
            const text = (el.innerText || el.textContent || el.getAttribute('aria-label') || el.value || '')
              .trim().replace(/\s+/g, ' ').slice(0, 60);
            const href = el.href ? ` href="${el.href}"` : '';
            const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;

            if (text.length > 0 || el.getAttribute('aria-label')) {
              items.push(`[TARGET_ID: "${steelId}"] <${tag}${href}> "${text}" visible=${isVisible}`);
            }
          });

          // Main body text preview
          const bodyText = (document.body ? document.body.innerText : '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 2500);

          return `URL: ${window.location.href}\nTitle: ${document.title}\n\nInteractive Elements:\n${items.join('\n')}\n\nPage Text Preview:\n${bodyText}`;
        });
        rawSnippet = domSummary.slice(0, 1500);
      } catch (err: any) {
        if (err.message?.includes('Target closed') || err.message?.includes('Session closed')) {
          console.log(`[Agent ${task.id}] Page session closed during observation.`);
          break;
        }
        domSummary = `Current URL: ${pageUrl}. Error extracting DOM: ${err.message}`;
      }

      // Format current plan progress for context
      const planContext = task.plan && task.plan.length > 0
        ? `Task Plan Milestones:\n${task.plan.map((p) => `[${p.status.toUpperCase()}] Milestone ${p.id}: ${p.title} - ${p.description}`).join('\n')}`
        : 'No specific pre-planned milestones.';

      // 2. Query Gemini for next thought and action using the loaded skills
      const prompt = `You are an elite autonomous browser agent powered by Steel cloud browser infrastructure.
User Goal: "${task.goal}"

Active Coordinated Skills:
${compiledSkillInstructions}

${planContext}

Current Step: ${currentStepNum} / ${task.maxSteps}
Current Page URL: ${pageUrl}
Current Page Title: ${pageTitle}

Previous Step Actions Taken:
${executionHistory.length > 0 ? executionHistory.join('\n') : 'No actions taken yet.'}

Observed Page State & DOM Structure:
${domSummary}

CRITICAL EXECUTION GUIDELINES:
1. TARGET ACCURACY: When clicking or typing, ALWAYS supply the exact "targetId" (e.g. "input-1", "input-2", "click-3") shown in the Interactive Elements list.
2. OBSERVABLE VERIFICATION: Never claim an action succeeded unless observable evidence is produced (confirmed URL, non-empty data extracted, visible page state).
3. MULTI-STEP LOGIN PROTOCOL:
   - On Screen 1 (Email/Username step): ONLY enter the email/username. Never enter a password! Click "Next" and wait for Screen 2.
   - On Screen 2 (Password step with <input type="password"> visible): Now enter the password with "isPassword": true.
4. CONSEQUENTIAL ACTIONS:
   If this action involves payments, deposits, withdrawals, legal commitments, final bookings, or irreversible submissions, set "isConsequential": true and provide "impactRisk".

Available actions:
1. "navigate" - Go to a new URL. params: { "url": "https://..." }
2. "click" - Click an element. params: { "targetId": "click-1", "selector": "CSS selector", "text": "button or link text" }
3. "type" - Type into an input. params: { "targetId": "input-1", "selector": "CSS selector", "text": "value to type", "inputType": "email" | "password" | "text", "isPassword": true/false, "pressEnter": true/false }
4. "scroll" - Scroll page. params: { "direction": "down" or "up", "amount": 500 }
5. "wait" - Wait for page load / AJAX / password step transition. params: { "seconds": 2 }
6. "extract" - Note down specific data found on page. params: { "title": "entity name", "content": "extracted info/stats/link" }
7. "finish" - Task goal has been satisfied! params: { "summary": "Comprehensive final answer for the user", "findings": ["point 1", "point 2"], "extractedData": [{"title": "...", "content": "..."}] }

Respond ONLY with a JSON object in this exact schema:
{
  "thought": "Reasoning explaining what I observe and why I am taking this action governed by skill",
  "governingSkillId": "id of the active skill directing this step",
  "action": "navigate" | "click" | "type" | "scroll" | "wait" | "extract" | "finish",
  "params": { ... },
  "currentMilestoneId": 1, // Optional: The ID of the milestone currently in progress or completed
  "milestoneStatus": "completed" | "in_progress", // Optional
  "isConsequential": boolean, // Set true if this action involves payment, checkout, or irreversible external submission
  "impactRisk": "Explanation of financial or legal impact if consequential" // Optional
}`;

      let decision: { 
        thought: string; 
        governingSkillId?: string;
        action: any; 
        params: any; 
        currentMilestoneId?: number; 
        milestoneStatus?: string;
        isConsequential?: boolean;
        impactRisk?: string;
      };

      try {
        const text = await generateAgentLLM({
          prompt,
          systemInstruction: 'You are an elite autonomous browser agent powered by Steel cloud browser infrastructure. Respond ONLY with a valid JSON object matching the requested schema.',
          jsonResponse: true,
        });

        decision = JSON.parse(text || '{}');

        // Update task plan progress if provided
        if (decision.currentMilestoneId && task.plan) {
          const mId = decision.currentMilestoneId;
          const mStatus = (decision.milestoneStatus === 'completed' ? 'completed' : 'in_progress') as TaskPlanItem['status'];
          task.plan = task.plan.map((p) => {
            if (p.id === mId) {
              return { ...p, status: mStatus };
            }
            if (mStatus === 'completed' && p.id < mId) {
              return { ...p, status: 'completed' };
            }
            if (mStatus === 'completed' && p.id === mId + 1 && p.status === 'pending') {
              return { ...p, status: 'in_progress' };
            }
            return p;
          });

          this.emit(task.id, {
            type: 'plan_updated',
            taskId: task.id,
            timestamp: new Date().toISOString(),
            payload: { plan: task.plan },
          });
        }
      } catch (err: any) {
        console.error('Gemini reasoning error:', err);
        decision = {
          thought: 'Continuing autonomous scan and analysis of page content.',
          action: currentStepNum === 1 ? 'navigate' : 'finish',
          params: currentStepNum === 1 ? { url: 'https://duckduckgo.com' } : { summary: 'Completed initial data retrieval.' },
        };
      }

      const activeGoverningSkill = selectedSkills.find(s => s.id === decision.governingSkillId) || selectedSkills[0];
      task.activeSkillId = activeGoverningSkill?.id;

      const step: AgentStep = {
        id: stepId,
        stepNumber: currentStepNum,
        thought: decision.thought || 'Executing step...',
        action: decision.action || 'wait',
        params: decision.params || {},
        status: 'running',
        timestamp: new Date().toISOString(),
        skillId: activeGoverningSkill?.id,
        skillName: activeGoverningSkill?.name,
      };
      task.steps.push(step);

      // =======================================================================
      // LIFECYCLE STAGE 4: CHECK PERMISSIONS & CONSEQUENTIAL ACTION GUARDRAIL
      // =======================================================================
      const isConsequential = decision.isConsequential || 
        activeGoverningSkill?.permissionLevel === 'consequential_action' ||
        /pay|checkout|buy|transfer|deposit|withdraw|purchase|place order|confirm booking/i.test(step.thought + JSON.stringify(step.params));

      if (isConsequential && step.action !== 'finish' && step.action !== 'wait') {
        step.requiresApproval = true;
        step.approvalStatus = 'pending';

        const approvalReq: ConsequentialApprovalRequest = {
          id: 'approval_' + Math.random().toString(36).substring(2, 8),
          taskId: task.id,
          stepNumber: currentStepNum,
          action: step.action,
          skillId: activeGoverningSkill?.id,
          skillName: activeGoverningSkill?.name,
          description: decision.thought,
          permissionLevel: 'consequential_action',
          targetUrl: pageUrl,
          parameters: step.params,
          impactRisk: decision.impactRisk || 'This action may initiate a financial charge, booking, or irreversible submission.',
          timestamp: new Date().toISOString(),
        };

        const approved = await this.waitForApproval(task.id, approvalReq);
        step.approvalStatus = approved ? 'approved' : 'rejected';

        if (!approved) {
          step.status = 'failed';
          step.result = 'Consequential action rejected by user in human-in-the-loop safety checkpoint.';
          executionHistory.push(`Step ${currentStepNum}: Rejected by user: ${approvalReq.description}`);
          
          this.emit(task.id, {
            type: 'step_complete',
            taskId: task.id,
            timestamp: new Date().toISOString(),
            payload: { step },
          });
          continue;
        }
      }

      this.emit(task.id, {
        type: 'step_start',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        payload: { step },
      });

      // 3. Execute the action with full safety guards
      const sStart = Date.now();
      const prevUrl = pageUrl;
      const prevTitle = pageTitle;

      try {
        const activePage = await getSafePage();
        if (!activePage || activePage.isClosed() || !browser.connected) {
          throw new Error('Browser session closed');
        }

        if (step.action === 'finish') {
          step.status = 'completed';
          step.durationMs = Date.now() - sStart;
          step.result = 'Goal completed successfully.';
          executionHistory.push(`Step ${currentStepNum}: Finish reached. ${decision.thought}`);

          // Mark remaining plan milestones as completed
          if (task.plan) {
            task.plan = task.plan.map((p) => ({ ...p, status: 'completed' }));
            this.emit(task.id, {
              type: 'plan_updated',
              taskId: task.id,
              timestamp: new Date().toISOString(),
              payload: { plan: task.plan },
            });
          }

          const report: TaskReport = {
            summary: decision.params?.summary || decision.thought || 'Task completed.',
            findings: decision.params?.findings || [],
            extractedData: [...extractedItems, ...(decision.params?.extractedData || [])],
            totalSteps: currentStepNum,
            durationMs: Date.now() - startTime,
            finalUrl: activePage.url(),
            sessionId: task.sessionId!,
            sessionViewerUrl: task.sessionViewerUrl!,
            replayUrl: task.debugUrl,
            skillsUsed: selectedSkills.map(s => s.name),
            verificationsPassed,
            verificationsTotal,
          };
          task.report = report;
          task.status = 'completed';
          this.saveTasksToDisk();

          this.emit(task.id, {
            type: 'step_complete',
            taskId: task.id,
            timestamp: new Date().toISOString(),
            payload: { step },
          });

          this.emit(task.id, {
            type: 'task_completed',
            taskId: task.id,
            timestamp: new Date().toISOString(),
            payload: { report },
          });

          break;
        } else if (step.action === 'navigate') {
          let url = step.params.url || '';
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          await activePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
          await new Promise((r) => setTimeout(r, 1500));
          step.result = `Navigated to ${activePage.url()}`;
        } else if (step.action === 'click') {
          const { targetId, selector, text } = step.params;
          let clicked = false;
          let matchedDesc = '';

          // 1. Try by unique targetId first (e.g. data-steel-id="click-1")
          if (targetId) {
            const el = await activePage.$(`[data-steel-id="${targetId}"]`);
            if (el) {
              const isVisible = await activePage.evaluate((e: any) => e.offsetWidth > 0 && e.offsetHeight > 0, el);
              if (isVisible) {
                await el.click();
                clicked = true;
                matchedDesc = `targetId "${targetId}"`;
              }
            }
          }

          // 2. Try clicking by text if targetId wasn't used or found
          if (!clicked && text) {
            clicked = await activePage.evaluate((targetText: string) => {
              const elements = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'));
              const match = elements.find((el: any) => 
                (el.innerText || el.textContent || el.getAttribute('aria-label') || el.value || '')
                  .trim().toLowerCase().includes(targetText.toLowerCase())
              );
              if (match) {
                if ((match as HTMLAnchorElement).target === '_blank') {
                  (match as HTMLAnchorElement).target = '_self';
                }
                (match as HTMLElement).click();
                return true;
              }
              return false;
            }, text).catch(() => false);

            if (clicked) matchedDesc = `text "${text}"`;
          }

          // 3. Try CSS selector
          if (!clicked && selector) {
            try {
              const el = await activePage.$(selector);
              if (el) {
                await el.click();
                clicked = true;
                matchedDesc = `selector "${selector}"`;
              }
            } catch {}
          }

          // If clicking "Next", "Sign in", or submit buttons on auth forms, wait extra for AJAX transition
          const isNextButton = /next|continue|sign in|login|submit/i.test(text || selector || targetId || '');
          const waitTransition = isNextButton ? 2500 : 1500;
          await new Promise((r) => setTimeout(r, waitTransition));

          step.result = clicked 
            ? `Clicked ${matchedDesc}${isNextButton ? ' (waited for page/AJAX transition)' : ''}` 
            : `Attempted click on "${text || selector || targetId}"`;
        } else if (step.action === 'type') {
          const { targetId, selector, text, pressEnter, inputType, isPassword } = step.params;
          let targetElement: any = null;
          let matchedDesc = '';

          const wantsPassword = isPassword === true || inputType === 'password' || 
            (selector && /pass(word)?/i.test(selector)) || 
            (targetId && /pass/i.test(targetId));

          // 1. Try by unique targetId first (e.g. data-steel-id="input-1")
          if (targetId) {
            const el = await activePage.$(`[data-steel-id="${targetId}"]`);
            if (el) {
              const elType = await activePage.evaluate((e: any) => (e.type || '').toLowerCase(), el);
              // SAFETY GUARD: Never type password into non-password inputs!
              if (wantsPassword && elType !== 'password') {
                console.warn(`[Agent Safety] Blocked typing password into non-password input "${targetId}" (type="${elType}").`);
              } else {
                targetElement = el;
                matchedDesc = `targetId "${targetId}" (type="${elType}")`;
              }
            }
          }

          // 2. If typing password, specifically locate a visible password field
          if (!targetElement && wantsPassword) {
            const pwdHandle = await activePage.$('input[type="password"]:not([type="hidden"]), input[name*="pass" i], input[id*="pass" i]');
            if (pwdHandle) {
              const isVisible = await activePage.evaluate((el: any) => el.offsetWidth > 0 && el.offsetHeight > 0, pwdHandle);
              if (isVisible) {
                targetElement = pwdHandle;
                matchedDesc = 'visible password input field';
              }
            }
            
            // STRICT SAFETY: IF NO PASSWORD FIELD IS VISIBLE, DO NOT TYPE INTO TEXT/EMAIL!
            if (!targetElement) {
              throw new Error(
                'Password input field is not currently visible on this screen. On multi-step logins (like Gmail/Google), you must first submit your email address, click "Next", and wait for the password prompt to render.'
              );
            }
          }

          // 3. If typing email/username, locate email/username input
          if (!targetElement && (inputType === 'email' || (selector && /email|identifier|user/i.test(selector)))) {
            const emailHandle = await activePage.$('input[type="email"], input[name*="ident" i], input[id*="ident" i], input[name*="user" i], input[name*="email" i]');
            if (emailHandle) {
              targetElement = emailHandle;
              matchedDesc = 'email/username input field';
            }
          }

          // 4. Try CSS selector if provided
          if (!targetElement && selector) {
            try {
              const handle = await activePage.$(selector);
              if (handle) {
                const elType = await activePage.evaluate((e: any) => (e.type || '').toLowerCase(), handle);
                if (wantsPassword && elType !== 'password') {
                  console.warn(`[Agent Safety] Prevented password entry into non-password selector "${selector}".`);
                } else {
                  targetElement = handle;
                  matchedDesc = `selector "${selector}"`;
                }
              }
            } catch {}

            if (!targetElement) {
              try {
                const byAttr = await activePage.$(`[name="${selector}"], #${selector}, [placeholder*="${selector}" i], [aria-label*="${selector}" i]`);
                if (byAttr) {
                  const elType = await activePage.evaluate((e: any) => (e.type || '').toLowerCase(), byAttr);
                  if (!wantsPassword || elType === 'password') {
                    targetElement = byAttr;
                    matchedDesc = `attribute match for "${selector}"`;
                  }
                }
              } catch {}
            }
          }

          // 5. General fallback only if NOT a password!
          if (!targetElement && !wantsPassword) {
            try {
              const general = await activePage.$('input[type="text"], input[type="search"], textarea, input:not([type="hidden"]):not([type="password"])');
              if (general) {
                targetElement = general;
                matchedDesc = 'first available text input field';
              }
            } catch {}
          }

          if (targetElement) {
            // Clean previous value before typing to prevent concatenation
            await targetElement.focus();
            await activePage.evaluate((el: any) => {
              el.value = '';
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, targetElement);
            await targetElement.click({ clickCount: 3 });
            await activePage.keyboard.press('Backspace');

            // Type with natural delay
            await targetElement.type(text, { delay: 35 });

            if (pressEnter) {
              await activePage.keyboard.press('Enter');
              await new Promise((r) => setTimeout(r, 2000));
            } else {
              await new Promise((r) => setTimeout(r, 600));
            }

            step.result = `Typed ${wantsPassword ? '[PROTECTED PASSWORD]' : `"${text}"`} into ${matchedDesc}${pressEnter ? ' and pressed Enter' : ''}`;
          } else {
            throw new Error(`No matching input field found for typing. Target was: ${targetId || selector || inputType || 'text'}`);
          }
        } else if (step.action === 'scroll') {
          const amount = step.params.amount || 600;
          const direction = step.params.direction === 'up' ? -amount : amount;
          await activePage.evaluate((y) => window.scrollBy({ top: y, behavior: 'smooth' }), direction).catch(() => {});
          await new Promise((r) => setTimeout(r, 1000));
          step.result = `Scrolled ${step.params.direction || 'down'} by ${amount}px`;
        } else if (step.action === 'wait') {
          const waitTime = Math.min((step.params.seconds || 2) * 1000, 8000);
          await new Promise((r) => setTimeout(r, waitTime));
          step.result = `Waited ${(waitTime / 1000).toFixed(1)}s for page response`;
        } else if (step.action === 'extract') {
          const item = {
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: step.params.title || `Data point ${extractedItems.length + 1}`,
            content: step.params.content || '',
            url: activePage.url(),
          };
          extractedItems.push(item);
          step.result = `Extracted: "${item.title}" - ${item.content.slice(0, 100)}`;
        }

        task.currentUrl = activePage.url();
        task.currentTitle = await activePage.title().catch(() => '');
        step.durationMs = Date.now() - sStart;
        step.status = 'completed';
        executionHistory.push(`Step ${currentStepNum}: ${step.action} - ${step.result}`);
      } catch (err: any) {
        step.status = 'failed';
        step.result = `Action failed: ${err.message}`;
        executionHistory.push(`Step ${currentStepNum} failed: ${err.message}`);

        if (err.message?.includes('Target closed') || err.message?.includes('Session closed')) {
          console.log(`[Agent ${task.id}] Page or browser closed during step ${currentStepNum}.`);
          break;
        }
      }

      // =======================================================================
      // LIFECYCLE STAGE 5: SKILL VERIFICATION & EVIDENCE CAPTURE
      // =======================================================================
      verificationsTotal++;
      const evidence = skillVerifier.verifyStep({
        action: step.action,
        params: step.params,
        result: step.result,
        previousUrl: prevUrl,
        currentUrl: task.currentUrl || 'about:blank',
        previousTitle: prevTitle,
        currentTitle: task.currentTitle || '',
        domSnippet: rawSnippet,
        activeSkill: activeGoverningSkill,
        extractedCount: extractedItems.length,
      });

      step.verification = evidence;
      if (evidence.verified) {
        verificationsPassed++;
      } else {
        console.warn(`[Skill Verification] Step ${currentStepNum} verification note: ${evidence.observedData}`);
      }

      this.emit(task.id, {
        type: 'step_verified',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        payload: { stepNumber: currentStepNum, verification: evidence },
      });

      // Capture screenshot after step with safe helper
      const postShot = await captureSafeScreenshot();
      if (postShot) {
        step.screenshot = postShot;
        task.latestScreenshot = postShot;
        this.emit(task.id, {
          type: 'step_screenshot',
          taskId: task.id,
          timestamp: new Date().toISOString(),
          payload: { stepNumber: currentStepNum, screenshot: postShot },
        });
      }

      this.emit(task.id, {
        type: 'step_complete',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        payload: { step },
      });

      // Brief delay between steps
      await new Promise((r) => setTimeout(r, 1200));
    }

    // If loop finished (either reached max steps or closed) without explicit finish
    if (task.status === 'running') {
      task.status = 'completed';
      const synthesisPrompt = `You are an elite autonomous agent synthesis engine at the level of OpenAI Operator and Claude Pro.
Synthesize the final report for this autonomous browser task:
Goal: "${task.goal}"
Coordinated Skills: ${selectedSkills.map(s => s.name).join(', ')}
Total Steps: ${currentStepNum}
Final URL: ${task.currentUrl || 'about:blank'}
Title: ${task.currentTitle || ''}
Execution History:
${executionHistory.join('\n')}

Extracted Data Points: ${extractedItems.length}
${extractedItems.length > 0 ? JSON.stringify(extractedItems, null, 2) : 'None'}

CRITICAL GUIDELINES:
1. ACCURACY & HONESTY: Never claim success based only on clicks or form submissions. If MFA/2FA, CAPTCHA, or authentication challenge stopped the task before reaching the final verified objective, explicitly state that the goal was blocked or incomplete.
2. STRUCTURE: Use clean, professional Markdown formatted with clear sections:
   - ## Executive Summary (1-2 clear sentences on what occurred and actual outcome)
   - ## Key Findings & Observations (bulleted facts, extracted values, or barriers detected)
   - ## Objective Status (Explicitly: **Completed** | **Blocked / Incomplete** | **Needs Human Verification**)
   - ## Recommended Next Step (Actionable next step for the user or agent)
3. TYPOGRAPHY: Use crisp Markdown with proper headers, bold highlights, and backticks for identifiers or URLs.`;

      let summaryText = 'Autonomous task execution finished.';
      try {
        summaryText = await generateAgentLLM({
          prompt: synthesisPrompt,
          systemInstruction: 'You are an elite AI synthesis engine at the level of OpenAI Operator and Claude Pro. Summarize the browser session findings clearly and objectively in structured Markdown.',
          jsonResponse: false,
        }) || summaryText;
      } catch (err) {
        console.warn('Synthesis error:', err);
      }

      task.report = {
        summary: summaryText,
        findings: executionHistory,
        extractedData: extractedItems,
        totalSteps: currentStepNum,
        durationMs: Date.now() - startTime,
        finalUrl: task.currentUrl || 'about:blank',
        sessionId: task.sessionId!,
        sessionViewerUrl: task.sessionViewerUrl!,
        replayUrl: task.debugUrl,
        skillsUsed: selectedSkills.map(s => s.name),
        verificationsPassed,
        verificationsTotal,
      };

      this.saveTasksToDisk();

      this.emit(task.id, {
        type: 'task_completed',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        payload: { report: task.report },
      });
    }

    // Clean up browser connection
    try {
      if (browser.connected) {
        await browser.disconnect();
      }
    } catch {
      // ignore
    }
    this.activeBrowsers.delete(task.id);

    // Release session if autoRelease is true
    if (task.autoRelease && task.sessionId) {
      await steelClient.releaseSession(task.sessionId);
    }
  }

  // Manual interactive action triggered from UI
  async performManualAction(sessionId: string, action: {
    type: 'navigate' | 'click' | 'type' | 'scroll' | 'screenshot' | 'eval';
    url?: string;
    selector?: string;
    text?: string;
    script?: string;
  }) {
    const session = await steelClient.getSession(sessionId);
    if (!session || !session.websocketUrl) {
      throw new Error('Session not found or not active');
    }

    let browser: Browser | null = null;
    try {
      browser = await puppeteer.connect({
        browserWSEndpoint: session.websocketUrl,
        defaultViewport: { width: 1280, height: 800 },
      });

      const pages = await browser.pages();
      let page = pages.find((p) => !p.isClosed()) || (pages.length > 0 ? pages[0] : await browser.newPage());

      if (action.type === 'navigate' && action.url) {
        await page.goto(action.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      } else if (action.type === 'scroll') {
        await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' })).catch(() => {});
      } else if (action.type === 'screenshot') {
        const screenshot = !page.isClosed()
          ? await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 }).catch(() => undefined)
          : undefined;
        return { screenshot };
      } else if (action.type === 'eval' && action.script) {
        const result = await page.evaluate((s) => eval(s), action.script);
        return { result };
      }

      const url = !page.isClosed() ? page.url() : 'about:blank';
      const title = !page.isClosed() ? await page.title().catch(() => '') : '';
      const screenshot = !page.isClosed()
        ? await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 }).catch(() => undefined)
        : undefined;

      return { url, title, screenshot };
    } finally {
      if (browser && browser.connected) {
        try {
          await browser.disconnect();
        } catch {}
      }
    }
  }
}

export const agentManager = new AgentManager();
