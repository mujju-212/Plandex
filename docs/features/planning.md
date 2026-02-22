# Planning Workspace

> Project-based organizer with notes and file attachments.

---

## Overview

The Planning Workspace lets users create projects and organize related notes and files within them.

**Screens:** `app/(stacks)/planning/index.tsx`, `app/(stacks)/planning/[id].tsx`  
**Store:** `usePlanningStore`  
**Tables:** `planning_projects`, `planning_notes`, `planning_files`

## Data Model

### `planning_projects` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `title` | TEXT | required | Project name |
| `description` | TEXT | NULL | Description |
| `color` | TEXT | `'#4A9BE2'` | Hex color |
| `icon` | TEXT | `'folder'` | Icon name |
| `cover_image` | TEXT | NULL | Cover image URI |
| `is_archived` | BOOLEAN | 0 | Archive flag |
| `position` | INTEGER | 0 | Sort order |

### `planning_notes` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `project_id` | INTEGER FK | required | References `planning_projects.id` (CASCADE) |
| `title` | TEXT | `'Untitled'` | Note title |
| `content` | TEXT | `''` | Note body |
| `position` | INTEGER | 0 | Sort order |

### `planning_files` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `project_id` | INTEGER FK | required | References `planning_projects.id` (CASCADE) |
| `file_name` | TEXT | required | Display name |
| `file_uri` | TEXT | required | Local file URI |
| `file_type` | TEXT | `'other'` | `image`/`video`/`pdf`/`document`/`audio`/`other` |
| `file_size` | INTEGER | 0 | Size in bytes |
| `thumbnail_uri` | TEXT | NULL | Preview thumbnail URI |

## Customization Options

### Project Colors (10 options)
`#4A9BE2`, `#66C38A`, `#F5B041`, `#E74C3C`, `#AB47BC`, `#26A69A`, `#FF7043`, `#5C6BC0`, `#78909C`, `#EC407A`

### Project Icons (10 options)
`folder`, `lightbulb`, `code`, `brush`, `business`, `school`, `favorite`, `star`, `rocket`, `psychology`

## Features

- **Project Cards:** Color-coded cards with icon, title, and note/file counts
- **Cover Images:** Set a cover image for visual identification
- **Notes:** Rich text notes within each project
- **File Attachments:** Attach images, videos, PDFs, documents, audio files
- **Archive:** Archive completed projects without deleting
- **Cascade Delete:** Deleting a project removes all its notes and files
