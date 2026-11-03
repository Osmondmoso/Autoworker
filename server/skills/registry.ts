import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { SkillDefinition, SkillPermission, SkillStatus } from '../../src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SKILLS_DIR = path.resolve(__dirname, '../../skills_registry');

export const INITIAL_SKILLS: SkillDefinition[] = [
  {
    id: 'web-research',
    name: 'Web Research',
    category: 'Research & Search',
    description: 'Autonomous multi-source web intelligence, fact cross-referencing, deep article extraction, and entity synthesis.',
    version: '1.2.0',
    status: 'active',
    permissionLevel: 'read_only',
    activationConditions: [
      'Task involves researching facts, companies, people, scientific concepts, or news',
      'User asks to find, compare, or summarize information from multiple websites',
      'Searching search engines (Google, DuckDuckGo, Bing) for topic overviews'
    ],
    requiredTools: ['navigate', 'scroll', 'extract', 'wait'],
    procedures: [
      { id: 1, action: 'navigate', description: 'Navigate to authoritative search engine or direct primary domain', expectedEvidence: 'Confirmed search or landing page with active query input' },
      { id: 2, action: 'type', description: 'Formulate search query with targeted boolean/domain keywords', expectedEvidence: 'Query field populated and search triggered' },
      { id: 3, action: 'scroll', description: 'Inspect search results list and evaluate organic ranking citations', expectedEvidence: 'Extracted minimum 3 organic result links' },
      { id: 4, action: 'click', description: 'Open authoritative source page and wait for main content render', expectedEvidence: 'Target article or documentation URL confirmed' },
      { id: 5, action: 'extract', description: 'Extract key facts, statistics, author, publication date, and quotes', expectedEvidence: 'Structured extracted entity data added to report' },
      { id: 6, action: 'finish', description: 'Synthesize findings cross-referenced across sources with citations', expectedEvidence: 'Complete markdown synthesis with source links' }
    ],
    errorRecovery: [
      'If search engine shows CAPTCHA or blocking wall, switch immediately to DuckDuckGo or direct Wikipedia/official URL',
      'If article has paywall or cookie banner, scroll past or inspect alternate news aggregator source',
      'If search query returns low relevance, refine query with quotes or site-specific filters'
    ],
    verificationCriteria: [
      'At least 2 independent citations or data points extracted',
      'Target page URL confirmed to match primary or reputable secondary domain',
      'Extracted content contains non-empty title and substantive text (>100 chars)'
    ]
  },
  {
    id: 'youtube-research',
    name: 'YouTube Research',
    category: 'Video & Media',
    description: 'Inspects YouTube channels, video metadata, descriptions, chapters, comments, and captions for structured topic research.',
    version: '1.1.0',
    status: 'active',
    permissionLevel: 'read_only',
    activationConditions: [
      'Task requests searching YouTube for tutorials, lectures, reviews, or podcasts',
      'User asks to extract video chapters, view counts, upload dates, or descriptions',
      'Analyzing video topics, creator channels, or media timestamps'
    ],
    requiredTools: ['navigate', 'click', 'scroll', 'extract'],
    procedures: [
      { id: 1, action: 'navigate', description: 'Go to youtube.com or direct video/channel URL', expectedEvidence: 'YouTube navigation shell and search bar loaded' },
      { id: 2, action: 'type', description: 'Search video topic with creator or title filters', expectedEvidence: 'Video results feed displayed' },
      { id: 3, action: 'click', description: 'Open highest relevance video', expectedEvidence: 'Video player page active with URL starting with youtube.com/watch' },
      { id: 4, action: 'scroll', description: 'Expand video description and inspect chapter timestamps', expectedEvidence: 'Video title, channel name, views, and timestamped chapters visible' },
      { id: 5, action: 'extract', description: 'Extract video takeaways, chapters, and creator links', expectedEvidence: 'Structured video metadata saved to report' }
    ],
    errorRecovery: [
      'If cookie consent banner appears, click "Accept all" or "Reject all" button',
      'If video is age-restricted or unavailable, navigate back to search results and select next top candidate',
      'If description is truncated, click "...more" button to reveal full timestamps'
    ],
    verificationCriteria: [
      'URL confirms youtube.com/watch?v=... active page',
      'Extracted video title and channel name match query context',
      'Description and chapter breakdown confirmed non-empty'
    ]
  },
  {
    id: 'forms-applications',
    name: 'Forms & Applications',
    category: 'Automation & Productivity',
    description: 'Intelligent multi-step form entry, job application filling, survey response drafting, and field validation with credential safety.',
    version: '1.3.0',
    status: 'active',
    permissionLevel: 'form_preparation',
    activationConditions: [
      'Task involves filling web forms, signing in, job applications, or registrations',
      'Entering personal details, contact forms, search filters, or survey inputs',
      'Multi-step wizard navigation with input validation'
    ],
    requiredTools: ['type', 'click', 'wait', 'extract'],
    procedures: [
      { id: 1, action: 'navigate', description: 'Load form or application page', expectedEvidence: 'Form DOM elements visible in page structure' },
      { id: 2, action: 'scroll', description: 'Survey all visible input fields, labels, required markers (*), and field types', expectedEvidence: 'Catalog of inputs mapped with field names and types' },
      { id: 3, action: 'type', description: 'Fill fields with exact matching data (strict separation between email and password)', expectedEvidence: 'Fields populated with confirmed values and zero field cross-contamination' },
      { id: 4, action: 'click', description: 'Click Next / Continue step button for multi-step forms', expectedEvidence: 'Form advances to next step without validation errors' },
      { id: 5, action: 'extract', description: 'Capture form receipt, summary, or confirmation reference number', expectedEvidence: 'Observable submission confirmation or receipt token' }
    ],
    errorRecovery: [
      'If validation error appears (e.g. invalid format), read error label, format text properly, and re-enter',
      'If password input is not visible on step 1 (like Google/Gmail), enter email first, click Next, and wait for step 2',
      'If required field is missed, scroll to highlighted field and populate with valid data'
    ],
    verificationCriteria: [
      'Target input values confirmed in DOM via value attribute inspection',
      'Form validation errors absent on submit/next trigger',
      'Confirmation page, receipt message, or successful step transition observed'
    ]
  },
  {
    id: 'browser-security',
    name: 'Browser Security & Redirect Detection',
    category: 'Security & Safety',
    description: 'Audits SSL/TLS status, detects deceptive phishing patterns, monitors redirect chains, and prevents malicious credential phishing.',
    version: '1.2.0',
    status: 'active',
    permissionLevel: 'read_only',
    activationConditions: [
      'Entering login credentials or sensitive data on unfamiliar domains',
      'Investigating suspicious links, redirects, or shortened URLs',
      'Auditing website authenticity, SSL certificates, or deceptive domain lookalikes'
    ],
    requiredTools: ['navigate', 'evaluate', 'extract'],
    procedures: [
      { id: 1, action: 'evaluate', description: 'Inspect current window protocol (https:), domain host, and certificate status', expectedEvidence: 'Protocol verified HTTPS with valid domain host' },
      { id: 2, action: 'evaluate', description: 'Audit page for deceptive iframes, fake overlay login modals, or suspicious scripts', expectedEvidence: 'Security audit score calculated' },
      { id: 3, action: 'extract', description: 'Extract security telemetry: canonical domain, redirect count, and login safety status', expectedEvidence: 'Security telemetry recorded in task report' }
    ],
    errorRecovery: [
      'If HTTP or untrusted domain detected, halt navigation and alert user immediately',
      'If deceptive popup covers page, avoid entering credentials and report phishing risk',
      'If unexpected redirect occurs, trace previous domain chain and verify final destination'
    ],
    verificationCriteria: [
      'URL protocol confirmed HTTPS',
      'Domain hostname matches requested company/service identity',
      'No deceptive fullscreen phishing overlays detected in DOM'
    ]
  },
  {
    id: 'file-management',
    name: 'File & Document Management',
    category: 'Documents & Storage',
    description: 'Locates, downloads, inspects, and verifies documents (PDFs, CSVs, JSON, images) from web pages with checksum validation.',
    version: '1.1.0',
    status: 'active',
    permissionLevel: 'file_modification',
    activationConditions: [
      'Task requests downloading reports, whitepapers, datasets, or invoices',
      'Extracting tables from web pages into downloadable CSV or JSON',
      'Locating and validating document links on documentation or financial portals'
    ],
    requiredTools: ['navigate', 'click', 'extract', 'wait'],
    procedures: [
      { id: 1, action: 'navigate', description: 'Navigate to portal or document repository', expectedEvidence: 'Repository list or table loaded' },
      { id: 2, action: 'click', description: 'Locate file link matching requested extension (.pdf, .csv, .xlsx)', expectedEvidence: 'File resource identified and triggered' },
      { id: 3, action: 'extract', description: 'Extract file title, size, URL, and metadata into artifact record', expectedEvidence: 'File artifact record generated with verified download link' }
    ],
    errorRecovery: [
      'If direct download link opens in viewer, extract direct file URL from embed iframe',
      'If file requires authentication, prepare login step or prompt for required session token',
      'If file format differs, convert table DOM directly into structured CSV/JSON'
    ],
    verificationCriteria: [
      'Document URL confirmed accessible with valid HTTP 200 header',
      'Extracted file metadata includes non-empty name, format, and source URL'
    ]
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis & Reporting',
    category: 'Analytics & Reporting',
    description: 'Extracts tabular records, computes summary statistics, identifies trends, and produces structured markdown reports with key metrics.',
    version: '1.2.0',
    status: 'active',
    permissionLevel: 'read_only',
    activationConditions: [
      'Task requests data extraction from tables, charts, or leaderboards',
      'Computing averages, percentages, rankings, or comparisons between items',
      'Generating executive summary reports with key metrics and structured datasets'
    ],
    requiredTools: ['navigate', 'scroll', 'extract', 'evaluate'],
    procedures: [
      { id: 1, action: 'navigate', description: 'Navigate to target dataset, dashboard, or statistical portal', expectedEvidence: 'Data table or metrics dashboard visible' },
      { id: 2, action: 'scroll', description: 'Inspect full table rows, headers, pagination, and sorting controls', expectedEvidence: 'Table headers and row count parsed' },
      { id: 3, action: 'extract', description: 'Extract all table records into structured array of items', expectedEvidence: 'Minimum 5 data records extracted with consistent keys' },
      { id: 4, action: 'evaluate', description: 'Compute summary metrics (min, max, mean, count, top ranked)', expectedEvidence: 'Statistical aggregates calculated' },
      { id: 5, action: 'finish', description: 'Format analysis into Markdown tables, bulleted findings, and insights', expectedEvidence: 'Complete synthesis report with structured data tables' }
    ],
    errorRecovery: [
      'If table uses client-side pagination, click next page button to extract all rows',
      'If data is loaded via infinite scroll, execute scroll down actions until rows stop increasing',
      'If numbers contain currency or unit symbols, parse into clean numeric floats'
    ],
    verificationCriteria: [
      'Extracted dataset contains at least 3 distinct records with uniform schema',
      'Calculated metrics match raw tabular numbers without arithmetic hallucinations',
      'Report contains Markdown data table with column headers'
    ]
  },
  {
    id: 'shopping-booking',
    name: 'Shopping & Hotel Booking',
    category: 'E-Commerce & Travel',
    description: 'Compares product prices, tracks stock inventory, inspects hotel rates/dates, and prepares reservation drafts with consequential guardrails.',
    version: '1.2.0',
    status: 'active',
    permissionLevel: 'form_preparation',
    activationConditions: [
      'Task asks to find product prices, deals, or check store inventory',
      'Comparing hotel options, flight rates, dates, or amenities',
      'Preparing cart checkout or booking details before payment'
    ],
    requiredTools: ['navigate', 'type', 'click', 'scroll', 'extract'],
    procedures: [
      { id: 1, action: 'navigate', description: 'Navigate to e-commerce store or booking aggregator (e.g. Amazon, Booking, Google Flights)', expectedEvidence: 'Search / destination bar ready' },
      { id: 2, action: 'type', description: 'Enter destination / product keywords and filter parameters (dates, guests, price cap)', expectedEvidence: 'Search filters applied' },
      { id: 3, action: 'scroll', description: 'Extract top 3-5 options with item title, nightly/unit price, rating, and availability', expectedEvidence: 'Multi-option price comparison dataset extracted' },
      { id: 4, action: 'click', description: 'Select top recommended option to inspect final pricing breakdown, taxes, and cancellation policy', expectedEvidence: 'Item detail page active with itemized pricing' },
      { id: 5, action: 'extract', description: 'Synthesize price comparison table with direct links and total estimated cost', expectedEvidence: 'Comparison table and draft booking summary produced' }
    ],
    errorRecovery: [
      'If dates are unavailable, increment dates by 1 day or check alternate nearby properties',
      'If currency is foreign, convert to requested currency using current exchange rate',
      'If out of stock, check alternate vendor or warehouse availability'
    ],
    verificationCriteria: [
      'Extracted price includes exact currency symbol and numerical value',
      'Dates, guest counts, or product specifications match user request',
      'Consequential action approval triggered if proceeding past review screen'
    ]
  },
  {
    id: 'software-development',
    name: 'Software Development',
    category: 'Developer & Code',
    description: 'Navigates GitHub repositories, inspects code files, extracts API documentation, analyzes pull requests, and tests web endpoints.',
    version: '1.1.0',
    status: 'active',
    permissionLevel: 'read_only',
    activationConditions: [
      'Task requests inspecting open-source GitHub repositories or pull requests',
      'Finding code snippets, API endpoints, SDK usage, or library documentation',
      'Debugging web application errors, console messages, or network requests'
    ],
    requiredTools: ['navigate', 'click', 'scroll', 'extract', 'evaluate'],
    procedures: [
      { id: 1, action: 'navigate', description: 'Navigate to GitHub repository or developer documentation site', expectedEvidence: 'Repository tree or documentation index loaded' },
      { id: 2, action: 'click', description: 'Open README, package.json, or target source file', expectedEvidence: 'Source code view or Markdown rendered' },
      { id: 3, action: 'extract', description: 'Extract code implementation, dependencies, license, and installation command', expectedEvidence: 'Code blocks and package versions extracted' },
      { id: 4, action: 'finish', description: 'Summarize architecture, API endpoints, and step-by-step usage guide', expectedEvidence: 'Developer guide with syntax-highlighted code' }
    ],
    errorRecovery: [
      'If code file is large, search for specific function name or use raw view',
      'If repository is archived or deprecated, locate maintained active fork',
      'If documentation link is broken, use GitHub repo issues or release notes'
    ],
    verificationCriteria: [
      'Repository URL confirmed on github.com or official docs domain',
      'Extracted code snippets verified against actual source tree',
      'Dependencies and versions matched with package manifests'
    ]
  },
  {
    id: 'financial-operations',
    name: 'Financial Operations',
    category: 'Finance & Banking',
    description: 'Checks financial asset prices (stocks, crypto, forex), monitors portfolio balances, tracks market charts, and enforces consequential safety barriers.',
    version: '1.3.0',
    status: 'active',
    permissionLevel: 'consequential_action',
    activationConditions: [
      'Task requests checking stock tickers, cryptocurrency prices, or forex rates',
      'Viewing bank or brokerage account summaries, transactions, or statements',
      'Any task involving fund transfers, orders, deposits, or consequential trades'
    ],
    requiredTools: ['navigate', 'type', 'click', 'extract'],
    procedures: [
      { id: 1, action: 'navigate', description: 'Navigate to financial quote portal (e.g. Yahoo Finance, CoinMarketCap, TradingView)', expectedEvidence: 'Financial quote or dashboard loaded' },
      { id: 2, action: 'type', description: 'Enter asset ticker or symbol (e.g. AAPL, BTC, NVDA)', expectedEvidence: 'Ticker quote page active' },
      { id: 3, action: 'extract', description: 'Extract current price, 24h change %, market cap, volume, and timestamp', expectedEvidence: 'Verified financial data item recorded' },
      { id: 4, action: 'finish', description: 'Synthesize market summary with risk disclosures and timestamped quotes', expectedEvidence: 'Report with financial disclaimer and exact quotes' }
    ],
    errorRecovery: [
      'If market is closed, clearly note previous close price and after-hours trading quote',
      'If ticker symbol is ambiguous, verify company name and exchange (e.g. NASDAQ vs NYSE)',
      'If portal requires subscription, switch to free market quote aggregator'
    ],
    verificationCriteria: [
      'Stock or crypto price verified with exact currency and quote timestamp',
      'Market change percentage calculated with directional indicator (+/-)',
      'STRICT SAFETY: Any transaction, deposit, withdrawal, or trade is blocked until explicit human approval'
    ]
  }
];

export class SkillsRegistry {
  private skills: Map<string, SkillDefinition> = new Map();
  private initialized = false;

  constructor() {
    this.ensureSkillsDirectory();
    this.loadAllSkills();
  }

  private ensureSkillsDirectory() {
    try {
      if (!fs.existsSync(SKILLS_DIR)) {
        fs.mkdirSync(SKILLS_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('Failed to create skills_registry directory:', err);
    }
  }

  private loadAllSkills() {
    // 1. Seed initial skills into directory if not present
    for (const skill of INITIAL_SKILLS) {
      const skillPath = path.join(SKILLS_DIR, skill.id);
      const markdownPath = path.join(skillPath, 'SKILL.md');
      const metaPath = path.join(skillPath, 'metadata.json');

      if (!fs.existsSync(skillPath)) {
        try {
          fs.mkdirSync(skillPath, { recursive: true });
          const mdContent = this.generateSkillMarkdown(skill);
          fs.writeFileSync(markdownPath, mdContent, 'utf-8');
          fs.writeFileSync(metaPath, JSON.stringify(skill, null, 2), 'utf-8');
        } catch (err) {
          console.warn(`Error writing initial skill ${skill.id}:`, err);
        }
      }

      // Load markdown content into memory
      let content = '';
      if (fs.existsSync(markdownPath)) {
        try {
          content = fs.readFileSync(markdownPath, 'utf-8');
        } catch {}
      }

      this.skills.set(skill.id, {
        ...skill,
        markdownContent: content || this.generateSkillMarkdown(skill)
      });
    }

    // 2. Discover any additional custom or learned skills in directory
    try {
      const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !this.skills.has(entry.name)) {
          const metaPath = path.join(SKILLS_DIR, entry.name, 'metadata.json');
          const mdPath = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
          if (fs.existsSync(metaPath)) {
            try {
              const meta: SkillDefinition = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
              let md = '';
              if (fs.existsSync(mdPath)) md = fs.readFileSync(mdPath, 'utf-8');
              this.skills.set(meta.id, { ...meta, markdownContent: md });
            } catch (err) {
              console.warn(`Error loading custom skill ${entry.name}:`, err);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error reading skills directory:', err);
    }

    this.initialized = true;
    console.log(`[SkillsRegistry] Loaded ${this.skills.size} modular skills.`);
  }

  generateSkillMarkdown(skill: SkillDefinition): string {
    return `---
id: "${skill.id}"
name: "${skill.name}"
category: "${skill.category}"
version: "${skill.version}"
status: "${skill.status}"
permissionLevel: "${skill.permissionLevel}"
---

# ${skill.name}

${skill.description}

## Activation Conditions
${skill.activationConditions.map(c => `- ${c}`).join('\n')}

## Required Tools
${skill.requiredTools.map(t => `- \`${t}\``).join(', ')}

## Standard Operating Procedures
${skill.procedures.map(p => `${p.id}. **${p.action.toUpperCase()}**: ${p.description}\n   - *Observable Evidence*: ${p.expectedEvidence}`).join('\n')}

## Error Recovery Instructions
${skill.errorRecovery.map(e => `- ${e}`).join('\n')}

## Verification Criteria
${skill.verificationCriteria.map(v => `- ${v}`).join('\n')}
`;
  }

  getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  getActiveSkills(): SkillDefinition[] {
    return Array.from(this.skills.values()).filter(s => s.status === 'active');
  }

  getSkill(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }

  toggleSkillStatus(id: string, active: boolean): SkillDefinition {
    const skill = this.skills.get(id);
    if (!skill) throw new Error(`Skill with ID "${id}" not found`);

    skill.status = active ? 'active' : 'inactive';
    this.persistSkill(skill);
    return skill;
  }

  updateSkill(id: string, updates: Partial<SkillDefinition>): SkillDefinition {
    const skill = this.skills.get(id);
    if (!skill) throw new Error(`Skill with ID "${id}" not found`);

    const updated: SkillDefinition = {
      ...skill,
      ...updates,
      id: skill.id, // Immutable ID
    };

    if (updates.markdownContent) {
      updated.markdownContent = updates.markdownContent;
    } else {
      updated.markdownContent = this.generateSkillMarkdown(updated);
    }

    this.skills.set(id, updated);
    this.persistSkill(updated);
    return updated;
  }

  // Learns/proposes a new skill when agent encounters an unfamiliar domain
  proposeNewSkill(draft: {
    id: string;
    name: string;
    category?: string;
    description: string;
    activationConditions: string[];
    requiredTools: string[];
    procedures: { id: number; action: string; description: string; expectedEvidence: string }[];
    errorRecovery: string[];
    verificationCriteria: string[];
    permissionLevel?: SkillPermission;
    rationale?: string;
  }): SkillDefinition {
    const cleanId = draft.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '') || `learned-skill-${Date.now()}`;
    
    // Anti-tamper check: cannot overwrite trusted active skills
    if (this.skills.has(cleanId) && this.skills.get(cleanId)!.status === 'active') {
      throw new Error(`Cannot overwrite active trusted skill "${cleanId}"`);
    }

    const proposed: SkillDefinition = {
      id: cleanId,
      name: draft.name,
      category: draft.category || 'Learned Capability',
      description: draft.description,
      version: '0.1.0-draft',
      status: 'proposed', // Must be approved by user in UI!
      permissionLevel: draft.permissionLevel || 'read_only',
      activationConditions: draft.activationConditions || [],
      requiredTools: draft.requiredTools || ['navigate', 'extract'],
      procedures: draft.procedures || [],
      errorRecovery: draft.errorRecovery || [],
      verificationCriteria: draft.verificationCriteria || [],
      isCustom: true,
      proposedAt: new Date().toISOString(),
      rationale: draft.rationale || 'Dynamically drafted for an unfamiliar user task.',
    };

    proposed.markdownContent = this.generateSkillMarkdown(proposed);
    this.skills.set(cleanId, proposed);
    this.persistSkill(proposed);
    return proposed;
  }

  approveSkill(id: string): SkillDefinition {
    const skill = this.skills.get(id);
    if (!skill) throw new Error(`Skill "${id}" not found`);

    skill.status = 'active';
    skill.version = skill.version.replace('-draft', '') || '1.0.0';
    this.persistSkill(skill);
    return skill;
  }

  deleteCustomSkill(id: string): boolean {
    const skill = this.skills.get(id);
    if (!skill) return false;
    // Initial core skills cannot be deleted (only deactivated)
    if (!skill.isCustom && INITIAL_SKILLS.some(s => s.id === id)) {
      throw new Error('Core system skills cannot be deleted; you can deactivate them instead.');
    }

    this.skills.delete(id);
    const skillDir = path.join(SKILLS_DIR, id);
    if (fs.existsSync(skillDir)) {
      try {
        fs.rmSync(skillDir, { recursive: true, force: true });
      } catch (err) {
        console.warn(`Error removing skill directory ${skillDir}:`, err);
      }
    }
    return true;
  }

  private persistSkill(skill: SkillDefinition) {
    try {
      const skillDir = path.join(SKILLS_DIR, skill.id);
      if (!fs.existsSync(skillDir)) {
        fs.mkdirSync(skillDir, { recursive: true });
      }
      fs.writeFileSync(path.join(skillDir, 'metadata.json'), JSON.stringify(skill, null, 2), 'utf-8');
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skill.markdownContent || this.generateSkillMarkdown(skill), 'utf-8');
    } catch (err) {
      console.warn(`Error persisting skill ${skill.id}:`, err);
    }
  }
}

export const skillsRegistry = new SkillsRegistry();
