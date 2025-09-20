# Mini Loop  Kanban Board

A feature-rich Kanban board with a sleek 'noir' theme. It supports drag-and-drop, task checklists, priority levels, and local save/load functionality, all wrapped in a fluid, responsive interface.

**[➡️ Live Demo](https://comfortable-whoever-839576.framer.app/home)**

---

### ELI5 (Explain Like I'm 5) 🤔

Imagine you have a big whiteboard for your toys. You draw three big boxes on it: "Toys to Play With," "Playing Now," and "Finished Playing."

Mini Loop is like that whiteboard on your computer. You can write down your homework or chores on little digital sticky notes. You can move these notes from the "To Do" box to the "Doing" box, and then to the "Done" box when you're finished! It's a simple way to see all your tasks and feel good when you finish them. ✨

---

### TL;DR (Too Long; Didn't Read) 📝

- A sleek, 'noir' themed Kanban board to organize your tasks.
- Drag and drop columns and tasks with smooth animations.
- Add detailed descriptions, sub-task checklists, and priority levels.
- Saves everything automatically to your browser's local storage.
- Includes functionality to save your board to a file and load it back later.

---

### Context Map (How the files talk to each other) 🗺️

-   `index.html` -> The house 🏠. It's the first thing the browser opens and it holds the basic structure.
-   `index.tsx` -> The electrician 💡. It finds the main wall socket (`<div id="root">`) in the house and plugs in the main React app.
-   `flat.tsx` -> The main power box 🔌. This is the heart of the app. It brings everything together: all the styles, all the components, and the main application logic (state management, drag-and-drop handling). It also dynamically loads the drag-and-drop libraries to make the app start up faster.
-   `components/*.tsx` -> The appliances 📺. Each file is a specific, reusable part of the UI.
    -   `TaskCard.tsx` is a sticky note.
    -   `Column.tsx` is a column on the whiteboard.
    -   `AddTaskModal.tsx` is the form you use to write a new sticky note.
    -   ...and so on! They are all used by `flat.tsx`.

---

### Directory Tree Map 📁

```
.
├── 📁 components/         # Reusable UI parts (Appliances)
│   ├── Icon.tsx           # 🖼️ Renders icons using Phosphor Icons
│   ├── TaskCard.tsx       # 📝 A single draggable task card
│   ├── Column.tsx         # 📊 A column that holds tasks
│   ├── AddTaskModal.tsx   # ➕ Form to add/edit tasks
│   ├── AnimatedCounter.tsx# 🔢 A cool animated number counter
│   ├── EasterEggMessage.tsx # ❤️ A hidden surprise message
│   └── MagneticButton.tsx # 🧲 A button with a fun magnetic effect
├── flat.tsx             # 🔌 The main component that assembles the app
├── index.html           # 🏠 The main web page file
├── index.tsx            # 💡 Plugs the React app into the HTML
├── metadata.json        # ℹ️ Info about the app for the environment
├── package.json         # 📦 Lists project details and dependencies
├── README.md            # 📖 This file!
└── types.ts             # 🏷️ (Merged into flat.tsx) Defines data structures like Task, Column
```