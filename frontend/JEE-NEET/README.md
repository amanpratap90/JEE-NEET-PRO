# How to Build This Learning Platform (Educational Guide)

This guide explains the core concepts and steps required to build this JEE/NEET practice website from scratch. It focuses on the **logic, routing, and data flow** rather than styling.

---

## 1. Core Concepts to Master

To build this application, you need to understand the following React and JavaScript concepts:

   ### A. React Router (Navigation)
*   **What it is:** A library that lets you handle navigation in a Single Page Application (SPA) without reloading the page.
*   **Key Components:**
    *   `<BrowserRouter>`: Wraps your app to enable routing.
    *   `<Routes>` & `<Route>`: Define which component shows up for which URL path.
    *   `useParams`: Hook to grab dynamic values from the URL (e.g., getting "physics" from `/jee/physics`).
    *   `useNavigate`: Hook to programmatically change pages (e.g., clicking a button to go to the next page).

### B. React State (`useState`)
*   **What it is:** How React remembers things.
*   **Usage:**
    *   Tracking which question is currently being shown (`currentQuestionIndex`).
    *   Tracking which option the user clicked (`selectedOption`).
    *   Tracking if the user has submitted the answer (`isSubmitted`).

### C. Data Structures (JSON/Objects)
*   **What it is:** Organizing your data so it's easy to find.
*   **Usage:** storing questions in a nested object structure (`exam -> subject -> chapter`) allows for instant retrieval without searching through arrays.

---

## 2. Step-by-Step Implementation

### Step 1: Setting up the Router (`App.jsx`)
You need to define the structure of your website.

**Concept:** Dynamic Routing. Instead of making a separate page for every chapter, we make **one** page that changes its content based on the URL.

```javascript
// App.jsx
<BrowserRouter>
  <Routes>
    {/* Static Pages */}
    <Route path="/" element={<Home />} />
    
    {/* Dynamic Pages */}
    {/* :exam captures 'jee' or 'neet' */}
    <Route path="/:exam" element={<Subjects />} /> 
    
    {/* :subject captures 'physics', 'chemistry', etc. */}
    <Route path="/:exam/:subject" element={<Chapters />} />
    
    {/* :chapter captures the specific chapter name */}
    <Route path="/:exam/:subject/:chapter" element={<Practice />} />
  </Routes>
</BrowserRouter>
```

### Step 2: Creating the Data Logic

**File:** `src/data/questions.js`
**Concept:** Nested Objects for easy access.

```javascript
export const questions = {
    jee: {
        physics: {
            "kinematics": [
                {
                    question: "Unit of velocity?",
                    options: ["m/s", "kg"],
                    answer: "m/s",
                    solution: "Distance / Time"
                },
                // ...more questions
            ]
        }
    }
};
```

### Step 3: Building the Chapters Page (`Chapters.jsx`)
**Goal:** Show a list of chapters based on the selected exam and subject.

1.  **Get Params:** Use `useParams()` to know if we are in `/jee/physics` or `/neet/biology`.
2.  **Get Data:** Look up the list of chapters in your data file using these params.
3.  **Navigate:** Use `useNavigate` to go to the practice page when a chapter is clicked.

```javascript
const { exam, subject } = useParams(); // e.g., exam="jee", subject="physics"
const chapterList = chapters[exam][subject]; // Get the list

// Logic to navigate to specific chapter
<div onClick={() => navigate(`/${exam}/${subject}/${chapterName}`)}>
    {chapterName}
</div>
```

### Step 4: Building the Practice/Quiz Page (`Practice.jsx`)
**Goal:** Display questions one by one and handle user interaction.

**Required State:**
```javascript
const [index, setIndex] = useState(0); // Track current question 0, 1, 2...
const [selected, setSelected] = useState(null); // Track user answer
const [submitted, setSubmitted] = useState(false); // Track if 'Submit' was clicked
```

**Logic Flow:**
1.  **Load Question:** `const question = questions[exam][subject][chapter][index]`
2.  **Display:** Render `question.text` and map through `question.options`.
3.  **Interaction:**
    *   **Click Option:** specific function updates `selected` state.
    *   **Click Submit:** sets `submitted` to true.
    *   **Conditional Rendering:** If `submitted` is true, show the "Solution" div and color-code the answers (Green for correct, Red for wrong).
    *   **Next Button:** `setIndex(index + 1)`, reset `selected` and `submitted`.

---

## 3. Checklist for Your Own Version

If you want to build this yourself:

1.  [ ] **Initialize App**: `npm create vite@latest`
2.  [ ] **Install Router**: `npm install react-router-dom`
3.  [ ] **Create Data**: Write `data.js` with some sample questions.
4.  [ ] **Setup Routes**: Edit `App.jsx` to define your URL structure.
5.  [ ] **Create Components**: Build `Home`, `Subjects`, `Chapters`, `Practice`.
6.  [ ] **Add Logic**: Implement `useParams` to make pages dynamic.
7.  [ ] **Add Quiz Logic**: Implement the state variables for the exam interface.

---
*Happy Coding!*
