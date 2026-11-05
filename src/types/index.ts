export type TaskStatus = 'idle' | 'planning' | 'running' | 'paused' | 'waiting_approval' | 'completed' | 'failed' | 'stopped';

export type ActionType = 
  | 'navigate' 
  | 'click' 
  | 'type' 
  | 'scroll' 
  | 'wait' 
  | 'extract' 
  | 'screenshot'
  | 'evaluate'
  | 'finish';

export type SkillPermission = 
  | 'read_only' 
  | 'browser_interaction' 
  | 'form_preparation' 
  | 'file_modification' 
  | 'external_submission' 
  | 'consequential_action';

export type SkillStatus = 'active' | 'inactive' | 'proposed' | 'deprecated';

export interface SkillProcedureStep {
  id: number;
  action: string;
  description: string;
  expectedEvidence: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  status: SkillStatus;
  permissionLevel: SkillPermission;
  activationConditions: string[];
  requiredTools: string[];
  procedures: SkillProcedureStep[];
  errorRecovery: string[];
  verificationCriteria: string[];
  markdownContent?: string;
  isCustom?: boolean;
  proposedAt?: string;
  rationale?: string;
}

export interface ObservableEvidence {
  verified: boolean;
  criteria: string;
  observedData: string;
  confidence: number;
  url?: string;
  timestamp: string;
}

export interface ConsequentialApprovalRequest {
  id: string;
  taskId: string;
  stepNumber: number;
  action: ActionType;
  skillId?: string;
  skillName?: string;
  description: string;
  permissionLevel: SkillPermission;
  targetUrl: string;
  parameters: Record<string, any>;
  impactRisk: string;
  timestamp: string;
}

export interface AgentStep {
  id: string;
  stepNumber: number;
  thought: string;
  action: ActionType;
  params: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  screenshot?: string; // base64
  url?: string;
  pageTitle?: string;
  durationMs?: number;
  timestamp: string;
  skillId?: string;
  skillName?: string;
  procedureStepId?: number;
  verification?: ObservableEvidence;
  requiresApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface ExtractedItem {
  id: string;
  title: string;
  content: string;
  url?: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface TaskReport {
  summary: string;
  findings: string[];
  extractedData: ExtractedItem[];
  totalSteps: number;
  durationMs: number;
  finalUrl: string;
  sessionId: string;
  sessionViewerUrl: string;
  replayUrl?: string;
  skillsUsed?: string[];
  verificationsPassed?: number;
  verificationsTotal?: number;
}

export interface TaskPlanItem {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  skillId?: string;
}

export interface SelectedSkillItem {
  id: string;
  name?: string;
  category?: string;
  permission?: string;
}

export interface ActiveTask {
  id: string;
  goal: string;
  initialUrl?: string;
  status: TaskStatus;
  plan?: TaskPlanItem[];
  selectedSkills?: (string | SelectedSkillItem)[];
  selectedSkillObjects?: SelectedSkillItem[];
  activeSkillId?: string;
  pendingApproval?: ConsequentialApprovalRequest;
  sessionId?: string;
  sessionViewerUrl?: string;
  debugUrl?: string;
  websocketUrl?: string;
  createdAt: string;
  currentStepIndex: number;
  steps: AgentStep[];
  report?: TaskReport;
  error?: string;
  currentUrl?: string;
  currentTitle?: string;
  latestScreenshot?: string;
  maxSteps: number;
  autoRelease: boolean;
}

export interface SteelSession {
  id: string;
  createdAt: string;
  status: 'live' | 'released' | 'failed';
  duration?: number;
  timeout?: number;
  debugUrl?: string;
  sessionViewerUrl?: string;
  websocketUrl?: string;
  dimensions?: { width: number; height: number };
  userAgent?: string;
  proxySource?: string | null;
  creditsUsed?: number;
}

export interface AgentEvent {
  type: 
    | 'task_created'
    | 'task_snapshot'
    | 'session_ready'
    | 'skills_selected'
    | 'skill_activated'
    | 'plan_ready'
    | 'plan_updated'
    | 'agent_thought'
    | 'step_start'
    | 'step_progress'
    | 'step_verified'
    | 'step_complete'
    | 'step_screenshot'
    | 'approval_required'
    | 'approval_resolved'
    | 'skill_proposed'
    | 'task_paused'
    | 'task_resumed'
    | 'task_completed'
    | 'task_failed'
    | 'task_stopped';
  taskId: string;
  timestamp: string;
  payload: any;
}

export type StructuredStatus = 'Completed' | 'Failed' | 'Needs Attention' | 'Running' | 'Paused';

export interface TaskStructuredResult {
  status: StructuredStatus;
  whatIDid: string;
  whatIFound: string;
  whatRemains: string;
  nextAction: string;
  technicalDetails?: string;
  errorType?: string;
  actionableOption?: {
    label: string;
    action: 'retry' | 'continue' | 'open_browser' | 'stop';
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  taskId?: string;
  sessionId?: string;
  structuredResult?: TaskStructuredResult;
  screenshot?: string;
  error?: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  activeTaskId?: string;
  activeSessionId?: string;
  lastGoal?: string;
  currentUrl?: string;
  messages: ChatMessage[];
}
