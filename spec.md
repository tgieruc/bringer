# Bringer – Product & Technical Specification

## Overview

**Bringer** is a multi-user web application for managing **shopping lists** and **recipes** using a shared, canonical catalog of items.

The core design goals are:
- frictionless entry (type anything, items are created automatically)
- shared usage (households, groups, teams)
- simple but extensible data model
- works well on both mobile and desktop

This document defines the **intended behavior**, **data concepts**, and **non-goals** of the application.

---

## Core Concepts

### Workspace
- A workspace is the primary sharing boundary.
- All data (items, lists, recipes) belongs to a workspace.
- A user may belong to multiple workspaces.
- Roles:
  - `owner`: full access
  - `editor`: create/edit content
  - `viewer`: read-only

A personal workspace (single user) is the default starting point.

---

### Items (Canonical Objects)

Items represent canonical ingredients or products such as:
- `tomato paste`
- `flour`
- `bananas`

Properties:
- Name (human-readable)
- Normalized name (lowercased, trimmed, space-collapsed)
- Icon (Lucide icon, optional)
- Workspace ownership

Rules:
- Items are **unique per workspace by normalized name**
- Items are **auto-created** when referenced by free text
- Items are shared across all lists and recipes in the workspace

If a user types an unknown item name, the system:
1. Normalizes the name
2. Creates the item if it does not exist
3. Assigns a suggested icon automatically (if available)

---

### Icons

- Icons use the **Lucide icon set only**
- Icons are global (not workspace-specific)
- Each icon has:
  - `icon_key` (Lucide name)
  - descriptive text used for matching

Icon assignment:
- When an item is created, the system selects the best matching icon
- Matching is based on text similarity between item name and icon descriptions
- If no match is found, the item has no icon and falls back to a letter avatar

Users may manually change an item’s icon later.

---

### Shopping Lists

A shopping list:
- Belongs to a workspace
- Has a name
- Contains ordered entries

A shopping list entry:
- References an item
- Has a free-form note (quantity, context, etc.)
- Can be checked/unchecked

Examples of notes:
- `"1kg"`
- `"2"`
- `"for sauce"`
- `""` (empty)

Rules:
- No quantity parsing in v1
- Entries always reference an item (never raw text)

---

### Recipes

A recipe:
- Belongs to a workspace
- Has:
  - title
  - instructions (plain text or markdown)
  - optional image
  - optional external link
- Contains ordered ingredients

A recipe ingredient:
- References an item
- Has a free-form note (same format as shopping list entries)

Rules:
- Recipes use the same item catalog as shopping lists
- Adding an ingredient auto-creates the item if needed

---

## Authentication & Access

- Authentication is handled by **Supabase Auth**
- Email magic link is the default auth method
- All access is enforced via:
  - Supabase Auth
  - Row Level Security (RLS) based on workspace membership

Frontend code must never use Supabase secret keys.

---

## Frontend

### Platform
- Responsive web app
- Must work well on:
  - mobile phones
  - tablets
  - laptops/desktops

### UI
- Built using **shadcn/ui**
- Tailwind is used only as required by shadcn
- Prefer standard components over custom styling

### Routing
- `/login` – authentication
- `/` – redirect to workspace or login
- `/w/[workspaceId]/lists`
- `/w/[workspaceId]/recipes`

---

## Item Creation Behavior (Critical)

Whenever a user types an item name (shopping list or recipe):

1. The system calls a single “get-or-create item” operation
2. The operation:
   - normalizes the name
   - creates the item if missing
   - assigns a suggested icon
3. The returned item ID is used everywhere

This guarantees:
- no duplicates
- consistent references
- shared understanding across users

---

## Non-Goals (v1)

The following are explicitly **out of scope** for v1:

- Quantity parsing or unit conversion
- Nutrition analysis
- Cost tracking
- AI-generated recipes
- Offline-first synchronization
- Public sharing or publishing
- Native mobile apps (web only)

These may be considered later but must not influence early architecture.

---

## Design Principles

- **Clarity over cleverness**
- **One canonical source of truth**
- **Free-form input first, structure later**
- **Minimal abstractions**
- **Explicit TODOs over speculative code**

---

## Open Questions (Intentionally Deferred)

- Item deduplication / merging UX
- Multiple images per recipe
- Recipe scaling
- Shared public icon uploads
- Workspace deletion semantics

These should not be implemented without revisiting this spec.

---

## Change Policy

- This document should change slowly.
- If implementation deviates from the spec:
  - add a TODO
  - do not silently change behavior
- Major changes should be discussed before updating this file.
