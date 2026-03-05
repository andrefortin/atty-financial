# TODO Update Guide

This guide explains how to update the TODO.md file as we progress through the phases.

## 📋 Status Indicators

Use these status indicators for tasks:

- ✅ **COMPLETE** - Task is fully done and tested
- 🔄 **IN PROGRESS** - Currently being worked on
- ⏳ **PENDING** - Not started yet
- ❌ **BLOCKED** - Cannot proceed due to dependency
- ⚠️ **ON HOLD** - Temporarily paused

## 🎯 Task Format

Each task should follow this format:

```markdown
- [ ] **X.Y** Task title
  - Description of what needs to be done
  - File: path/to/file.ts
  - Estimated: X hours
  - Completed: [Date] (when complete)
```

Example:

```markdown
- [x] **2.1** Create base Firestore service
  - CRUD operations, error handling, retry logic
  - File: src/services/firebase/firestore.service.ts
  - Estimated: 2 hours
  - Completed: March 5, 2026
```

## 📊 Progress Tracking

When updating progress, update these sections:

### Phase Progress

```markdown
**Progress**: X% (N/M tasks)
```

Calculate percentage as: `(completed / total) * 100`

### Overall Progress

```markdown
> Overall Progress: **X% Complete** (X of 8 phases)
```

### Quick Summary Table

Update the table at the top:

```markdown
| Metric | Status |
|---------|--------|
| Phases Completed | X/8 (X%) |
| Total Tasks | X |
| Tasks Completed | X |
| Tasks In Progress | X |
| Tasks Pending | X |
```

## 🔄 Updating Task Status

### Mark a task as complete

Change: `- [ ]` → `- [x]`
Add: `Completed: [Date]`

Example:
```markdown
- [x] **2.1** Create base Firestore service
  - Completed: March 5, 2026
```

### Mark a task as in progress

Change: `- [ ]` → `- [🔄]`
Remove estimated time if needed

Example:
```markdown
- [🔄] **3.1** Create day count convention calculator
```

### Mark a task as blocked

Change: `- [ ]` → `- [❌]`
Add blocking reason

Example:
```markdown
- [❌] **4.3** Implement tier 1 allocation logic
  - Blocked: Waiting for waterfall allocator service
```

## 📝 Adding New Tasks

If new tasks are discovered during implementation:

1. Add to the appropriate phase section
2. Use the next available task number (X.Y)
3. Include all required fields
4. Update the task counts in the summary

Example:

```markdown
- [ ] **3.12** Handle edge case for leap years
  - Add special handling for day count calculations
  - File: src/lib/calculators/dayCountCalculator.ts
  - Estimated: 1 hour
```

## 🎨 Formatting Guidelines

### Checkboxes

Use one space after brackets:
- ✅ `- [x]` (checked)
- ⏳ `- [ ]` (unchecked)
- 🔄 `- [🔄]` (in progress)
- ❌ `- [❌]` (blocked)

### Bold Text

Use asterisks for emphasis:
- **3.1** (task number)
- **COMPLETE** (status)

### Code Blocks

Use triple backticks for file paths:
- `src/services/firebase/users.service.ts`

### Links

Use markdown links for related docs:
- [Firestore Types](../src/types/firestore/README.md)

## 📅 Dates

Use format: `Month Day, Year`
- Completed: March 5, 2026
- Start Date: Pending

## 🚀 Phase Completion

When a phase is complete:

1. Change phase status: `⏳ PENDING` → `✅ COMPLETE`
2. Update phase progress: `0%` → `100%`
3. Add completion date
4. Create phase summary document

Example:

```markdown
### Phase 2: Core Collections & CRUD Operations ✅ COMPLETE
**Completion**: March 5, 2026
**Duration**: 1 day (actual: 1 day)
**Progress**: 100% (11/11 tasks)
```

## 📊 Overall Progress

When a phase completes, update overall progress:

```markdown
> Overall Progress: **X% Complete** (X of 8 phases)
```

Calculate as: `(phasesCompleted / 8) * 100`

## 🔄 Daily Updates

Recommended workflow for daily updates:

1. At end of work session, update all completed tasks
2. Update task statuses for in-progress items
3. Add any new tasks discovered
4. Update the "Last Updated" timestamp
5. Add notes to the Notes section if needed

## 📎 Tips

1. **Be Specific**: Each task should be atomic and testable
2. **Estimate Realistically**: Track actual vs estimated time
3. **Note Dependencies**: Identify blocking tasks clearly
4. **Update Frequently**: Keep TODO current to track progress
5. **Use Checkboxes**: Makes it easy to scan progress

## 🆘 Creating New Phases

If new phases are needed:

1. Add to the "All Phases" section
2. Update the phase count in quick summary
3. Estimate duration and number of tasks
4. Update overall progress calculations

Example:

```markdown
### Phase 9: New Feature ⏳ PENDING
**Estimated Duration**: 1 week
**Progress**: 0% (0/X tasks)
**Start Date**: Pending
```

---

**Remember**: This TODO is a living document. Keep it updated as we progress!
