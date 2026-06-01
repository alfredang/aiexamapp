/**
 * Claude Certified Architect — Foundations (CCA-F) — Practice Exam 2 (P2).
 *
 * 60 net-new scenario questions authored against the public Anthropic
 * documentation (docs.claude.com, docs.anthropic.com, modelcontextprotocol.io),
 * distinct from the P1 set. Distributed to the published CCA-F blueprint:
 *   Agent architecture and orchestration            27% (16)
 *   Tool design and MCP integration                 18% (11)
 *   Claude Code configuration and workflows         20% (12)
 *   Prompt engineering and structured output        20% (12)
 *   Context management and reliability              15% (9)
 *
 * This variant leans into the two scenarios that were light in P1 — the
 * Customer Support Agent (returns/billing/escalation) and Conversational AI
 * patterns (multi-turn state/memory) — without reusing any P1 stems.
 *
 * Independent practice questions, not real or official exam items.
 */
import { QType } from '@prisma/client';

export type Opt = { id: string; text: string };
export type CcaQ = {
  domain: string;
  difficulty: number;
  type: QType;
  stem: string;
  options: Opt[];
  correct: string[];
  explanation: string;
  references: { label: string; url: string }[];
  isTeaser?: boolean;
};

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
const R_TOOLCHOICE = { label: 'Anthropic — Controlling Claude\'s output (tool_choice)', url: 'https://docs.claude.com/en/docs/build-with-claude/tool-use/implement-tool-use' };
const R_MESSAGES = { label: 'Anthropic — Messages API', url: 'https://docs.claude.com/en/api/messages' };
const R_MCP = { label: 'Model Context Protocol — Introduction', url: 'https://modelcontextprotocol.io/introduction' };
const R_MCP_CC = { label: 'Anthropic — MCP in Claude Code', url: 'https://docs.claude.com/en/docs/claude-code/mcp' };
const R_CC_OVERVIEW = { label: 'Anthropic — Claude Code overview', url: 'https://docs.claude.com/en/docs/claude-code/overview' };
const R_CC_SETTINGS = { label: 'Anthropic — Claude Code settings', url: 'https://docs.claude.com/en/docs/claude-code/settings' };
const R_CC_HOOKS = { label: 'Anthropic — Claude Code hooks', url: 'https://docs.claude.com/en/docs/claude-code/hooks' };
const R_CC_SKILLS = { label: 'Anthropic — Agent Skills', url: 'https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview' };
const R_CC_SUBAGENTS = { label: 'Anthropic — Claude Code subagents', url: 'https://docs.claude.com/en/docs/claude-code/sub-agents' };
const R_CC_CLI = { label: 'Anthropic — Claude Code CLI reference', url: 'https://docs.claude.com/en/docs/claude-code/cli-reference' };
const R_PROMPT = { label: 'Anthropic — Prompt engineering overview', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview' };
const R_XML = { label: 'Anthropic — Use XML tags to structure prompts', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags' };
const R_PREFILL = { label: 'Anthropic — Prefill Claude\'s response', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/prefill-claudes-response' };
const R_CHAIN = { label: 'Anthropic — Chain complex prompts', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/chain-prompts' };
const R_THINKING = { label: 'Anthropic — Extended thinking', url: 'https://docs.claude.com/en/docs/build-with-claude/extended-thinking' };
const R_CACHING = { label: 'Anthropic — Prompt caching', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-caching' };
const R_STREAMING = { label: 'Anthropic — Streaming messages', url: 'https://docs.claude.com/en/docs/build-with-claude/streaming' };
const R_RATELIMITS = { label: 'Anthropic — Rate limits', url: 'https://docs.claude.com/en/api/rate-limits' };
const R_TOKENCOUNT = { label: 'Anthropic — Token counting', url: 'https://docs.claude.com/en/docs/build-with-claude/token-counting' };
const R_VISION = { label: 'Anthropic — Vision', url: 'https://docs.claude.com/en/docs/build-with-claude/vision' };
const R_BATCHES = { label: 'Anthropic — Message Batches API', url: 'https://docs.claude.com/en/docs/build-with-claude/batch-processing' };
const R_CONTEXT_WIN = { label: 'Anthropic — Models overview (context windows)', url: 'https://docs.claude.com/en/docs/about-claude/models/overview' };
const R_STRUCT = { label: 'Anthropic — Increase output consistency (JSON)', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/increase-consistency' };

const opts4 = (a: string, b: string, c: string, d: string): Opt[] => [
  { id: 'a', text: a }, { id: 'b', text: b }, { id: 'c', text: c }, { id: 'd', text: d }
];

export const CCA_P2: CcaQ[] = [
  // ───────────── Agent architecture and orchestration (16) ─────────────
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'A customer-support agent handles refunds. Company policy says any refund over $500 must be approved by a human before it is issued. What is the most reliable way to enforce this in an agentic system?',
    options: opts4(
      'Gate the refund tool behind a human-in-the-loop approval step for amounts over the threshold',
      'Add a sentence to the system prompt telling Claude to "be careful with large refunds"',
      'Lower the model temperature so it refunds less often',
      'Let the agent issue the refund and email a human afterward'),
    correct: ['a'],
    explanation: 'Policy limits on irreversible actions should be enforced with a deterministic human-in-the-loop gate around the tool, not left to the model\'s discretion. Prompt wording and temperature do not guarantee the rule, and after-the-fact email does not prevent an over-threshold refund.',
    references: [R_AGENTS, R_SDK]
  },
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE,
    stem: 'Anthropic distinguishes "workflows" from "agents". Which description matches an agent rather than a workflow?',
    options: opts4(
      'The model dynamically directs its own process and tool use, controlling how it accomplishes the task',
      'LLM calls are orchestrated through predefined, fixed code paths',
      'A single prompt produces a single response with no tools',
      'A cron job calls the same prompt on a schedule'),
    correct: ['a'],
    explanation: 'In Anthropic\'s framing, agents let the model dynamically direct its own process and tool usage, while workflows orchestrate LLMs through predefined code paths. The other options describe fixed or single-shot patterns.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'A support agent must look up an order, check a refund policy, and message the customer. The steps are known and fixed in advance. Which pattern is the better fit and why?',
    options: opts4(
      'A prompt-chaining workflow, because the steps are predictable and decomposable',
      'A fully autonomous agent loop, because more autonomy is always better',
      'A single prompt with all three tasks crammed in, for speed',
      'Parallel independent agents with no coordination'),
    correct: ['a'],
    explanation: 'When the task decomposes into fixed, predictable subtasks, a prompt-chaining workflow trades a little latency for higher accuracy and is preferable to open-ended autonomy. Full autonomy adds risk without benefit here, and cramming everything into one prompt reduces reliability.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL situations where delegating to a subagent (a fresh Claude context) is a good design choice.',
    options: opts4(
      'A focused sub-task needs its own large context that would otherwise pollute the main conversation',
      'You want to fan out several independent investigations in parallel',
      'Every single tool call the main agent makes',
      'A trivial one-line string formatting step'),
    correct: ['a', 'b'],
    explanation: 'Subagents are valuable when a sub-task needs isolation from the main context or when independent work can fan out in parallel. Wrapping every tool call or a trivial step in a subagent only adds latency and token cost.',
    references: [R_AGENTS, R_CC_SUBAGENTS]
  },
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE,
    stem: 'In the Messages API agent loop, Claude responds with stop_reason "tool_use". What must the application do next to continue the loop?',
    options: opts4(
      'Execute the requested tool(s) and send the results back as a user message with tool_result blocks',
      'Immediately stop and return the partial answer to the user',
      'Resend the exact same request unchanged',
      'Switch the model to a larger one and retry'),
    correct: ['a'],
    explanation: 'A "tool_use" stop reason means Claude wants tool execution; the app runs the tools and returns tool_result blocks in a new user message so Claude can continue. Stopping, blindly resending, or swapping models does not advance the loop.',
    references: [R_TOOLUSE, R_MESSAGES]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'A long-running research agent must survive a process restart and resume where it left off. Which capability of the Claude Agent SDK most directly supports this?',
    options: opts4(
      'Session persistence / resumable conversations',
      'A higher temperature setting',
      'Disabling tool use',
      'Switching to single-shot completions'),
    correct: ['a'],
    explanation: 'The Agent SDK supports persistent, resumable sessions so a restarted process can continue an in-flight task. Temperature, disabling tools, or single-shot calls do not provide resumability.',
    references: [R_SDK]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'An orchestrator launches many independent agents at once. What is the safest way to combine their outputs into a final answer?',
    options: opts4(
      'Collect all results and have a synthesizer step reconcile them (hub-and-spoke)',
      'Let each agent write directly to the same shared mutable buffer concurrently',
      'Take whichever agent finishes first and ignore the rest',
      'Have the agents message each other peer-to-peer with no coordinator'),
    correct: ['a'],
    explanation: 'A hub-and-spoke design where a coordinator collects results and a synthesizer reconciles them avoids race conditions and produces a coherent answer. Shared mutable buffers race, first-wins drops information, and uncoordinated peer messaging is hard to reason about.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 4, type: QType.MULTI,
    stem: 'Select ALL true statements about parallel tool execution within a single assistant turn.',
    options: opts4(
      'Claude can request multiple tool_use blocks in one response',
      'The application may execute those independent tool calls concurrently',
      'All tool_result blocks for that turn are returned together in the next user message',
      'Parallel tool calls require a separate fine-tuned model'),
    correct: ['a', 'b', 'c'],
    explanation: 'Claude can emit several tool_use blocks in one turn, the app may run independent ones concurrently, and their results are returned together in the following user message. No special fine-tuned model is required.',
    references: [R_TOOLUSE]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'A coding agent is told "fix the failing test and deploy". You want it to pause for human confirmation before the deploy step. In the Agent SDK, which mechanism gives the most deterministic interception point?',
    options: opts4(
      'A pre-tool hook/callback that fires before the deploy tool executes',
      'A politely worded reminder in the user message',
      'Setting max_tokens very low',
      'Running the agent twice and comparing'),
    correct: ['a'],
    explanation: 'A pre-tool hook (PreToolUse callback) fires deterministically before a tool runs, making it the right place to require human confirmation for a deploy. Prompt reminders and token limits are not reliable gates.',
    references: [R_SDK, R_CC_HOOKS]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'An agent repeatedly calls the same search tool with the same query and never converges. Which mitigation most directly addresses this failure mode?',
    options: opts4(
      'Add loop detection / a max-iteration budget and feed prior results back into context',
      'Increase temperature to add randomness',
      'Remove the search tool entirely',
      'Switch from streaming to non-streaming'),
    correct: ['a'],
    explanation: 'Bounding iterations and ensuring previous tool results are visible in context lets the agent recognize it already has the answer and stop looping. Randomness, removing the tool, or stream mode changes do not fix the loop.',
    references: [R_AGENTS, R_SDK]
  },
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE,
    stem: 'For a multi-turn customer-support conversation, where should the running dialogue history live so Claude has the context on each turn?',
    options: opts4(
      'In the messages array sent with each Messages API request',
      'Only in the system prompt, rewritten each turn',
      'Nowhere — Claude remembers prior turns automatically across requests',
      'In the tool definitions'),
    correct: ['a'],
    explanation: 'The Messages API is stateless per request, so the conversation history must be supplied as the messages array on each call. Claude does not retain memory across separate API requests on its own.',
    references: [R_MESSAGES]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'A support agent\'s conversation history is growing past the context window over a long chat. Which strategy preserves continuity most safely?',
    options: opts4(
      'Summarize/compact older turns while keeping recent turns and key facts verbatim',
      'Silently drop the oldest messages with no summary',
      'Raise temperature so the model improvises the missing context',
      'Truncate the user\'s newest message instead'),
    correct: ['a'],
    explanation: 'Compacting older turns into a summary while retaining recent messages and critical facts keeps the conversation coherent within the window. Dropping history silently or trimming the newest message loses needed information.',
    references: [R_AGENTS, R_CONTEXT_WIN]
  },
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE,
    stem: 'When does a support agent loop legitimately end with stop_reason "end_turn" after a tool result?',
    options: opts4(
      'When Claude has produced its final natural-language answer and needs no more tools',
      'Whenever any tool returns an error',
      'After exactly one tool call, always',
      'Only when max_tokens is reached'),
    correct: ['a'],
    explanation: '"end_turn" means Claude finished its response and is not requesting further tool use, signalling the loop can stop. Errors, fixed call counts, or token limits are different conditions (e.g., "max_tokens").',
    references: [R_MESSAGES]
  },
  {
    domain: AGENTIC, difficulty: 4, type: QType.SINGLE,
    stem: 'When is the evaluator-optimizer (generate → critique → revise) workflow the most appropriate pattern?',
    options: opts4(
      'When there are clear evaluation criteria and iterative refinement measurably improves the output',
      'When latency must be minimized above all else',
      'When the task is a single deterministic lookup',
      'When you want to avoid using the model more than once'),
    correct: ['a'],
    explanation: 'Evaluator-optimizer loops shine when output quality can be judged against clear criteria and revision improves results, accepting extra calls for quality. It is overkill for trivial lookups or strictly latency-bound tasks.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 3, type: QType.SINGLE,
    stem: 'A routing layer must send billing questions to a billing agent and technical questions to a tech agent. Which Anthropic-described workflow does this match?',
    options: opts4(
      'Routing — classify the input, then dispatch to a specialized follow-up',
      'Parallelization — run the same task many times and vote',
      'Orchestrator-workers for an unknown number of subtasks',
      'Prompt chaining of fixed sequential steps'),
    correct: ['a'],
    explanation: 'Classifying an input and dispatching it to a specialized handler is the routing workflow. Parallelization, orchestrator-workers, and chaining describe different control structures.',
    references: [R_AGENTS]
  },
  {
    domain: AGENTIC, difficulty: 2, type: QType.SINGLE,
    stem: 'Anthropic\'s guidance on agents recommends which principle when a simpler solution suffices?',
    options: opts4(
      'Use the simplest design that works; add agentic complexity only when it demonstrably improves outcomes',
      'Always build the most autonomous multi-agent system possible',
      'Never use workflows, only agents',
      'Maximize the number of tools regardless of need'),
    correct: ['a'],
    explanation: 'Anthropic advises finding the simplest solution and only increasing complexity (autonomy, multi-agent structure) when it clearly improves results. More autonomy and more tools are not goals in themselves.',
    references: [R_AGENTS]
  },

  // ───────────── Tool design and MCP integration (11) ─────────────
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'Which field of a tool definition is the single biggest lever on whether Claude selects the tool correctly?',
    options: opts4(
      'A thorough description (what it does, inputs, when to use and when NOT to use)',
      'The order of the tool in the array',
      'The tool\'s name length',
      'The HTTP method the tool uses internally'),
    correct: ['a'],
    explanation: 'Anthropic emphasizes that a detailed tool description — purpose, inputs, and explicit use/anti-use cases — most strongly drives correct tool selection. Array order, name length, and internal implementation details are minor by comparison.',
    references: [R_TOOLUSE]
  },
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE,
    stem: 'Which three fields are required when declaring a custom tool in the Messages API tools array?',
    options: opts4(
      'name, description, and input_schema',
      'name, output_schema, and price',
      'id, prompt, and temperature',
      'endpoint, method, and headers'),
    correct: ['a'],
    explanation: 'A custom tool is declared with name, description, and an input_schema (JSON Schema for its parameters). There is no required output_schema, price, or HTTP metadata in the tool definition.',
    references: [R_TOOLUSE]
  },
  {
    domain: TOOLS, difficulty: 3, type: QType.SINGLE,
    stem: 'You must force Claude to call a specific tool on this request rather than answer in prose. Which parameter controls that?',
    options: opts4(
      'tool_choice set to that tool',
      'temperature set to 0',
      'stop_sequences',
      'max_tokens'),
    correct: ['a'],
    explanation: 'The tool_choice parameter can require a particular tool (or any tool) for the request. Temperature, stop sequences, and token limits do not force tool selection.',
    references: [R_TOOLCHOICE]
  },
  {
    domain: TOOLS, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL true statements about returning tool results to Claude.',
    options: opts4(
      'tool_result blocks are sent in a user-role message',
      'Each tool_result references the matching tool_use id',
      'A tool_result can report an error so Claude can recover',
      'Tool results must be returned as a new system prompt'),
    correct: ['a', 'b', 'c'],
    explanation: 'Tool results are returned as tool_result blocks in a user message, each tied to its tool_use id, and may carry an error flag so Claude can adapt. They are not delivered via the system prompt.',
    references: [R_TOOLUSE]
  },
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE,
    stem: 'What is the Model Context Protocol (MCP), at its core?',
    options: opts4(
      'An open standard for connecting AI applications to external tools, data, and resources via servers',
      'A proprietary Anthropic-only database',
      'A replacement for the Messages API',
      'A fine-tuning format for Claude'),
    correct: ['a'],
    explanation: 'MCP is an open protocol that standardizes how AI applications connect to external tools, data, and resources through MCP servers. It is not a database, an API replacement, or a fine-tuning format.',
    references: [R_MCP]
  },
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE,
    stem: 'An MCP server exposes both "tools" and "resources". What best distinguishes them?',
    options: opts4(
      'Tools are model-invocable actions; resources are data/content the client can read and supply as context',
      'Tools are read-only; resources perform writes',
      'They are identical and interchangeable',
      'Resources can only be images'),
    correct: ['a'],
    explanation: 'In MCP, tools are actions the model can invoke, while resources are addressable data/content a client can load as context. They are not interchangeable, and resources are not limited to images.',
    references: [R_MCP]
  },
  {
    domain: TOOLS, difficulty: 3, type: QType.SINGLE,
    stem: 'What is a key architectural advantage of exposing a capability through an MCP server instead of hard-coding it into one agent?',
    options: opts4(
      'It is reusable across any MCP-compatible client and decoupled from a single codebase',
      'It guarantees the model will always call it',
      'It removes the need for authentication',
      'It makes the tool run faster than local code in all cases'),
    correct: ['a'],
    explanation: 'An MCP server makes a capability reusable across any MCP-compatible client and decouples it from a single application. It does not force tool selection, remove auth needs, or inherently outperform local code.',
    references: [R_MCP, R_MCP_CC]
  },
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE,
    stem: 'Which transports does MCP define for connecting a client to a server?',
    options: opts4(
      'stdio (local subprocess) and HTTP-based transport',
      'Only FTP',
      'Only raw TCP sockets with a custom binary protocol',
      'Email and SMS'),
    correct: ['a'],
    explanation: 'MCP supports a local stdio transport and an HTTP-based remote transport. FTP, custom binary TCP, and messaging channels are not MCP transports.',
    references: [R_MCP]
  },
  {
    domain: TOOLS, difficulty: 3, type: QType.SINGLE,
    stem: 'You wrote an MCP server exposing a search_tickets tool and want to use it from Claude Code. What makes it available to the agent?',
    options: opts4(
      'Register the MCP server in Claude Code\'s configuration (a configured scope)',
      'Paste the server source into CLAUDE.md',
      'Rename the tool to match a built-in',
      'Nothing — Claude Code auto-discovers all servers on the machine'),
    correct: ['a'],
    explanation: 'Claude Code uses MCP servers you register in its configuration at a chosen scope; it does not auto-discover arbitrary servers or read server code from CLAUDE.md. Renaming to a built-in would not connect the server.',
    references: [R_MCP_CC]
  },
  {
    domain: TOOLS, difficulty: 3, type: QType.SINGLE,
    stem: 'A tool runs an expensive 10-second query. How should its description guide the model to use it well?',
    options: opts4(
      'State the cost/latency and the precise conditions under which calling it is worthwhile',
      'Leave the description blank so Claude calls it freely',
      'Claim it is instant to encourage frequent use',
      'Hide that it is slow to avoid discouraging calls'),
    correct: ['a'],
    explanation: 'Being explicit about cost and the right conditions for use helps the model avoid needless expensive calls. Blank or misleading descriptions lead to poor, costly tool selection.',
    references: [R_TOOLUSE]
  },
  {
    domain: TOOLS, difficulty: 2, type: QType.SINGLE,
    stem: 'TRUE or FALSE: Using MCP requires running an Anthropic-hosted service inside your VPC.',
    options: opts4(
      'False — MCP is an open standard; servers can run locally or wherever you host them',
      'True — only Anthropic can host MCP servers',
      'True — MCP servers must run in Anthropic\'s cloud',
      'False — but only stdio servers are allowed'),
    correct: ['a'],
    explanation: 'MCP is an open standard and servers can be self-hosted locally or remotely; no Anthropic-hosted component is required. Both stdio and HTTP transports are permitted.',
    references: [R_MCP]
  },

  // ───────────── Claude Code Configuration & Workflows (12) ─────────────
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'What is the primary purpose of a project-root CLAUDE.md file?',
    options: opts4(
      'Provide persistent, project-specific instructions and context Claude Code loads each session',
      'Store the user\'s API key',
      'Define the CI pipeline stages',
      'Replace the package manager lockfile'),
    correct: ['a'],
    explanation: 'CLAUDE.md supplies durable project context and instructions that Claude Code reads at session start. It is not a secrets store, CI config, or lockfile.',
    references: [R_CC_OVERVIEW]
  },
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.SINGLE,
    stem: 'A team wants a memory instruction available across all their repos plus repo-specific overrides. How does Claude Code combine CLAUDE.md files?',
    options: opts4(
      'It merges memory hierarchically — enterprise/user/project scopes layer together',
      'Only the file in the current directory is ever read',
      'It picks one file at random',
      'Project files are ignored if a user file exists'),
    correct: ['a'],
    explanation: 'Claude Code loads CLAUDE.md memory hierarchically across scopes (e.g., user/global and project), layering broader and more specific instructions. It does not read only one file or discard project context.',
    references: [R_CC_OVERVIEW]
  },
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.SINGLE,
    stem: 'You need a hook that can BLOCK a Bash command containing "rm -rf /" before it runs. Which hook event should it use?',
    options: opts4(
      'PreToolUse',
      'PostToolUse',
      'Stop',
      'SessionStart'),
    correct: ['a'],
    explanation: 'PreToolUse fires before a tool executes and can block the call, making it the right place to veto a dangerous Bash command. PostToolUse runs after execution, too late to prevent it.',
    references: [R_CC_HOOKS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE,
    stem: 'Which hook event lets you inspect or transform a tool\'s output AFTER it has executed?',
    options: opts4(
      'PostToolUse',
      'PreToolUse',
      'UserPromptSubmit',
      'Notification'),
    correct: ['a'],
    explanation: 'PostToolUse fires after a tool runs and exposes its output for inspection or transformation. PreToolUse is before execution, and the others are unrelated events.',
    references: [R_CC_HOOKS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.SINGLE,
    stem: 'To guarantee Claude Code can NEVER autonomously run your production deploy command, what is the most robust approach?',
    options: opts4(
      'A deny permission rule (and/or a PreToolUse hook) that blocks that command',
      'A polite note in CLAUDE.md asking it not to',
      'Hoping the model declines',
      'Setting a low max_tokens'),
    correct: ['a'],
    explanation: 'Permission deny rules and PreToolUse hooks are enforced by the harness, giving a hard guarantee. Instructions in CLAUDE.md and token limits are not enforcement mechanisms.',
    references: [R_CC_SETTINGS, R_CC_HOOKS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE,
    stem: 'Which Claude Code CLI flag runs a single prompt non-interactively, suitable for CI/CD?',
    options: opts4(
      'The print/headless flag (-p)',
      'The --interactive flag',
      'The --gui flag',
      'There is no non-interactive mode'),
    correct: ['a'],
    explanation: 'The -p (print/headless) flag runs Claude Code non-interactively for scripting and CI. There is no --interactive/--gui flag serving this purpose, and a non-interactive mode does exist.',
    references: [R_CC_CLI]
  },
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.SINGLE,
    stem: 'What best describes a Claude Code "skill" versus a slash command?',
    options: opts4(
      'A skill is model-discoverable (Claude invokes it when a task matches its description); a slash command is user-invoked via /name',
      'They are the same feature with two names',
      'A skill can only run shell scripts; a slash command cannot',
      'A slash command is discovered automatically; a skill must be typed'),
    correct: ['a'],
    explanation: 'Skills package instructions/resources that Claude can choose to use autonomously based on their description, whereas slash commands are explicitly invoked by the user with /name. The discovery direction is the key difference.',
    references: [R_CC_SKILLS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE,
    stem: 'A slash command file lives at .claude/commands/deploy.md in the repo. When is it invokable?',
    options: opts4(
      'As /deploy within Claude Code sessions for that project',
      'Only after publishing it to npm',
      'Never — commands must be built-in',
      'Only in the Anthropic Console'),
    correct: ['a'],
    explanation: 'A markdown file under .claude/commands becomes a project slash command (/deploy) available in Claude Code for that repo. No publishing step or console is involved.',
    references: [R_CC_OVERVIEW]
  },
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL valid scopes at which an MCP server can be configured in Claude Code.',
    options: opts4(
      'Local (just this project, private to you)',
      'Project (shared with the repo via a checked-in file)',
      'User (available across all your projects)',
      'A scope that only exists during a full moon'),
    correct: ['a', 'b', 'c'],
    explanation: 'Claude Code supports configuring MCP servers at local, project, and user scopes. The fourth option is nonsense.',
    references: [R_MCP_CC]
  },
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE,
    stem: 'A Claude Code subagent is best described as:',
    options: opts4(
      'A separate, focused Claude context the main session can delegate a sub-task to, with its own tools/prompt',
      'A second human reviewer',
      'A background OS process unrelated to Claude',
      'A cached copy of the previous answer'),
    correct: ['a'],
    explanation: 'A subagent is a delegated, focused Claude context with its own configuration that handles a sub-task and returns a result. It is not a human, an unrelated process, or a cache.',
    references: [R_CC_SUBAGENTS]
  },
  {
    domain: CLAUDE_CODE, difficulty: 2, type: QType.SINGLE,
    stem: 'You want a personal memory instruction to apply to Claude Code in EVERY repo you work in, not just one project. Where do you put it?',
    options: opts4(
      'In your user-level (global) CLAUDE.md / memory, e.g. under ~/.claude',
      'In each repo\'s project CLAUDE.md, duplicated everywhere',
      'In the application source code',
      'It is impossible to have cross-project memory'),
    correct: ['a'],
    explanation: 'A user-level (global) CLAUDE.md under your ~/.claude home directory applies across all your projects, layering with any project-specific files. Duplicating into every repo is unnecessary, and cross-project memory is supported.',
    references: [R_CC_OVERVIEW]
  },
  {
    domain: CLAUDE_CODE, difficulty: 3, type: QType.SINGLE,
    stem: 'Where should team-shared, version-controlled Claude Code permission rules live?',
    options: opts4(
      'In the project settings file checked into the repo (.claude/settings.json)',
      'Only in each developer\'s personal global settings',
      'Hard-coded into the model weights',
      'In a comment inside application source code'),
    correct: ['a'],
    explanation: 'Project-level .claude/settings.json is checked into the repo so the whole team shares the same permission rules. Personal settings are not shared, and weights/comments cannot carry permissions.',
    references: [R_CC_SETTINGS]
  },

  // ───────────── Prompt engineering and structured output (12) ─────────────
  {
    domain: PROMPT, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'A triage prompt must classify each support ticket as exactly one of: billing, technical, or other. How do you make the output reliably one of those labels?',
    options: opts4(
      'State the exact allowed labels and instruct Claude to output only one of them (optionally via a tool/enum)',
      'Leave the categories open so Claude can invent labels',
      'Raise temperature so it varies the wording',
      'Ask for a free-form paragraph and parse it later'),
    correct: ['a'],
    explanation: 'Enumerating the permitted labels and constraining the output to exactly one (optionally with a tool input whose schema is an enum) gives reliable, parseable classification. Open categories, high temperature, and free-form prose undermine consistency.',
    references: [R_STRUCT, R_PROMPT]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.SINGLE,
    stem: 'What is the most robust way to get reliably structured JSON output from Claude?',
    options: opts4(
      'Define a tool whose input_schema is the desired JSON shape and read the structured tool input',
      'Ask politely for JSON and hope formatting holds',
      'Raise temperature to make output more creative',
      'Request the JSON inside a long free-form essay'),
    correct: ['a'],
    explanation: 'Anthropic frames tools as the reliable structured-output mechanism: define the schema as a tool input and Claude returns validated structured data. Free-form requests and higher temperature reduce reliability.',
    references: [R_STRUCT, R_TOOLUSE]
  },
  {
    domain: PROMPT, difficulty: 2, type: QType.SINGLE,
    stem: 'For a conversational assistant, what is the role of the system parameter versus a user message?',
    options: opts4(
      'system sets persistent role/behavior/instructions; user messages carry the turn-by-turn conversation',
      'They are identical',
      'system is for images only',
      'user messages set the model\'s persona'),
    correct: ['a'],
    explanation: 'The system parameter establishes durable role and behavior guidance, while user messages convey the actual conversational turns. They are not interchangeable.',
    references: [R_MESSAGES, R_PROMPT]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.SINGLE,
    stem: 'You need Claude\'s reply to ALWAYS begin with the literal token <answer> so a parser can rely on it. Which technique guarantees this most directly?',
    options: opts4(
      'Prefill the assistant turn with <answer>',
      'Add "please start with <answer>" and hope',
      'Lower max_tokens',
      'Set temperature to 1.0'),
    correct: ['a'],
    explanation: 'Prefilling the assistant message with <answer> forces the response to continue from that exact token. Polite requests and token/temperature settings do not guarantee the prefix.',
    references: [R_PREFILL]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL techniques Anthropic recommends for improving answers on COMPLEX reasoning tasks.',
    options: opts4(
      'Give the model room to think step by step (e.g., extended thinking or chain-of-thought)',
      'Provide clear, explicit success criteria',
      'Break the problem into chained sub-prompts',
      'Always force a one-word answer to save tokens'),
    correct: ['a', 'b', 'c'],
    explanation: 'Allowing reasoning space, stating explicit criteria, and chaining sub-prompts all improve complex-task accuracy. Forcing terse answers removes the reasoning that complex tasks need.',
    references: [R_PROMPT, R_THINKING, R_CHAIN]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.SINGLE,
    stem: 'When chaining prompts where one Claude call feeds the next, which practice most reduces error propagation?',
    options: opts4(
      'Validate/structure each step\'s output before passing it to the next step',
      'Pass raw unchecked text straight through',
      'Use a different random seed each step',
      'Merge all steps back into one giant prompt'),
    correct: ['a'],
    explanation: 'Validating and structuring intermediate outputs prevents errors from compounding down the chain. Passing unchecked text through propagates mistakes, and collapsing the chain loses the decomposition benefit.',
    references: [R_CHAIN]
  },
  {
    domain: PROMPT, difficulty: 2, type: QType.SINGLE,
    stem: 'What makes few-shot examples most useful in a prompt?',
    options: opts4(
      'They are diverse, relevant, and demonstrate the exact desired output format',
      'They are as numerous as possible regardless of relevance',
      'They contradict each other to show variety',
      'They omit the output format to keep Claude flexible'),
    correct: ['a'],
    explanation: 'Effective examples are relevant, varied within the task, and clearly show the target output format. Contradictory, off-task, or format-free examples weaken their guidance.',
    references: [R_PROMPT]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL effective ways to let Claude reason before committing to a final answer on a hard problem (without extended thinking enabled).',
    options: opts4(
      'Instruct it to work through the steps in a <thinking> scratchpad before the answer',
      'Ask it to think step by step, then give the final answer',
      'Separate the reasoning and the final answer into clearly tagged sections',
      'Force a single-word answer with no reasoning'),
    correct: ['a', 'b', 'c'],
    explanation: 'Giving the model a scratchpad, prompting step-by-step reasoning, and separating reasoning from the final answer all improve hard-problem accuracy. Forcing a one-word answer removes the reasoning room that complex problems need.',
    references: [R_PROMPT, R_CHAIN]
  },
  {
    domain: PROMPT, difficulty: 2, type: QType.SINGLE,
    stem: 'You are building an agent that summarizes receipt images. How should the image be supplied to Claude?',
    options: opts4(
      'As an image content block in a user message alongside the text instruction',
      'As a URL pasted into the system prompt only',
      'As a tool name',
      'Encoded into the stop_sequences'),
    correct: ['a'],
    explanation: 'Vision inputs are provided as image content blocks within a user message, combined with the text prompt. They are not passed via the system prompt as a bare URL, as tool names, or in stop sequences.',
    references: [R_VISION]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.SINGLE,
    stem: 'For a very long document in the prompt, what layout does Anthropic recommend to maximize recall?',
    options: opts4(
      'Place the long document near the top and put the question/instructions after it',
      'Put the question first and the document last, always',
      'Scatter the instructions randomly through the document',
      'Remove all structure so the model reads freely'),
    correct: ['a'],
    explanation: 'Anthropic\'s long-context guidance suggests putting lengthy documents earlier and the query afterward, which improves recall. Scattering instructions or removing structure hurts performance.',
    references: [R_PROMPT]
  },
  {
    domain: PROMPT, difficulty: 2, type: QType.SINGLE,
    stem: 'TRUE or FALSE: Raising temperature reliably improves the factual accuracy of Claude\'s answers.',
    options: opts4(
      'False — higher temperature increases variability/creativity, not factual accuracy',
      'True — temperature is an accuracy dial',
      'True — but only above 1.5',
      'False — temperature has no effect at all'),
    correct: ['a'],
    explanation: 'Temperature controls randomness/creativity, not correctness; lower values are usually better for deterministic factual tasks. It does affect output, so it is not without effect.',
    references: [R_MESSAGES]
  },
  {
    domain: PROMPT, difficulty: 3, type: QType.SINGLE,
    stem: 'A support bot must answer ONLY from an approved knowledge base and say "I don\'t know" otherwise. Which prompt technique best enforces this?',
    options: opts4(
      'Provide the KB as tagged context and give explicit instructions/criteria to answer only from it, else say I don\'t know',
      'Raise temperature so it guesses confidently',
      'Remove the knowledge base to keep the prompt short',
      'Ask it to be creative'),
    correct: ['a'],
    explanation: 'Supplying the knowledge base as delimited context plus explicit grounding criteria (answer only from it; otherwise decline) is the reliable way to constrain responses. Encouraging guessing or removing the KB defeats the goal.',
    references: [R_XML, R_PROMPT]
  },

  // ───────────── Context management and reliability (9) ─────────────
  {
    domain: CONTEXT, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'You attach a document far larger than the model\'s context window and the request fails. What is the most likely cause?',
    options: opts4(
      'The combined input exceeds the model\'s maximum context window',
      'Documents are never allowed in prompts',
      'The temperature was too high',
      'Streaming was disabled'),
    correct: ['a'],
    explanation: 'Inputs that exceed the model\'s context window cause the request to fail; you must chunk, summarize, or retrieve relevant parts. Temperature and streaming are unrelated to this error.',
    references: [R_CONTEXT_WIN]
  },
  {
    domain: CONTEXT, difficulty: 3, type: QType.SINGLE,
    stem: 'Prompt caching is MOST effective when:',
    options: opts4(
      'A large, identical prefix (e.g., system prompt + reference docs) is reused across many requests',
      'Every request has a completely different prompt',
      'Prompts are tiny and never repeat',
      'You change the cached prefix on every call'),
    correct: ['a'],
    explanation: 'Caching pays off when a large, stable prefix is reused across requests, avoiding recomputation. Constantly changing or tiny, non-repeating prompts gain little or nothing.',
    references: [R_CACHING]
  },
  {
    domain: CONTEXT, difficulty: 2, type: QType.SINGLE,
    stem: 'A chat UI must show tokens to the user as they are generated. Which API mode enables this?',
    options: opts4(
      'Streaming (stream: true) with server-sent events',
      'Batch processing',
      'A single non-streaming completion',
      'Token counting'),
    correct: ['a'],
    explanation: 'Streaming delivers incremental output as it is generated, ideal for live UIs. Batch processing is asynchronous and high-throughput, and token counting estimates usage without generating.',
    references: [R_STREAMING]
  },
  {
    domain: CONTEXT, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL strategies that help an application handle Anthropic rate limits gracefully.',
    options: opts4(
      'Exponential backoff with retries on 429 responses',
      'Respecting the retry-after / rate-limit headers',
      'Spreading load and batching non-urgent work',
      'Immediately retrying in a tight loop with no delay'),
    correct: ['a', 'b', 'c'],
    explanation: 'Backoff, honoring rate-limit headers, and smoothing/batching load all handle limits gracefully. Tight no-delay retries make throttling worse.',
    references: [R_RATELIMITS]
  },
  {
    domain: CONTEXT, difficulty: 2, type: QType.SINGLE,
    stem: 'Which capability lets you estimate the input token count of a request WITHOUT a billed generation?',
    options: opts4(
      'The token counting endpoint',
      'The batches endpoint',
      'Setting max_tokens to 0',
      'Streaming with stop_sequences'),
    correct: ['a'],
    explanation: 'The token counting endpoint returns the input token count without performing (or billing) a generation. Batches, max_tokens, and streaming do not provide a free count.',
    references: [R_TOKENCOUNT]
  },
  {
    domain: CONTEXT, difficulty: 3, type: QType.SINGLE,
    stem: 'You must score 100,000 documents overnight where latency does not matter and cost should be lower. Which API is the best fit?',
    options: opts4(
      'The Message Batches API',
      'Synchronous streaming calls one at a time',
      'The token counting endpoint',
      'A single Messages request with all documents concatenated'),
    correct: ['a'],
    explanation: 'The Message Batches API processes large volumes asynchronously at lower cost, ideal for latency-tolerant bulk jobs. One-at-a-time streaming is slow, token counting does not generate, and concatenating everything would blow the context window.',
    references: [R_BATCHES]
  },
  {
    domain: CONTEXT, difficulty: 3, type: QType.SINGLE,
    stem: 'A stop_sequences value of ["</answer>"] has what effect on generation?',
    options: opts4(
      'Generation halts as soon as that sequence is produced',
      'It forces the answer to be longer',
      'It raises the temperature',
      'It caches the prompt'),
    correct: ['a'],
    explanation: 'A stop sequence ends generation when the model emits it, useful for bounding structured output. It does not lengthen output, change temperature, or cache anything.',
    references: [R_MESSAGES]
  },
  {
    domain: CONTEXT, difficulty: 3, type: QType.SINGLE,
    stem: 'A conversational app stores each turn server-side and replays the history on the next request. Why is persisting state server-side (rather than trusting the client) important for reliability?',
    options: opts4(
      'The API is stateless per request, and authoritative server state prevents lost or tampered history',
      'Because Claude stores the conversation for you automatically',
      'Because temperature must be recomputed each turn',
      'Because streaming requires it'),
    correct: ['a'],
    explanation: 'Since each Messages request is independent, the application must own the conversation state; keeping it authoritative on the server avoids loss or client tampering. Claude does not persist conversations across requests.',
    references: [R_MESSAGES]
  },
  {
    domain: CONTEXT, difficulty: 2, type: QType.SINGLE,
    stem: 'TRUE or FALSE: Setting stream: true changes the model\'s output content for the same prompt and seed.',
    options: opts4(
      'False — streaming only changes delivery (incremental vs whole), not the content',
      'True — streaming produces different text',
      'True — streaming lowers quality',
      'False — but streaming disables tools'),
    correct: ['a'],
    explanation: 'Streaming affects only how the response is delivered (token-by-token vs all at once), not the underlying content. It does not reduce quality or disable tools.',
    references: [R_STREAMING]
  }
];
