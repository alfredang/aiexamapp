/**
 * Claude Certified Architect — Foundations (CCA-F) — Practice Exam 3 (P3).
 *
 * 60 net-new scenario questions authored against the public Anthropic
 * documentation (docs.claude.com, docs.anthropic.com, modelcontextprotocol.io),
 * distinct from P1 and P2. Distributed to the published CCA-F blueprint:
 *   Agent architecture and orchestration            27% (16)
 *   Tool design and MCP integration                 18% (11)
 *   Claude Code configuration and workflows         20% (12)
 *   Prompt engineering and structured output        20% (12)
 *   Context management and reliability              15% (9)
 *
 * Leans into the Structured Data Extraction and Claude-Code-for-CI scenarios
 * alongside the Customer Support and Conversational patterns, with no stem
 * reuse from P1/P2.
 *
 * Independent practice questions, not real or official exam items.
 */
import { QType } from '@prisma/client';
import type { CcaQ } from './cca-foundations-p2-questions';

// Domain strings MUST exactly match CCA_DOMAINS in cca-foundations-questions.ts
// (the exam blueprint) so the per-domain results breakdown maps correctly.
const AGENTIC = 'Agentic Architecture & Orchestration';
const TOOLS = 'Tool Design & MCP Integration';
const CLAUDE_CODE = 'Claude Code Configuration & Workflows';
const PROMPT = 'Prompt Engineering & Structured Output';
const CONTEXT = 'Context Management & Reliability';

const R_AGENTS = { label: 'Anthropic — Building effective agents', url: 'https://www.anthropic.com/research/building-effective-agents' };
const R_SDK = { label: 'Anthropic — Claude Agent SDK overview', url: 'https://docs.claude.com/en/api/agent-sdk/overview' };
const R_TOOLUSE = { label: 'Anthropic — Tool use (function calling)', url: 'https://docs.claude.com/en/docs/build-with-claude/tool-use/overview' };
const R_TOOLCHOICE = { label: 'Anthropic — Implement tool use (tool_choice)', url: 'https://docs.claude.com/en/docs/build-with-claude/tool-use/implement-tool-use' };
const R_MESSAGES = { label: 'Anthropic — Messages API', url: 'https://docs.claude.com/en/api/messages' };
const R_MCP = { label: 'Model Context Protocol — Introduction', url: 'https://modelcontextprotocol.io/introduction' };
const R_MCP_CC = { label: 'Anthropic — MCP in Claude Code', url: 'https://docs.claude.com/en/docs/claude-code/mcp' };
const R_CC_OVERVIEW = { label: 'Anthropic — Claude Code overview', url: 'https://docs.claude.com/en/docs/claude-code/overview' };
const R_CC_SETTINGS = { label: 'Anthropic — Claude Code settings & precedence', url: 'https://docs.claude.com/en/docs/claude-code/settings' };
const R_CC_HOOKS = { label: 'Anthropic — Claude Code hooks', url: 'https://docs.claude.com/en/docs/claude-code/hooks' };
const R_CC_SKILLS = { label: 'Anthropic — Agent Skills', url: 'https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview' };
const R_CC_SUBAGENTS = { label: 'Anthropic — Claude Code subagents', url: 'https://docs.claude.com/en/docs/claude-code/sub-agents' };
const R_CC_CLI = { label: 'Anthropic — Claude Code CLI reference', url: 'https://docs.claude.com/en/docs/claude-code/cli-reference' };
const R_PROMPT = { label: 'Anthropic — Prompt engineering overview', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview' };
const R_XML = { label: 'Anthropic — Use XML tags to structure prompts', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags' };
const R_PREFILL = { label: 'Anthropic — Prefill Claude\'s response', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/prefill-claudes-response' };
const R_CHAIN = { label: 'Anthropic — Chain complex prompts', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/chain-prompts' };
const R_ROLE = { label: 'Anthropic — Give Claude a role (system prompts)', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/system-prompts' };
const R_THINKING = { label: 'Anthropic — Extended thinking', url: 'https://docs.claude.com/en/docs/build-with-claude/extended-thinking' };
const R_CACHING = { label: 'Anthropic — Prompt caching', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-caching' };
const R_STREAMING = { label: 'Anthropic — Streaming messages', url: 'https://docs.claude.com/en/docs/build-with-claude/streaming' };
const R_RATELIMITS = { label: 'Anthropic — Rate limits & usage tiers', url: 'https://docs.claude.com/en/api/rate-limits' };
const R_TOKENCOUNT = { label: 'Anthropic — Token counting', url: 'https://docs.claude.com/en/docs/build-with-claude/token-counting' };
const R_VISION = { label: 'Anthropic — Vision', url: 'https://docs.claude.com/en/docs/build-with-claude/vision' };
const R_BATCHES = { label: 'Anthropic — Message Batches API', url: 'https://docs.claude.com/en/docs/build-with-claude/batch-processing' };
const R_CONTEXT_WIN = { label: 'Anthropic — Models overview (context windows)', url: 'https://docs.claude.com/en/docs/about-claude/models/overview' };
const R_STRUCT = { label: 'Anthropic — Increase output consistency (JSON)', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/increase-consistency' };

const opts4 = (a: string, b: string, c: string, d: string) => [
  { id: 'a', text: a }, { id: 'b', text: b }, { id: 'c', text: c }, { id: 'd', text: d }
];

export const CCA_P3: CcaQ[] = [
  // ───────────── Agent architecture and orchestration (16) ─────────────
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE, isTeaser: true,
    stem: 'A task must spawn a variable, up-front-unknown number of subtasks (e.g., edit however many files a refactor touches). Which Anthropic-described workflow fits best?',
    options: opts4(
      'Orchestrator-workers — a central LLM dynamically breaks down the task and delegates to workers',
      'Prompt chaining of a fixed number of steps',
      'A single prompt with no decomposition',
      'Routing to one specialized handler'),
    correct: ['a'],
    explanation: 'The orchestrator-workers workflow handles a dynamic, unknown number of subtasks by having a central model decompose the work and delegate to workers. Fixed chaining and single routing assume a known structure.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE,
    stem: 'When is parallelization with voting (run the same task several times and aggregate) most valuable?',
    options: opts4(
      'When you want higher confidence or to catch errors on a task with some variance',
      'When the task is fully deterministic and always returns one answer',
      'When you must minimize total token spend above all',
      'When the steps strictly depend on each other in sequence'),
    correct: ['a'],
    explanation: 'Running a task multiple times and aggregating boosts confidence and catches variance-driven errors. It wastes tokens on deterministic tasks and cannot parallelize strictly sequential, dependent steps.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'A support agent should escalate to a human when its confidence is low or the customer is angry. What is the cleanest place to implement this decision?',
    options: opts4(
      'An explicit escalation step/tool that triggers on defined conditions (confidence, sentiment)',
      'Hoping the model decides to escalate on its own every time',
      'A higher temperature so it escalates randomly',
      'Never escalate; always let the model answer'),
    correct: ['a'],
    explanation: 'Encoding escalation as an explicit conditional step/tool makes the human-handoff reliable and auditable. Relying on the model\'s discretion or randomness is not dependable, and never escalating ignores the requirement.',
    references: [R_AGENTS, R_SDK]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL good reasons to give each worker in a multi-agent system its own isolated context.',
    options: opts4(
      'Prevents one worker\'s large context from polluting others',
      'Limits the blast radius of an error to a single worker',
      'Allows workers to run independently in parallel',
      'Guarantees the final answer needs no synthesis step'),
    correct: ['a', 'b', 'c'],
    explanation: 'Context isolation prevents cross-pollution, contains errors, and enables independent parallel execution. It does not remove the need to synthesize the workers\' outputs into a final answer.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'A tool returns an error during the agent loop (e.g., the API it calls is down). What is the recommended way to surface this to Claude?',
    options: opts4(
      'Return a tool_result with is_error set so Claude can adapt or retry',
      'Drop the tool_result entirely and resend the same request',
      'Crash the loop and show a stack trace to the end user',
      'Silently substitute a fake successful result'),
    correct: ['a'],
    explanation: 'Returning a tool_result flagged as an error lets Claude reason about the failure and choose a recovery path. Dropping the result, crashing, or faking success all break the loop or mislead the model.',
    references: [R_TOOLUSE]
  },
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE,
    stem: 'What does the Claude Agent SDK provide on top of the raw Messages API for building agents?',
    options: opts4(
      'A managed agent loop with tools, sessions, context management, and hooks',
      'A different, incompatible model family',
      'Only a UI component library',
      'A SQL database engine'),
    correct: ['a'],
    explanation: 'The Agent SDK wraps the Messages API with a managed agent loop, tool handling, sessions, context management, and hooks. It is not a separate model, a UI kit, or a database.',
    references: [R_SDK]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'You want a long background task to run while periodically surfacing status to the user and remaining resumable. Which Agent SDK features support this?',
    options: opts4(
      'Background execution with progress/status reporting and resumable sessions',
      'Setting temperature to 0',
      'Disabling all tools',
      'Returning a single completion with no loop'),
    correct: ['a'],
    explanation: 'Background execution with status reporting plus resumable sessions is exactly what long-running, observable agent tasks need. Temperature, disabling tools, or single completions do not provide this.',
    references: [R_SDK]
  },
  {
    domain: AGENTIC, difficulty: 4, type: QType.SINGLE,
    stem: 'For auditability, an enterprise must record which sources and tool calls produced each claim in an agent\'s answer. What capability should the architecture include?',
    options: opts4(
      'Provenance/attribution tracking that links outputs to the tool calls and sources that produced them',
      'A higher max_tokens limit',
      'Turning off logging to reduce noise',
      'Random sampling of a few answers per week'),
    correct: ['a'],
    explanation: 'Provenance/attribution tracking ties each output back to the tool calls and sources behind it, supporting audit and trust. Token limits, disabling logging, or sparse sampling do not give per-claim traceability.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE,
    stem: 'Which statement reflects Anthropic\'s guidance on choosing between a workflow and an agent?',
    options: opts4(
      'Prefer workflows for well-defined, predictable tasks; use agents when flexibility and model-driven decisions are needed at scale',
      'Always choose agents, never workflows',
      'Workflows cannot use tools',
      'Agents cannot be combined with workflows'),
    correct: ['a'],
    explanation: 'Anthropic recommends workflows for predictable, well-scoped tasks and agents where dynamic, model-driven control adds value. Workflows can use tools, and the two can be combined.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'A conversational assistant must remember a user\'s preferences across separate sessions days apart. Where must that long-term memory live?',
    options: opts4(
      'In application-managed storage that is loaded into context at the start of each new session',
      'Inside the model, which remembers users automatically',
      'In the stop_sequences parameter',
      'Only in the single request\'s temperature setting'),
    correct: ['a'],
    explanation: 'Cross-session memory must be stored by the application and re-supplied as context when a new session starts, because the model does not retain user data between requests. Stop sequences and temperature are unrelated.',
    references: [R_MESSAGES, R_SDK]
  },
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE,
    stem: 'What is the minimum the application must do each iteration of a tool-using agent loop?',
    options: opts4(
      'Send the conversation, read Claude\'s response, run any requested tools, append results, and repeat until end_turn',
      'Send one request and never read the response',
      'Only count tokens',
      'Restart the conversation from scratch each step'),
    correct: ['a'],
    explanation: 'Each iteration sends the running conversation, interprets the response, executes requested tools, appends their results, and continues until Claude stops requesting tools. Restarting or ignoring responses breaks the loop.',
    references: [R_TOOLUSE, R_MESSAGES]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'An orchestrator runs five independent research workers and one occasionally throws. What design keeps the overall job resilient?',
    options: opts4(
      'Isolate failures per worker and have the synthesizer proceed with the successful results',
      'Let one worker\'s exception abort all five',
      'Share one try/catch across all workers so any failure stops everything',
      'Retry the entire batch from zero on any single failure'),
    correct: ['a'],
    explanation: 'Isolating each worker\'s failure and synthesizing from the successful results keeps the job robust. Letting one failure abort everything or always restarting the whole batch is fragile and wasteful.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE,
    stem: 'A destructive action (deleting production data) appears in an agent\'s plan. What is the recommended safeguard?',
    options: opts4(
      'Require explicit human confirmation before the destructive tool executes',
      'Let the agent proceed to keep latency low',
      'Add the word "carefully" to the prompt',
      'Lower temperature and proceed automatically'),
    correct: ['a'],
    explanation: 'Irreversible, high-impact actions should require explicit human confirmation via a gate before execution. Prompt wording and temperature do not provide a safety guarantee.',
    references: [R_AGENTS, R_SDK]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'Which is the clearest signal that you should STOP adding agentic complexity to a solution?',
    options: opts4(
      'A simpler workflow already meets the accuracy and reliability requirements',
      'The system has fewer than ten tools',
      'You have not yet built a multi-agent hierarchy',
      'The model supports extended thinking'),
    correct: ['a'],
    explanation: 'Anthropic\'s guidance is to stop at the simplest design that meets requirements; if a simpler workflow already works, added autonomy is unwarranted. Tool count, hierarchy depth, and feature availability are not reasons to add complexity.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'To debug a misbehaving multi-step agent in production, which practice is most useful?',
    options: opts4(
      'Structured logging/observability of each step\'s inputs, tool calls, and outputs',
      'Removing all logging to reduce overhead',
      'Only logging the final answer',
      'Increasing temperature to vary behavior'),
    correct: ['a'],
    explanation: 'Per-step observability (inputs, tool calls, outputs) is essential to diagnose where an agent goes wrong. Removing logging or capturing only the final answer hides the failure point.',
    references: [R_SDK, R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE,
    stem: 'In Anthropic\'s framing, what fundamentally makes a system "agentic"?',
    options: opts4(
      'The LLM drives its own actions in a loop, deciding tool use based on environment feedback',
      'It uses more than one API key',
      'It runs only in the cloud',
      'It never uses tools'),
    correct: ['a'],
    explanation: 'An agentic system has the model directing its own actions in a feedback loop, choosing tools based on results. Key count, hosting, and the absence of tools are not what define it (tools are typically central).',
    references: [R_AGENTS]
  },

  // ───────────── Tool design and MCP integration (11) ─────────────
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'What does a tool\'s input_schema use to describe its parameters?',
    options: opts4(
      'JSON Schema (types, required fields, descriptions)',
      'A SQL DDL statement',
      'A Python class definition',
      'A regular expression'),
    correct: ['a'],
    explanation: 'A tool\'s input_schema is expressed as JSON Schema, declaring parameter types, required fields, and descriptions. It is not SQL, a Python class, or a regex.',
    references: [R_TOOLUSE]
  },
  {
    domain: TOOLS, difficulty: 3, type: QType.SINGLE,
    stem: 'Setting tool_choice to "auto" versus a specific tool has what effect?',
    options: opts4(
      '"auto" lets Claude decide whether and which tool to call; a specific value forces that tool',
      'Both force the same single tool',
      '"auto" disables tools entirely',
      'A specific value lets Claude answer in prose instead'),
    correct: ['a'],
    explanation: 'With "auto", Claude chooses whether to use a tool and which one; naming a specific tool forces that call. "auto" does not disable tools, and forcing a tool prevents a plain-prose answer.',
    references: [R_TOOLCHOICE]
  },
  {
    domain: TOOLS, difficulty: 3, type: QType.SINGLE,
    stem: 'A team is tempted to register 40 overlapping tools. Why is fewer, well-scoped tools usually better?',
    options: opts4(
      'Overlapping or ambiguous tools make correct selection harder and degrade reliability',
      'There is a hard limit of exactly three tools',
      'More tools always improve accuracy',
      'Tool count has no effect on selection'),
    correct: ['a'],
    explanation: 'Too many overlapping tools blur selection boundaries and hurt reliability; clear, well-scoped tools with good descriptions are better. There is no fixed three-tool cap, and more tools do not inherently help.',
    references: [R_TOOLUSE]
  },
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE,
    stem: 'The Anthropic-defined "computer use" tool is best suited to which class of problem?',
    options: opts4(
      'Tasks that require operating a graphical computer interface (clicking, typing, screenshots) when no API exists',
      'High-frequency low-latency numeric APIs',
      'Pure text summarization',
      'Storing vectors for retrieval'),
    correct: ['a'],
    explanation: 'Computer use lets Claude operate a GUI (move, click, type, read the screen) for tasks lacking a clean API. It is not the right tool for fast numeric APIs, plain summarization, or vector storage.',
    references: [R_TOOLUSE]
  },
  {
    domain: TOOLS, difficulty: 3, type: QType.SINGLE,
    stem: 'Beyond tools and resources, MCP servers can expose reusable "prompts". What are these?',
    options: opts4(
      'Predefined prompt templates a client can surface to the user or model',
      'Encrypted API keys',
      'The model weights',
      'A billing plan'),
    correct: ['a'],
    explanation: 'MCP "prompts" are reusable, server-defined prompt templates a client can offer. They are not secrets, weights, or billing constructs.',
    references: [R_MCP]
  },
  {
    domain: TOOLS, difficulty: 3, type: QType.SINGLE,
    stem: 'A remote (HTTP) MCP server exposes sensitive company data. What should secure client-server access typically use?',
    options: opts4(
      'An authentication/authorization mechanism such as OAuth for the remote server',
      'No authentication, since MCP handles it invisibly',
      'Embedding the password in the tool name',
      'Running it only at midnight'),
    correct: ['a'],
    explanation: 'Remote MCP servers handling sensitive data should be protected by proper auth (e.g., OAuth). MCP does not magically authenticate for you, and credential-in-name or time-based tricks are not security.',
    references: [R_MCP, R_MCP_CC]
  },
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE,
    stem: 'Why might a team standardize an internal capability as an MCP server instead of a bespoke per-app integration?',
    options: opts4(
      'One server can serve many MCP clients (Claude Code, the API, other hosts) with a single implementation',
      'It forces all apps to share one API key',
      'It prevents the capability from ever being updated',
      'It makes the capability invisible to every client'),
    correct: ['a'],
    explanation: 'An MCP server is a single implementation reusable across any MCP-compatible client, reducing duplication. It does not force shared keys, freeze the capability, or hide it.',
    references: [R_MCP]
  },
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE,
    stem: 'A tool_result block can carry which kinds of content back to Claude?',
    options: opts4(
      'Text and, where supported, structured/image content describing the result',
      'Only a single integer',
      'Only the literal string "ok"',
      'Nothing — results cannot be returned'),
    correct: ['a'],
    explanation: 'Tool results can return text and, where supported, richer content such as images. They are not restricted to a bare integer or fixed string, and results are definitely returnable.',
    references: [R_TOOLUSE]
  },
  {
    domain: TOOLS, difficulty: 3, type: QType.SINGLE,
    stem: 'A "get_account_balance" tool is being chosen for unrelated questions. Which fix targets the root cause?',
    options: opts4(
      'Sharpen the description with precise scope and explicit "when NOT to use" guidance',
      'Rename it to a random string',
      'Increase max_tokens',
      'Add ten more similar tools'),
    correct: ['a'],
    explanation: 'Mis-selection is usually a description problem; tightening scope and stating when not to use it fixes the root cause. Random renaming, token limits, and adding similar tools do not.',
    references: [R_TOOLUSE]
  },
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE,
    stem: 'Which statement about MCP and the Messages API tools is accurate?',
    options: opts4(
      'MCP standardizes tool/resource connectivity across clients; Messages API tools are declared per-request to a single model call',
      'They are the same thing under different names',
      'MCP replaces the need for the Messages API',
      'Messages API tools can only be defined via MCP'),
    correct: ['a'],
    explanation: 'MCP is a cross-client standard for connecting tools/resources, while Messages API tools are declared inline per request. MCP complements rather than replaces the API, and inline tools do not require MCP.',
    references: [R_MCP, R_TOOLUSE]
  },
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE,
    stem: 'What identifies the data a client can read from an MCP server\'s resources?',
    options: opts4(
      'A URI scheme the server defines for each resource',
      'A row number in a spreadsheet',
      'The client\'s temperature setting',
      'The model name'),
    correct: ['a'],
    explanation: 'MCP resources are addressed by URIs the server defines, letting clients read specific content. Spreadsheet rows, temperature, and model names do not identify resources.',
    references: [R_MCP]
  },

  // ───────────── Claude Code Configuration & Workflows (12) ─────────────
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.SINGLE, isTeaser: true,
    stem: 'Two settings files disagree on a permission: an enterprise-managed policy and a personal user setting. Which generally wins?',
    options: opts4(
      'The enterprise-managed policy takes precedence over user/project settings',
      'The personal user setting always overrides everything',
      'Whichever file was edited most recently',
      'They cancel out and the rule is ignored'),
    correct: ['a'],
    explanation: 'Claude Code resolves settings by precedence, and enterprise-managed policies sit above user and project settings so organizations can enforce rules. Recency or cancellation is not how precedence works.',
    references: [R_CC_SETTINGS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE,
    stem: 'A hook should run once when a Claude Code session begins (e.g., to print environment info). Which event fits?',
    options: opts4(
      'SessionStart',
      'PostToolUse',
      'PreCompact',
      'Stop'),
    correct: ['a'],
    explanation: 'SessionStart fires at the beginning of a session, the right place for startup actions. PostToolUse, PreCompact, and Stop fire at other points in the lifecycle.',
    references: [R_CC_HOOKS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.SINGLE,
    stem: 'A PreToolUse hook should only intercept Bash commands, not file edits. How is that targeting expressed?',
    options: opts4(
      'With a matcher that scopes the hook to the Bash tool',
      'By renaming the Bash tool',
      'It cannot be scoped; hooks run on everything',
      'By lowering the model temperature'),
    correct: ['a'],
    explanation: 'Hooks support matchers that scope them to specific tools (e.g., Bash), so they only fire for matching calls. Hooks are not all-or-nothing, and renaming/temperature are irrelevant.',
    references: [R_CC_HOOKS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE,
    stem: 'A Claude Code skill is defined primarily by which file?',
    options: opts4(
      'A SKILL.md with frontmatter (name/description) plus optional scripts and resources',
      'A binary executable only',
      'A package-lock.json',
      'An .env file'),
    correct: ['a'],
    explanation: 'A skill is packaged around a SKILL.md (with a name/description and instructions) plus optional scripts and resources Claude can use. Lockfiles, env files, and bare binaries do not define skills.',
    references: [R_CC_SKILLS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.SINGLE,
    stem: 'In a CI job you need Claude Code\'s result as machine-readable output for the next step. What should you use?',
    options: opts4(
      'Headless mode (-p) with a JSON output format flag',
      'Screenshots of the terminal',
      'Copy-pasting by hand',
      'The interactive TUI'),
    correct: ['a'],
    explanation: 'Running headless (-p) with a JSON output format yields structured results a CI pipeline can parse. Screenshots, manual copying, and the interactive TUI are unsuitable for automation.',
    references: [R_CC_CLI]
  },
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL valid permission modes/decisions Claude Code can apply to a tool action.',
    options: opts4(
      'Allow',
      'Ask (prompt the user)',
      'Deny',
      'Encrypt the tool'),
    correct: ['a', 'b', 'c'],
    explanation: 'Claude Code permission rules resolve to allow, ask, or deny for a given action. "Encrypt the tool" is not a permission decision.',
    references: [R_CC_SETTINGS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE,
    stem: 'How do you share an MCP server with everyone who clones a repo?',
    options: opts4(
      'Configure it at project scope via a checked-in file (e.g., .mcp.json)',
      'Put it only in your personal user config',
      'Email the server URL to teammates each time',
      'Hard-code it into the application binary'),
    correct: ['a'],
    explanation: 'A project-scope MCP configuration checked into the repo (such as .mcp.json) is shared with everyone who clones it. Personal config is not shared, and emailing or hard-coding is not the mechanism.',
    references: [R_MCP_CC]
  },
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE,
    stem: 'A project slash command needs to accept an argument (e.g., /fix-issue 123). How is the argument referenced in the command file?',
    options: opts4(
      'Via the command\'s argument placeholder (e.g., $ARGUMENTS) in the markdown',
      'It is impossible; slash commands take no arguments',
      'Through the system prompt only',
      'By editing the model weights'),
    correct: ['a'],
    explanation: 'Slash command markdown can reference passed arguments through an argument placeholder, letting /fix-issue 123 feed "123" into the command. Slash commands do support arguments.',
    references: [R_CC_OVERVIEW]
  },
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.SINGLE,
    stem: 'Where are project-scoped Claude Code subagents typically defined so the whole team gets them?',
    options: opts4(
      'As files under the project\'s .claude/agents directory, checked into the repo',
      'Only in each user\'s home directory',
      'Inside node_modules',
      'In the model\'s training data'),
    correct: ['a'],
    explanation: 'Project subagents live in the repo (e.g., .claude/agents) so they are shared with the team. Home-only definitions are not shared, and node_modules/training data are not where they are configured.',
    references: [R_CC_SUBAGENTS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE,
    stem: 'What is the main reason to keep a concise, accurate CLAUDE.md rather than an exhaustive one?',
    options: opts4(
      'It is loaded into context every session, so signal-dense content helps and bloat wastes context',
      'Longer files always make Claude smarter',
      'CLAUDE.md is never actually read',
      'It must contain the full git history'),
    correct: ['a'],
    explanation: 'Because CLAUDE.md is loaded each session, concise high-signal guidance is most effective and excessive bloat wastes context. It is read (not ignored) and should not contain irrelevant dumps.',
    references: [R_CC_OVERVIEW]
  },
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.SINGLE,
    stem: 'A team wants automated linting to run and block commit when Claude Code finishes editing. Which mechanism is appropriate?',
    options: opts4(
      'A hook (e.g., on Stop or PostToolUse) that runs the linter and can block on failure',
      'Asking the model nicely in every prompt',
      'A slash command the user must remember to run',
      'Nothing can run automatically after edits'),
    correct: ['a'],
    explanation: 'Hooks let you run a linter automatically at defined lifecycle points and block on failure, enforcing the gate deterministically. Manual prompts or commands are not reliable automation.',
    references: [R_CC_HOOKS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE,
    stem: 'Which is TRUE about how Claude Code resolves configuration for a session?',
    options: opts4(
      'It applies a defined precedence across enterprise, user (global), and project settings',
      'It only ever reads a single hard-coded file',
      'Configuration cannot be changed',
      'Settings are random per session'),
    correct: ['a'],
    explanation: 'Claude Code layers settings across enterprise, user, and project scopes using a defined precedence order. It is neither a single fixed file nor random.',
    references: [R_CC_SETTINGS]
  },

  // ───────────── Prompt engineering and structured output (12) ─────────────
  {
    domain: PROMPT, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'You are extracting fields (vendor, date, total) from invoices into JSON. What is the most reliable mechanism?',
    options: opts4(
      'Define a tool whose input_schema encodes the fields and let Claude return structured input',
      'Ask for JSON in prose and parse whatever comes back',
      'Use a high temperature for variety',
      'Request the answer as a paragraph'),
    correct: ['a'],
    explanation: 'Schema-driven extraction via a tool input is the most reliable way to get consistent structured JSON. Free-form prose and high temperature reduce parseability.',
    references: [R_STRUCT, R_TOOLUSE]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.SINGLE,
    stem: 'Why assign Claude an explicit role via the system prompt (e.g., "You are a meticulous financial-data extractor")?',
    options: opts4(
      'Role prompting steers tone, focus, and domain behavior consistently across the conversation',
      'It increases the context window size',
      'It disables tool use',
      'It is required or the API errors'),
    correct: ['a'],
    explanation: 'A clear role in the system prompt shapes tone and domain behavior throughout the conversation. It does not change the context window, disable tools, or be mandatory.',
    references: [R_ROLE]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.SINGLE,
    stem: 'For deterministic data extraction, what temperature setting is usually preferable?',
    options: opts4(
      'A low temperature (near 0) to maximize consistency',
      'A high temperature for creativity',
      'Temperature is irrelevant to extraction',
      'The maximum allowed value'),
    correct: ['a'],
    explanation: 'Low temperature yields more deterministic, consistent output, which suits structured extraction. High temperature introduces variability that hurts repeatable extraction.',
    references: [R_MESSAGES]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.SINGLE,
    stem: 'You want a JSON object and nothing else. Combining which two techniques is most robust?',
    options: opts4(
      'Define the schema as a tool input, and/or prefill the assistant turn with "{"',
      'Ask twice and average the strings',
      'Raise temperature and hope',
      'Put the schema in stop_sequences'),
    correct: ['a'],
    explanation: 'Using a tool input schema (and optionally prefilling "{" to force JSON to start) reliably constrains the output to structured JSON. Averaging strings, raising temperature, or misusing stop sequences do not.',
    references: [R_STRUCT, R_PREFILL]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL practices that improve a multi-document prompt where Claude must cite which document an answer came from.',
    options: opts4(
      'Wrap each document in tags with an id/label',
      'Ask Claude to reference the document id in its answer',
      'Provide explicit instructions/criteria for citation',
      'Concatenate all documents with no separators'),
    correct: ['a', 'b', 'c'],
    explanation: 'Tagging documents with ids, instructing Claude to cite those ids, and giving explicit citation criteria all improve attributable answers. Concatenating with no separators makes attribution unreliable.',
    references: [R_XML, R_PROMPT]
  },
  {
    domain: PROMPT, difficulty: 2, type: QType.SINGLE,
    stem: 'How many examples should a few-shot prompt use?',
    options: opts4(
      'Enough relevant, representative examples to cover the important cases — quality and coverage over sheer count',
      'Always exactly one',
      'As many as physically fit, regardless of relevance',
      'Zero is always best'),
    correct: ['a'],
    explanation: 'Use enough relevant, representative examples to cover the important variations; coverage and relevance matter more than raw count. Neither a fixed single example nor maximal irrelevant padding is ideal.',
    references: [R_PROMPT]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.SINGLE,
    stem: 'When does breaking a task into a chain of prompts most help accuracy?',
    options: opts4(
      'When a complex task has distinct subtasks that each benefit from focused attention and validation',
      'When the task is a single trivial lookup',
      'When you want to minimize the number of model calls',
      'When the steps have no relationship to each other'),
    correct: ['a'],
    explanation: 'Chaining helps when a complex task decomposes into distinct subtasks that each benefit from focus and intermediate validation. Trivial tasks or a hard call-minimization goal do not benefit.',
    references: [R_CHAIN]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.SINGLE,
    stem: 'On models that support interleaved extended thinking with tool use, what is the benefit?',
    options: opts4(
      'Claude can reason between tool calls, improving multi-step tool-using decisions',
      'It removes the need for any tools',
      'It guarantees zero errors',
      'It only changes output formatting'),
    correct: ['a'],
    explanation: 'Interleaved thinking lets the model reason between tool calls, improving complex multi-step tool decisions. It does not remove tools, guarantee correctness, or merely reformat output.',
    references: [R_THINKING]
  },
  {
    domain: PROMPT, difficulty: 2, type: QType.SINGLE,
    stem: 'A receipts agent must process two images (front and back) in one request. How are multiple images supplied?',
    options: opts4(
      'As multiple image content blocks within the same user message, in order',
      'As two separate system prompts',
      'By concatenating their bytes into one string',
      'Only one image is ever allowed per request'),
    correct: ['a'],
    explanation: 'Multiple images are sent as multiple image content blocks in the same user message, preserving order. They are not passed via system prompts or as concatenated bytes, and more than one image is supported.',
    references: [R_VISION]
  },
  {
    domain: PROMPT, difficulty: 2, type: QType.SINGLE,
    stem: 'To reduce hallucination when answering from provided context, which instruction is most effective?',
    options: opts4(
      'Tell Claude to answer only from the supplied context and to say it does not know if the answer is absent',
      'Tell Claude to always produce an answer no matter what',
      'Raise temperature for confidence',
      'Hide the context to force reasoning'),
    correct: ['a'],
    explanation: 'Explicitly grounding answers in the supplied context and permitting "I don\'t know" reduces fabrication. Forcing an answer, raising temperature, or hiding context increases hallucination risk.',
    references: [R_PROMPT]
  },
  {
    domain: PROMPT, difficulty: 2, type: QType.SINGLE,
    stem: 'What is the role of explicit success criteria in a prompt?',
    options: opts4(
      'They tell Claude exactly what a good answer must satisfy, improving consistency and gradeability',
      'They make the response longer for its own sake',
      'They are decorative and ignored',
      'They replace the need for any examples'),
    correct: ['a'],
    explanation: 'Stating explicit success criteria clarifies what a good answer requires, improving consistency. They are not decorative, and while helpful, they complement rather than fully replace examples.',
    references: [R_PROMPT]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.SINGLE,
    stem: 'A support reply must end exactly after a closing tag so a parser can split turns. Which parameter cleanly enforces the stopping point?',
    options: opts4(
      'stop_sequences set to the closing tag',
      'A higher temperature',
      'max_tokens set to 1',
      'tool_choice'),
    correct: ['a'],
    explanation: 'A stop sequence halts generation exactly when the closing tag is produced, giving the parser a clean boundary. Temperature, a 1-token cap, and tool_choice do not serve this purpose.',
    references: [R_MESSAGES]
  },

  // ───────────── Context management and reliability (9) ─────────────
  {
    domain: CONTEXT, difficulty: 3, type: QType.SINGLE, isTeaser: true,
    stem: 'With prompt caching, which part of a request should you mark as the cached prefix for best savings?',
    options: opts4(
      'The large, stable content reused across calls (e.g., system prompt + long reference docs), with the variable user input after it',
      'The user\'s unique question each time',
      'Random spans of the prompt',
      'Nothing should be cached'),
    correct: ['a'],
    explanation: 'Cache the large, stable prefix (system prompt, reference material) and keep the variable user input after the cache breakpoint to maximize reuse. Caching the unique question or random spans yields little benefit.',
    references: [R_CACHING]
  },
  {
    domain: CONTEXT, difficulty: 3, type: QType.SINGLE,
    stem: 'What is the cost characteristic of a prompt cache write versus a cache hit?',
    options: opts4(
      'Writing to the cache costs a bit more than a normal input token, but subsequent cache hits are much cheaper',
      'Cache writes and hits both cost the same as normal tokens',
      'Cache hits cost more than writes',
      'Caching is always free'),
    correct: ['a'],
    explanation: 'A cache write has a small premium over normal input tokens, but reads (hits) are substantially cheaper, so reuse across many calls pays off. Caching is not free and hits are not more expensive than writes.',
    references: [R_CACHING]
  },
  {
    domain: CONTEXT, difficulty: 2, type: QType.SINGLE,
    stem: 'An app hits a 429 from the API under burst load. What is the correct first response?',
    options: opts4(
      'Back off and retry per the rate-limit/retry-after headers',
      'Spin in a tight retry loop with no delay',
      'Switch to a smaller context window',
      'Raise temperature'),
    correct: ['a'],
    explanation: 'A 429 means rate-limited; back off and retry honoring the rate-limit/retry-after headers. Tight retries worsen throttling, and window/temperature changes are unrelated.',
    references: [R_RATELIMITS]
  },
  {
    domain: CONTEXT, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL true statements about Anthropic API rate limits and usage tiers.',
    options: opts4(
      'Limits apply to requests and tokens per unit time',
      'Higher usage tiers generally raise the limits',
      '429 responses indicate you have exceeded a limit',
      'Limits are unlimited on every account by default'),
    correct: ['a', 'b', 'c'],
    explanation: 'Rate limits constrain requests and tokens over time, scale up with usage tiers, and are signalled by 429 responses. They are not unlimited by default.',
    references: [R_RATELIMITS]
  },
  {
    domain: CONTEXT, difficulty: 2, type: QType.SINGLE,
    stem: 'Before sending a large request, you want to confirm it fits the context window without being billed for a generation. What do you use?',
    options: opts4(
      'The token counting endpoint to measure input tokens',
      'A trial generation with max_tokens=4096',
      'The batches endpoint',
      'Streaming with temperature 0'),
    correct: ['a'],
    explanation: 'Token counting returns the input token total without a billed generation, so you can verify it fits. A trial generation bills you, and batches/streaming do not provide a free measurement.',
    references: [R_TOKENCOUNT, R_CONTEXT_WIN]
  },
  {
    domain: CONTEXT, difficulty: 3, type: QType.SINGLE,
    stem: 'During streaming, which sequence of events does the API emit for a response?',
    options: opts4(
      'A message_start, then content_block deltas, then message_stop-style completion events',
      'A single final event only',
      'Only error events',
      'Nothing until the very end'),
    correct: ['a'],
    explanation: 'Streaming emits a start event, incremental content_block delta events, and completion events, letting clients render progressively. It is not a single end-only event.',
    references: [R_STREAMING]
  },
  {
    domain: CONTEXT, difficulty: 3, type: QType.SINGLE,
    stem: 'You submitted a large Message Batch. How do you obtain the outputs?',
    options: opts4(
      'Poll the batch status and retrieve results once it completes (within the results retention window)',
      'Results stream back synchronously in the submit call',
      'They are emailed automatically',
      'Batches never return results'),
    correct: ['a'],
    explanation: 'Batch processing is asynchronous: you poll for completion and then retrieve results while they are retained. It is not synchronous, emailed, or result-less.',
    references: [R_BATCHES]
  },
  {
    domain: CONTEXT, difficulty: 2, type: QType.SINGLE,
    stem: 'Different Claude models can differ in which key capacity dimension relevant to large inputs?',
    options: opts4(
      'Maximum context window size',
      'The color of their responses',
      'The number of letters in their name',
      'Their requirement to use streaming'),
    correct: ['a'],
    explanation: 'Models differ in maximum context window (and other specs), which determines how much input they can accept. The other options are not real capability dimensions.',
    references: [R_CONTEXT_WIN]
  },
  {
    domain: CONTEXT, difficulty: 3, type: QType.SINGLE,
    stem: 'To make retrying a failed generation safe and avoid duplicate side effects, what should the application do?',
    options: opts4(
      'Make the surrounding operation idempotent (e.g., dedupe by a request key) so a retry cannot double-apply effects',
      'Always retry blindly and accept duplicates',
      'Never retry, even on transient errors',
      'Raise temperature on the retry'),
    correct: ['a'],
    explanation: 'Designing the operation to be idempotent (e.g., keyed dedupe) means a safe retry will not double-apply effects like sending an email twice. Blind retries risk duplicates, and never retrying loses recoverable requests.',
    references: [R_RATELIMITS, R_MESSAGES]
  }
];
