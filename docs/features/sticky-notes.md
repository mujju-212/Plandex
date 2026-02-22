# Quick Sticky Notes

> Color-coded note cards with pin support and grid layout.

---

## Overview

Quick Sticky Notes provides a fast way to jot down thoughts, reminders, and snippets in colorful cards.

**Screen:** `app/(stacks)/notes.tsx`  
**Store:** `useNoteStore`  
**Table:** `sticky_notes`

## Data Model

### `sticky_notes` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `title` | TEXT | `''` | Note title |
| `content` | TEXT | `''` | Note body |
| `color` | TEXT | `'#FFE082'` | Background color |
| `is_pinned` | BOOLEAN | 0 | Pin to top |
| `position` | INTEGER | 0 | Sort order |
| `created_at` | DATETIME | NOW | Creation timestamp |
| `updated_at` | DATETIME | NOW | Last update |

## Available Colors

| Color | Hex | Name |
|---|---|---|
| 🟡 | `#FFE082` | Yellow (default) |
| 🟠 | `#FFAB91` | Orange |
| 🔴 | `#EF9A9A` | Red |
| 🟣 | `#CE93D8` | Purple |
| 🔵 | `#90CAF9` | Blue |
| 🟢 | `#80CBC4` | Teal |
| 💚 | `#A5D6A7` | Green |
| 🟤 | `#BCAAA4` | Brown |
| ⚪ | `#B0BEC5` | Grey |
| 🩷 | `#F48FB1` | Pink |

## Features

- **Quick Create:** Tap FAB to add a new note
- **Color Picker:** Select from 10 color options
- **Pin Notes:** Pinned notes always appear at the top
- **Grid Layout:** Notes displayed in a 2-column masonry grid
- **Edit In-Place:** Tap to edit title/content
- **Position Ordering:** Drag to reorder (position-based sorting)
