# AI Exercise Logbook

## CRITICAL: MANDATORY WORKFLOW

> [!CAUTION]
> **ALL FEATURE REQUESTS MUST FOLLOW THIS WORKFLOW. NO EXCEPTIONS.**

### 1. PLANNING FIRST
- **BEFORE ANY IMPLEMENTATION**, create a planning file in `/planning/`
- Use incremental naming: `01-xxxx.md`, `02-xxxx.md`, `03-xxxx.md`, etc.
- The planning file must describe WHAT will be built and HOW

### 2. USER REVIEW
- **WAIT FOR USER APPROVAL** before proceeding
- Do NOT start implementation until the user has reviewed and approved the plan

### 3. IMPLEMENTATION
- Only after approval, proceed with the implementation
- Reference the planning file in commits

### 4. WALKTHROUGH
- **AFTER IMPLEMENTATION**, create a walkthrough file in `/walkthrough/`
- Use matching name: `01-xxxx-walkthrough.md` (matches planning file)
- Document what was built, files created, and how to use it

---

## Project Structure

```
/planning/          # Planning documents (MANDATORY before implementation)
/walkthrough/       # Walkthrough documents (MANDATORY after implementation)
```

**Naming Convention:**
- Planning: `01-feature-name.md`
- Walkthrough: `01-feature-name-walkthrough.md`

---

## Project Overview

This is an exercise logbook application for tracking workouts and fitness progress.

## Tech Stack

- HTML/CSS/JavaScript (vanilla)
- Hevy API for workout data

## Development Guidelines

### Code Style
- Write clean, readable code with meaningful variable and function names
- Add comments for complex logic
- Follow consistent formatting

### Git Workflow
- Write clear, descriptive commit messages
- Keep commits focused and atomic
