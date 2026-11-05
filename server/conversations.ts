/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { agentManager } from './agent.ts';
import { steelClient } from './steel.ts';
import { generateAgentLLM } from './llm.ts';
import type { 
  Conversation, 
  ChatMessage, 
  TaskStructuredResult, 
  StructuredStatus 
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');

export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  private listeners: Map<string, Set<(message: ChatMessage) => void>> = new Map();

  constructor() {
    this.ensureDataDir();
    this.loadFromDisk();
    if (this.conversations.size === 0) {
      this.createInitialConversation();
    }
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('Failed to create data directory:', err);
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(CONVERSATIONS_FILE)) {
        const raw = fs.readFileSync(CONVERSATIONS_FILE, 'utf-8');
        const list: Conversation[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((c) => this.conversations.set(c.id, c));
          console.log(`[Conversations] Loaded ${this.conversations.size} persistent conversations.`);
        }
      }
    } catch (err) {
      console.warn('Failed to load conversations from disk:', err);
    }
  }

  private saveToDisk() {
    try {
      this.ensureDataDir();
      const list = Array.from(this.conversations.values());
      // Save with compact screenshots to prevent huge file sizes
      const sanitized = list.map((c) => ({
        ...c,
        messages: c.messages.map((m) => ({
          ...m,
          // keep screenshot only on last 2 messages if large
          screenshot: m.screenshot ? (m.screenshot.length > 500000 ? m.screenshot.slice(0, 100) + '...' : m.screenshot) : undefined
        }))
      }));
      fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Failed to save conversations to disk:', err);
    }
  }

  private createInitialConversation(): Conversation {
    const id = 'conv_' + Math.random().toString(36).substring(2, 9);
    const initial: Conversation = {
      id,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_welcome',
          role: 'agent',
          text: 'Hello! I am your autonomous browser agent powered by Steel and AI. Give me any task—like testing a website, filling forms, searching data, or testing web apps. I will operate a real cloud browser and report structured results.',
          timestamp: new Date().toISOString(),
          structuredResult: {
            status: 'Completed',
            whatIDid: 'Initialized autonomous cloud browser agent environment.',
            whatIFound: 'Steel cloud browser infrastructure and reasoning models are ready.',
            whatRemains: 'Awaiting your first task or website target.',
            nextAction: 'Type a website or goal below (e.g. "Open Duck.ai and test it").',
          }
        }
      ]
    };
    this.conversations.set(id, initial);
    this.saveToDisk();
    return initial;
  }

  getAll(): Conversation[] {
    return Array.from(this.conversations.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  get(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  getOrCreateDefault(): Conversation {
    const all = this.getAll();
    if (all.length > 0) return all[0];
    return this.createInitialConversation();
  }

  createConversation(title?: string): Conversation {
    const id = 'conv_' + Math.random().toString(36).substring(2, 9);
    const conv: Conversation = {
      id,
      title: title || 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_' + Math.random().toString(36).substring(2, 9),
          role: 'agent',
          text: 'Ready for a new task. What website or workflow should I navigate and test?',
          timestamp: new Date().toISOString(),
          structuredResult: {
            status: 'Completed',
            whatIDid: 'Started a fresh conversation session.',
            whatIFound: 'Browser sandbox ready.',
            whatRemains: 'Awaiting your goal.',
            nextAction: 'Enter a task or URL to begin.',
          }
        }
      ]
    };
    this.conversations.set(id, conv);
    this.saveToDisk();
    return conv;
  }

  deleteConversation(id: string): boolean {
    const deleted = this.conversations.delete(id);
    if (deleted) this.saveToDisk();
    return deleted;
  }

  // Subscribe to real-time chat updates
  subscribe(convId: string, listener: (msg: ChatMessage) => void): () => void {
    if (!this.listeners.has(convId)) {
      this.listeners.set(convId, new Set());
    }
    this.listeners.get(convId)!.add(listener);
    return () => {
      const set = this.listeners.get(convId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) this.listeners.delete(convId);
      }
    };
  }

  private notify(convId: string, msg: ChatMessage) {
    const set = this.listeners.get(convId);
    if (set) {
      set.forEach((fn) => {
        try {
          fn(msg);
        } catch {}
      });
    }
  }

  // Helper to format structured output
  formatStructuredOutput(params: {
    status: StructuredStatus;
    whatIDid: string;
    whatIFound: string;
    whatRemains: string;
    nextAction: string;
    technicalDetails?: string;
    errorType?: string;
    actionableOption?: { label: string; action: 'retry' | 'continue' | 'open_browser' | 'stop' };
  }): TaskStructuredResult {
    return {
      status: params.status,
      whatIDid: params.whatIDid.trim(),
      whatIFound: params.whatIFound.trim(),
      whatRemains: params.whatRemains.trim(),
      nextAction: params.nextAction.trim(),
      technicalDetails: params.technicalDetails,
      errorType: params.errorType,
      actionableOption: params.actionableOption,
    };
  }

  // Detect human readable error type
  private detectHumanReadableError(errorMsg: string): { type: string; suggestion: string } {
    const lower = errorMsg.toLowerCase();
    if (lower.includes('captcha') || lower.includes('cloudflare') || lower.includes('robot')) {
      return {
        type: 'CAPTCHA encountered',
        suggestion: 'The website requested a CAPTCHA verification. You can expand the browser view to solve it or resume.'
      };
    }
    if (lower.includes('sign-in') || lower.includes('login') || lower.includes('auth') || lower.includes('unauthorized')) {
      return {
        type: 'Website requires sign-in',
        suggestion: 'The destination page requires an authenticated session. Enter credentials or switch to interactive mode.'
      };
    }
    if (lower.includes('timeout') || lower.includes('timed out')) {
      return {
        type: 'AI response timeout',
        suggestion: 'The page took longer than expected to render or respond. Tap Retry to poll again.'
      };
    }
    if (lower.includes('navigation') || lower.includes('net::err') || lower.includes('cannot find')) {
      return {
        type: 'Navigation failed',
        suggestion: 'Unable to reach the destination address. Verify the website URL and try again.'
      };
    }
    if (lower.includes('session closed') || lower.includes('target closed') || lower.includes('disconnect')) {
      return {
        type: 'Browser session expired',
        suggestion: 'The previous cloud browser sandbox closed. The agent will launch a fresh session on your next command.'
      };
    }
    return {
      type: 'Task interrupted',
      suggestion: errorMsg || 'An unexpected condition stopped the step.'
    };
  }

  // Process a user message within a persistent conversation
  async processUserMessage(
    convId: string, 
    userText: string,
    onProgress?: (partial: ChatMessage) => void
  ): Promise<ChatMessage> {
    let conv = this.conversations.get(convId);
    if (!conv) {
      conv = this.createConversation();
      convId = conv.id;
    }

    const trimmedUser = userText.trim();
    const userMsgId = 'msg_' + Math.random().toString(36).substring(2, 9);
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: trimmedUser,
      timestamp: new Date().toISOString(),
    };

    conv.messages.push(userMsg);
    conv.updatedAt = new Date().toISOString();

    // Auto-update conversation title if it's the first user message
    const userMsgCount = conv.messages.filter((m) => m.role === 'user').length;
    if (userMsgCount === 1) {
      conv.title = trimmedUser.length > 30 ? trimmedUser.slice(0, 30) + '...' : trimmedUser;
    }

    this.saveToDisk();
    this.notify(convId, userMsg);

    // Initial agent placeholder message
    const agentMsgId = 'msg_' + Math.random().toString(36).substring(2, 9);
    const agentMsg: ChatMessage = {
      id: agentMsgId,
      role: 'agent',
      text: 'Analyzing instruction...',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      structuredResult: {
        status: 'Running',
        whatIDid: 'Observing user request and conversation context.',
        whatIFound: 'Checking active browser session state.',
        whatRemains: 'Executing required browser actions.',
        nextAction: 'Connecting to browser session...',
      }
    };
    conv.messages.push(agentMsg);
    this.saveToDisk();
    this.notify(convId, agentMsg);
    if (onProgress) onProgress(agentMsg);

    try {
      // Analyze intent: Follow-up / Correction / Continuation vs New Task vs Direct Answer
      const recentContext = conv.messages
        .slice(-6, -2)
        .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
        .join('\n');

      const activeTaskId = conv.activeTaskId;
      const activeSessionId = conv.activeSessionId;
      const previousTask = activeTaskId ? agentManager.getTask(activeTaskId) : undefined;
      const hasActiveSession = !!activeSessionId;

      const intentPrompt = `You are SteelAgent, an intelligent browser automation assistant.
A user sent a new message in an ongoing conversation.

Previous Conversation Context:
${recentContext || 'None (first message)'}

Active Task Goal: "${conv.lastGoal || 'None'}"
Active Browser Session: ${hasActiveSession ? `Active Session ID: ${activeSessionId}` : 'No active session'}
Current URL: "${conv.currentUrl || previousTask?.currentUrl || 'None'}"

User's Latest Message:
"${trimmedUser}"

Determine how the agent should handle this:
1. "continuation": The user is continuing, correcting, or retrying a step in the CURRENT active task/website (e.g. "Try again", "It didn't return an answer", "Click next", "Look for pricing", "Why did it fail?", "Try entering password").
2. "new_task": The user wants to start a completely NEW browser automation task or go to a different website (e.g. "Open Duck.ai and test it", "Search github for react", "Go to weather.com").
3. "conversational": The user is asking a direct question about what was already found or general greeting.

Respond ONLY with a JSON object:
{
  "intent": "continuation" | "new_task" | "conversational",
  "reasoning": "Brief explanation",
  "synthesizedGoal": "The actionable browser goal for this step",
  "targetUrl": "Optional URL if explicitly mentioned or inferred"
}`;

      let intentData = {
        intent: 'new_task',
        synthesizedGoal: trimmedUser,
        targetUrl: undefined as string | undefined,
      };

      try {
        const intentRaw = await generateAgentLLM({
          prompt: intentPrompt,
          systemInstruction: 'You are an intent classification engine. Output ONLY valid JSON.',
          jsonResponse: true,
        });
        intentData = JSON.parse(intentRaw);
      } catch (err) {
        console.warn('Intent parsing fallback:', err);
      }

      console.log(`[Conversation ${convId}] Intent detected:`, intentData.intent, 'Goal:', intentData.synthesizedGoal);

      // Handle conversational questions that don't need browser actions
      if (intentData.intent === 'conversational' && !trimmedUser.toLowerCase().includes('open') && !trimmedUser.toLowerCase().includes('click')) {
        const answerPrompt = `User asked: "${trimmedUser}"
Conversation context:
${recentContext}
Previous findings: ${previousTask?.report?.summary || 'No recent task report.'}
Current page: ${conv.currentUrl || 'No active page'}

Provide a direct, helpful, and concise answer to the user.`;

        const answer = await generateAgentLLM({
          prompt: answerPrompt,
          systemInstruction: 'You are SteelAgent. Answer clearly and concisely.',
          jsonResponse: false,
        });

        agentMsg.text = answer || 'I am ready to help you navigate and test websites.';
        agentMsg.isStreaming = false;
        agentMsg.structuredResult = this.formatStructuredOutput({
          status: 'Completed',
          whatIDid: 'Answered inquiry using verified session context.',
          whatIFound: answer.slice(0, 160) + (answer.length > 160 ? '...' : ''),
          whatRemains: 'None. Ready for follow-up.',
          nextAction: 'Ask another question or give a new browser task.',
        });

        conv.updatedAt = new Date().toISOString();
        this.saveToDisk();
        this.notify(convId, agentMsg);
        return agentMsg;
      }

      // Determine session reuse for continuation
      let sessionIdToUse: string | undefined = undefined;
      if (intentData.intent === 'continuation' && hasActiveSession) {
        // Verify session still exists on Steel
        try {
          const s = await steelClient.getSession(activeSessionId!);
          if (s && s.status !== 'released' && s.status !== 'failed') {
            sessionIdToUse = activeSessionId;
          }
        } catch {
          sessionIdToUse = undefined;
        }
      }

      // Synthesize specific actionable goal combining past context if continuation
      let finalGoal = intentData.synthesizedGoal || trimmedUser;
      if (intentData.intent === 'continuation' && conv.lastGoal) {
        finalGoal = `Continuing previous task: "${conv.lastGoal}". Follow-up instruction: "${trimmedUser}". If verifying results, check the DOM carefully and do not stop until verifiable evidence is observed.`;
      }

      // Launch autonomous task execution
      const task = await agentManager.runTask({
        goal: finalGoal,
        initialUrl: intentData.targetUrl || conv.currentUrl,
        maxSteps: 8,
        autoRelease: false, // Keep session active for continuous conversation
        existingSessionId: sessionIdToUse,
      });

      conv.activeTaskId = task.id;
      conv.lastGoal = finalGoal;
      agentMsg.taskId = task.id;

      // Subscribe to task updates to update the agent message in real-time
      const unsubscribe = agentManager.subscribe(task.id, (evt) => {
        if (evt.type === 'session_ready') {
          conv!.activeSessionId = evt.payload.sessionId;
          agentMsg.sessionId = evt.payload.sessionId;
          agentMsg.text = `Working in cloud browser session ${evt.payload.sessionId.slice(0, 8)}...`;
          this.notify(convId, agentMsg);
        } else if (evt.type === 'step_complete') {
          const step = evt.payload.step;
          if (step.url) conv!.currentUrl = step.url;
          if (step.screenshot) agentMsg.screenshot = step.screenshot;

          agentMsg.structuredResult = {
            status: 'Running',
            whatIDid: `Step ${step.stepNumber}: ${step.action} - ${step.result || step.thought || 'In progress'}`,
            whatIFound: step.verification?.observedData || `Current page: ${conv!.currentUrl || 'loading'}`,
            whatRemains: `Completing remaining steps...`,
            nextAction: `Executing next autonomous browser action.`,
          };
          this.notify(convId, agentMsg);
          if (onProgress) onProgress(agentMsg);
        } else if (evt.type === 'task_completed') {
          const report = evt.payload.report;
          unsubscribe();

          const summaryText = report.summary || '';
          const summaryLower = summaryText.toLowerCase();
          const isExplicitFailure = summaryLower.includes('did not achieve') || 
            summaryLower.includes('not achieve') ||
            summaryLower.includes('failed') || 
            summaryLower.includes('unable to') || 
            summaryLower.includes('could not') ||
            summaryLower.includes('blocked') ||
            summaryLower.includes('prevents further') ||
            summaryLower.includes('mfa challenge') ||
            summaryLower.includes('captcha') ||
            summaryLower.includes('authenticat');

          // Only claim completed if verified evidence was produced and no explicit block/failure occurred
          const isSuccess = !isExplicitFailure && (
            ((report.verificationsPassed || 0) > 0 && !task.error) || 
            (report.extractedData && report.extractedData.length > 0)
          );
          const status: StructuredStatus = isSuccess ? 'Completed' : 'Needs Attention';

          agentMsg.isStreaming = false;
          agentMsg.text = summaryText || 'Task execution finished.';
          agentMsg.screenshot = task.latestScreenshot;

          // Extract clean whatIFound and whatRemains from the report
          let findingsText = '';
          if (report.extractedData && report.extractedData.length > 0) {
            findingsText = report.extractedData.map((d: any) => `${d.title}: ${d.content}`).join(' • ');
          } else if (Array.isArray(report.findings) && report.findings.length > 0) {
            findingsText = report.findings.slice(-2).join('. ');
          } else {
            findingsText = isSuccess ? 'Primary objective verified.' : 'Flow stopped before reaching final verified state.';
          }

          agentMsg.structuredResult = this.formatStructuredOutput({
            status,
            whatIDid: `Executed ${report.totalSteps} steps on ${report.finalUrl || 'target website'}.`,
            whatIFound: findingsText,
            whatRemains: status === 'Completed' ? 'None. Goal satisfied.' : 'Challenge or roadblock prevented complete objective verification.',
            nextAction: status === 'Completed' 
              ? 'Ready for follow-up instructions or next task.' 
              : 'Provide credentials/2FA code or say "Try again" to resume from current state.',
            technicalDetails: `Total steps: ${report.totalSteps} | Duration: ${(report.durationMs / 1000).toFixed(1)}s | Verifications: ${report.verificationsPassed}/${report.verificationsTotal} | Final URL: ${report.finalUrl}`,
            actionableOption: status === 'Needs Attention' ? { label: 'Resume & Try Again', action: 'retry' } : undefined,
          });

          conv!.updatedAt = new Date().toISOString();
          this.saveToDisk();
          this.notify(convId, agentMsg);
          if (onProgress) onProgress(agentMsg);
        } else if (evt.type === 'task_failed') {
          unsubscribe();
          const errText = evt.payload.error || 'Execution encountered an error.';
          const errorInfo = this.detectHumanReadableError(errText);

          agentMsg.isStreaming = false;
          agentMsg.text = `Encountered an issue: ${errorInfo.type}`;
          agentMsg.error = errorInfo.type;
          agentMsg.screenshot = task.latestScreenshot;
          agentMsg.structuredResult = this.formatStructuredOutput({
            status: 'Failed',
            whatIDid: `Attempted autonomous navigation on ${conv!.currentUrl || 'target'}.`,
            whatIFound: `${errorInfo.type}: ${errorInfo.suggestion}`,
            whatRemains: 'Step failed before completion.',
            nextAction: 'Tap Retry to attempt again, or expand the browser view to intervene.',
            errorType: errorInfo.type,
            technicalDetails: errText,
            actionableOption: {
              label: 'Retry Step',
              action: 'retry',
            }
          });

          conv!.updatedAt = new Date().toISOString();
          this.saveToDisk();
          this.notify(convId, agentMsg);
          if (onProgress) onProgress(agentMsg);
        }
      });

      // Return the current state of the message
      return agentMsg;
    } catch (err: any) {
      console.error(`[Conversation ${convId}] Error:`, err);
      const errorInfo = this.detectHumanReadableError(err.message || 'Execution error');

      agentMsg.isStreaming = false;
      agentMsg.text = `Could not complete task: ${errorInfo.type}`;
      agentMsg.error = errorInfo.type;
      agentMsg.structuredResult = this.formatStructuredOutput({
        status: 'Failed',
        whatIDid: 'Started autonomous execution workflow.',
        whatIFound: `${errorInfo.type}. ${errorInfo.suggestion}`,
        whatRemains: 'Task stopped.',
        nextAction: 'Tap Retry or try a different website/instruction.',
        errorType: errorInfo.type,
        actionableOption: { label: 'Retry Step', action: 'retry' }
      });

      conv.updatedAt = new Date().toISOString();
      this.saveToDisk();
      this.notify(convId, agentMsg);
      return agentMsg;
    }
  }
}

export const conversationManager = new ConversationManager();
