# Design Decisions

This document records important design decisions, experiments, and learnings during the development of AI_README MCP.

## Decision 001: Single Tool vs. Split Tools for Context Retrieval

**Date:** 2025-11 (Ongoing Experiment)
**Status:** Exploring
**Current Implementation:** Single tool (`get_context_for_file`)

### Background

The `get_context_for_file` tool is critical for ensuring Claude follows project conventions. It must be triggered before:
- Creating files (Write tool)
- Editing files (Edit tool)
- Planning tasks (TodoWrite tool)

The original implementation used a single tool with comprehensive descriptions covering all scenarios.

### The Question

Would splitting into scenario-specific tools improve trigger accuracy?

**Hypothesis:** More specific tools → clearer triggers → higher accuracy

Example split:
- `create_file_with_context` - for creating new files
- `edit_file_with_context` - for editing existing files
- `plan_with_context` - for planning tasks

### Human Intuition vs. LLM Behavior

**Human perspective:**
- Clear categorization feels better organized
- "This tool is for create, that one is for edit" seems logical
- Specific descriptions should be easier to understand

**Expected outcome:** Higher trigger rate

### Experimental Results

**Baseline (Single Tool):**
- Trigger rate: ~80%
- Tool: `get_context_for_file`
- Description: Comprehensive, covering all scenarios

**Split Version:**
- Trigger rate: ~30% (significant drop!)
- Tools: `create_file_with_context`, `edit_file_with_context`, `plan_with_context`
- Description: Scenario-specific, detailed

### Analysis: Why Did Splitting Reduce Trigger Rate?

#### 1. Decision Paralysis

**Single tool:**
```
User says: "Add error handling"
Claude: → Sees keyword "add" → Calls get_context_for_file (1 decision)
```

**Split tools:**
```
User says: "Add error handling"
Claude: → Sees "add"
        → Is this create_file_with_context? (has "add" keyword)
        → Or edit_file_with_context? (adding to existing file)
        → Overthinks → Skips entirely
```

#### 2. Keyword Ambiguity

The word "add" is inherently ambiguous:
- "Add a new file" → create
- "Add error handling to middleware.ts" → edit
- "Add validation logic" → edit

With split tools, Claude must interpret intent before choosing a tool. This adds cognitive load.

#### 3. Diluted Imperative Language

**Single tool:**
```
🚨 MANDATORY FIRST STEP: Call this BEFORE planning or coding
⚠️  CRITICAL RULE: You MUST call this tool BEFORE:
```
All imperative force points to ONE tool.

**Split tools:**
```
🚨 BEFORE creating NEW files...
🚨 BEFORE editing files...
🚨 BEFORE planning tasks...
```
Imperative force is distributed across 3 tools. Claude can rationalize:
"This isn't purely 'create' or 'edit', maybe I can skip..."

#### 4. LLM Tool Selection Mechanism

According to Anthropic's documentation, Claude:
1. Reads all tool descriptions
2. Reasons about which tool fits best
3. More reasoning steps → higher chance of error/skip

**Cognitive Load Theory:**
- Single tool: 1 decision step
- Split tools: 3+ decision steps (identify scenario → map to tool → select)

### Key Insight: The Prompt Engineering Paradox

> **For LLMs: Simple + Forceful > Precise + Categorized**

This contradicts human intuition where categorization aids understanding.

### Improvements Attempted on Split Version

To maximize the split version's potential, we enhanced:

1. **Stronger imperative language:**
   - Changed "BEFORE creating" → "MANDATORY: Call this BEFORE"
   - Added "You MUST call this tool when:"

2. **Disambiguation guides:**
   ```
   ⚠️  IMPORTANT DISTINCTION:
      • "Add error handling to middleware.ts" → USE edit_file_with_context
      • "Create a new Button.tsx" → USE create_file_with_context
   ```

3. **Removed escape routes:**
   - Deleted generic `get_context_for_file` fallback
   - Forces choice between the three specific tools

4. **Clarified trigger keywords:**
   - Listed pattern matches: `"add [feature/logic] to [existing file]"`

### Current Status

**Ongoing experiment** - Split version has been strengthened but not yet proven superior.

Both versions are preserved:
- Production: Single tool (better proven track record)
- Experimental: Split tools (in `src/index.ts` with enhancements)
- Backup: `src/index_origin.ts` (original single-tool implementation)

### Future Considerations

**If split version improves:**
- Document what specific changes led to improvement
- Consider this as evidence that LLM tool selection is evolving

**If split version remains inferior:**
- Strong evidence that "single simple tool > multiple specific tools"
- Valuable learning for MCP design patterns
- Confirms cognitive load theory in LLM context

### Lessons Learned

1. **Test assumptions:** What seems logical for humans may not work for LLMs
2. **Measure objectively:** Use trigger rate as a concrete metric
3. **Preserve experiments:** Keep both versions for comparison
4. **Document uncertainty:** It's okay to say "we're still exploring"

### References

- Original implementation: `src/index_origin.ts`
- Enhanced split version: `src/index.ts` (current)
- Related discussion: [Link to GitHub issue/PR if applicable]

---

**Note:** This is an active area of research. Findings may change as LLM capabilities evolve.
