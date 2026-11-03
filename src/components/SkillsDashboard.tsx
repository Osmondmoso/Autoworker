import React, { useState } from 'react';
import { 
  Boxes, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  FileCode2, 
  PlayCircle, 
  Lock, 
  Plus, 
  Trash2, 
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Flame,
  Award,
  Filter
} from 'lucide-react';
import type { SkillDefinition, SkillPermission, ActiveTask } from '../types';

interface SkillsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  skills: SkillDefinition[];
  activeTask?: ActiveTask;
  onToggleSkill: (id: string, active: boolean) => Promise<void>;
  onApproveProposedSkill: (id: string) => Promise<void>;
  onDeleteSkill: (id: string) => Promise<void>;
  onCreateSkill: (draft: Partial<SkillDefinition>) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const SkillsDashboard: React.FC<SkillsDashboardProps> = ({
  isOpen,
  onClose,
  skills,
  activeTask,
  onToggleSkill,
  onApproveProposedSkill,
  onDeleteSkill,
  onCreateSkill,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'task_skills' | 'proposed' | 'create'>('all');
  const [selectedSkill, setSelectedSkill] = useState<SkillDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [permissionFilter, setPermissionFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Skill form state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Productivity & Tools');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillPermission, setNewSkillPermission] = useState<SkillPermission>('read_only');
  const [newSkillConditions, setNewSkillConditions] = useState('');
  const [newSkillProcedures, setNewSkillProcedures] = useState('');
  const [newSkillVerification, setNewSkillVerification] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  if (!isOpen) return null;

  const categories = Array.from(new Set(skills.map((s) => s.category)));
  const proposedSkills = skills.filter((s) => s.status === 'proposed');
  const activeSkills = skills.filter((s) => s.status === 'active');
  const taskSkillIds = (activeTask?.selectedSkills || []).map((s) => typeof s === 'string' ? s : (s?.id || s?.name || ''));
  const currentTaskSkills = skills.filter((s) => taskSkillIds.includes(s.id));

  const filteredSkills = skills.filter((s) => {
    if (activeTab === 'proposed') return s.status === 'proposed';
    if (activeTab === 'task_skills') return taskSkillIds.includes(s.id);
    
    // 'all' tab
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (permissionFilter !== 'all' && s.permissionLevel !== permissionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !newSkillDesc.trim()) return;

    setIsSubmittingNew(true);
    try {
      const conditions = newSkillConditions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const verificationCriteria = newSkillVerification
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const procedures = newSkillProcedures
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((desc, idx) => ({
          id: idx + 1,
          action: 'extract',
          description: desc,
          expectedEvidence: 'Observable step output matches specification',
        }));

      await onCreateSkill({
        name: newSkillName.trim(),
        category: newSkillCategory,
        description: newSkillDesc.trim(),
        permissionLevel: newSkillPermission,
        activationConditions: conditions.length > 0 ? conditions : ['Triggered for matching web tasks'],
        verificationCriteria: verificationCriteria.length > 0 ? verificationCriteria : ['Observable DOM or data evidence confirmed'],
        procedures: procedures.length > 0 ? procedures : [{ id: 1, action: 'navigate', description: 'Navigate to target application', expectedEvidence: 'Target page confirmed' }],
        requiredTools: ['navigate', 'extract', 'click'],
      });

      setNewSkillName('');
      setNewSkillDesc('');
      setNewSkillConditions('');
      setNewSkillProcedures('');
      setNewSkillVerification('');
      setActiveTab('all');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const getPermissionBadge = (perm: SkillPermission) => {
    switch (perm) {
      case 'read_only':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
            Read Only
          </span>
        );
      case 'browser_interaction':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800">
            Interaction
          </span>
        );
      case 'form_preparation':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800">
            Form Prep
          </span>
        );
      case 'file_modification':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800">
            File Modify
          </span>
        );
      case 'external_submission':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800">
            External Submit
          </span>
        );
      case 'consequential_action':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-700 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            Consequential
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="relative w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Autonomous Skills Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  v2.0 Modular Architecture
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Central Skill Registry, SKILL.md instruction sets, verifiable evidence criteria & permission tiers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Refresh Registry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Summary Badges */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Registry ({skills.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('task_skills')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'task_skills'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Active in Task ({taskSkillIds.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('proposed')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'proposed'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Learned Skills</span>
              {proposedSkills.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950 text-amber-300 font-bold border border-amber-500">
                  {proposedSkills.length} new
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Custom Skill</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 pb-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {activeSkills.length} Active
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-rose-400">
              <Lock className="w-3 h-3" />
              {skills.filter(s => s.permissionLevel === 'consequential_action').length} Consequential Guardrails
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar (for 'all' tab) */}
        {activeTab === 'all' && (
          <div className="p-3 sm:px-6 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search skills by keyword, tool, or capability..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Permission Filter */}
            <select
              value={permissionFilter}
              onChange={(e) => setPermissionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Permissions</option>
              <option value="read_only">Read Only</option>
              <option value="browser_interaction">Browser Interaction</option>
              <option value="form_preparation">Form Preparation</option>
              <option value="external_submission">External Submission</option>
              <option value="consequential_action">Consequential Actions</option>
            </select>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left List/Grid (7 cols when inspecting, 12 cols when no skill selected) */}
          <div className={`${selectedSkill ? 'lg:col-span-6' : 'lg:col-span-12'} overflow-y-auto p-4 sm:p-6 space-y-3`}>
            
            {/* Create Tab */}
            {activeTab === 'create' && (
              <form onSubmit={handleCreateSubmit} className="max-w-2xl mx-auto space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 mb-1">Register New Modular Skill</h3>
                  <p className="text-slate-400">
                    Define an autonomous procedure set with required permissions, tools, and observable verification criteria.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Skill Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flight Comparison Engine"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Travel & Logistics"
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Description *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Describe exactly what capabilities this skill executes..."
                    value={newSkillDesc}
                    onChange={(e) => setNewSkillDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Permission Level</label>
                  <select
                    value={newSkillPermission}
                    onChange={(e) => setNewSkillPermission(e.target.value as SkillPermission)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="read_only">Read-only (Safe page reading, text extraction)</option>
                    <option value="browser_interaction">Browser interaction (Clicking tabs, scrolling, menus)</option>
                    <option value="form_preparation">Form preparation (Filling non-sensitive text fields)</option>
                    <option value="external_submission">External submission (Submitting contact or inquiry forms)</option>
                    <option value="consequential_action">Consequential Action (Requires Human Approval: Payments/Bookings)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Activation Conditions (one per line)</label>
                  <textarea
                    rows={2}
                    placeholder="When should Gemini activate this skill? e.g. User asks to search flights or compare airfare"
                    value={newSkillConditions}
                    onChange={(e) => setNewSkillConditions(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Sequential Procedures (one step per line)</label>
                  <textarea
                    rows={3}
                    placeholder="Step 1: Navigate to booking portal&#10;Step 2: Enter origin and destination cities&#10;Step 3: Extract top 3 lowest fares"
                    value={newSkillProcedures}
                    onChange={(e) => setNewSkillProcedures(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Verification Criteria (Observable Evidence)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Extracted flights table has >= 3 rows with price and flight number"
                    value={newSkillVerification}
                    onChange={(e) => setNewSkillVerification(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNew}
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                  >
                    Register Skill
                  </button>
                </div>
              </form>
            )}

            {/* Proposed Skills Queue */}
            {activeTab === 'proposed' && proposedSkills.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <Sparkles className="w-10 h-10 mx-auto text-amber-500/30 mb-2" />
                <p className="text-sm font-medium text-slate-300">No Newly Learned Skills Pending Review</p>
                <p className="text-xs text-slate-500 mt-1">
                  When the autonomous agent encounters an unfamiliar domain, it proposes and tests a candidate skill here for your approval before trusting it.
                </p>
              </div>
            )}

            {/* Skills Grid */}
            {activeTab !== 'create' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSkills.map((skill) => {
                  const isActive = skill.status === 'active';
                  const isProposed = skill.status === 'proposed';
                  const isUsedInTask = taskSkillIds.includes(skill.id);
                  const isSelected = selectedSkill?.id === skill.id;

                  return (
                    <div
                      key={skill.id}
                      onClick={() => setSelectedSkill(skill)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-950 border-cyan-500 shadow-lg shadow-cyan-500/10'
                          : isProposed
                          ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/80'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-100 text-sm">
                                {skill.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                v{skill.version}
                              </span>
                              {isUsedInTask && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                                  In Task
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                              {skill.category}
                            </span>
                          </div>

                          {/* Permission Badge */}
                          {getPermissionBadge(skill.permissionLevel)}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                          {skill.description}
                        </p>

                        {/* Procedures Count & Verification Criteria */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            {skill.procedures.length} Procedures
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            {skill.verificationCriteria.length} Verifications
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div 
                        className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isProposed ? (
                          <div className="flex items-center gap-2 w-full justify-end">
                            <button
                              onClick={() => onDeleteSkill(skill.id)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors text-[11px] cursor-pointer"
                            >
                              Discard
                            </button>
                            <button
                              onClick={() => onApproveProposedSkill(skill.id)}
                              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all text-[11px] shadow-md shadow-amber-500/20 cursor-pointer"
                            >
                              Approve Skill
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setSelectedSkill(skill)}
                              className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <FileCode2 className="w-3 h-3" />
                              <span>Inspect SKILL.md</span>
                            </button>

                            <div className="flex items-center gap-2">
                              {skill.isCustom && (
                                <button
                                  onClick={() => onDeleteSkill(skill.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                                  title="Delete custom skill"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={(e) => onToggleSkill(skill.id, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                                <span className="ml-1.5 text-[10px] font-semibold text-slate-400">
                                  {isActive ? 'Active' : 'Off'}
                                </span>
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Inspector Drawer (6 cols) */}
          {selectedSkill && (
            <div className="lg:col-span-6 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-full overflow-hidden">
              {/* Inspector Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-slate-200 text-xs">
                    {selectedSkill.id}/SKILL.md
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    v{selectedSkill.version}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedSkill(null)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                {/* Header summary */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-100 text-sm">{selectedSkill.name}</span>
                    {getPermissionBadge(selectedSkill.permissionLevel)}
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-2">
                    {selectedSkill.description}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-cyan-400">Required Tools:</span>
                    <span className="font-mono">{selectedSkill.requiredTools.join(', ')}</span>
                  </div>
                </div>

                {/* Activation Conditions */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gemini Activation Conditions</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                    {selectedSkill.activationConditions.map((cond, idx) => (
                      <li key={idx} className="leading-relaxed">{cond}</li>
                    ))}
                  </ul>
                </div>

                {/* Procedures */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Step-by-Step Autonomous Procedures</span>
                  </div>
                  <div className="space-y-2">
                    {selectedSkill.procedures.map((proc) => (
                      <div key={proc.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px]">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-200">
                            Step {proc.id}: {proc.description}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 uppercase">
                            {proc.action}
                          </span>
                        </div>
                        <div className="text-slate-400 flex items-start gap-1">
                          <span className="text-emerald-400 font-semibold shrink-0">Evidence:</span>
                          <span className="italic">{proc.expectedEvidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observable Verification Criteria */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Observable Evidence Verification Rules</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    {selectedSkill.verificationCriteria.map((crit, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-950/80 p-2 rounded-lg border border-slate-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{crit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Error Recovery */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fault Tolerance & Error Recovery</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                    {selectedSkill.errorRecovery.map((err, idx) => (
                      <li key={idx} className="leading-relaxed">{err}</li>
                    ))}
                  </ul>
                </div>

                {/* Raw Markdown view if present */}
                {selectedSkill.markdownContent && (
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Raw Markdown View</span>
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-60">
                      {selectedSkill.markdownContent}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
