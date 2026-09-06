# BTech Notes Hub

Build a Modern BTech Notes Repository

Build a complete, production-ready web application called BTech Notes — a personal notes repository designed to store and organize all academic notes for all 4 years of a BTech degree.

The application will be used by approximately 5–7 users/friends, with each user having completely private data. Users must authenticate using Google Sign-In, and their notes/files must never be visible to other users.

The application should feel like a polished modern SaaS product: clean, professional, minimal, dark-first, responsive, fast, and easy to navigate.

Do NOT create a simple static frontend or mockup. Implement the actual functionality, Firebase integration, authentication, database operations, file uploads, editing, deletion, searching, filtering, and user-specific data isolation.

1. TECHNOLOGY REQUIREMENTS

Use:

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

Lucide icons

Firebase Authentication

Firebase Firestore

Firebase Storage

Use clean component architecture and reusable components.

Avoid unnecessary libraries unless they provide a clear benefit.

The application must be responsive on:

Desktop

Laptop

Tablet

Mobile

The desktop experience should be the primary focus.

2. FIREBASE CONFIGURATION

I will provide my Firebase configuration later.

Create a clearly marked configuration section with placeholders:

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};


Do NOT invent Firebase credentials.

Create the Firebase initialization cleanly so I can replace these values easily.

Use environment variables where appropriate and provide an .env.example file.

Example:

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=


3. AUTHENTICATION

Create a professional authentication flow.

Primary authentication method:

Google Sign-In

The user should see:

Application logo/name

"Welcome to BTech Notes"

Short description

Continue with Google button

Clean dark authentication UI

After successful authentication:

Create the user's profile in Firestore if it doesn't already exist.

Store:

uid

displayName

email

photoURL

createdAt

lastLoginAt

Use Firebase Authentication.

Protect all application routes.

Unauthenticated users should not be able to access the dashboard or repository.

Include:

Loading state while authentication is being determined

Authentication error handling

Sign-out functionality

4. IMPORTANT DATA PRIVACY REQUIREMENT

Every user's data must be completely private.

For example:

User A must NOT be able to:

Read User B's notes

Read User B's chapters

Read User B's topics

Download User B's files

Edit User B's notes

Delete User B's notes

Access User B's Firebase Storage files

Use the authenticated Firebase user's UID to isolate all user data.

Implement proper Firestore Security Rules and Firebase Storage Security Rules.

Do not rely only on frontend filtering for security.

Provide the required security rules in the project.

5. CORE NOTE ORGANIZATION

The repository must follow this exact hierarchy:

Year → Semester → Subject → Chapter → Topic → Notes

Example:

BTech
│
├── Year 1
│   ├── Semester 1
│   │   ├── Mathematics I
│   │   │   ├── Chapter 1: Differential Calculus
│   │   │   │   ├── Topic: Limits
│   │   │   │   │   └── Notes
│   │   │   │   └── Topic: Continuity
│   │   │   └── Chapter 2: Integral Calculus
│   │   │
│   │   └── Physics
│   │
│   └── Semester 2
│
├── Year 2
│   ├── Semester 3
│   └── Semester 4
│
├── Year 3
│   ├── Semester 5
│   └── Semester 6
│
└── Year 4
    ├── Semester 7
    └── Semester 8


Allow users to create, rename, edit and delete:

Years

Semesters

Subjects

Chapters

Topics

Notes

Do not hard-code subjects because different BTech branches have different curricula.

6. DASHBOARD

Create a beautiful professional dashboard.

At the top:

Greeting

Display something like:

Good evening, Chinmay

Use the authenticated user's display name.

Below it, display:

Current Date & Time

Show the current date and live time in a clean professional format.

Example:

Monday, August 17, 2026
6:42 PM

The time should update automatically.

7. DASHBOARD STATISTICS

Create four prominent statistics cards:

Total Subjects

Number of subjects created across all years and semesters.

Total Chapters

Total number of chapters.

Total Topics

Total number of topics.

Total Notes

Total number of notes.

Make these cards visually elegant and consistent.

Each card should have:

Icon

Number

Label

Subtle visual indicator

Smooth hover animation

Do not overcrowd the dashboard.

8. DASHBOARD CONTENT

Below the statistics, include a clean section showing:

Recently Created Notes

Display the latest notes sorted by creation date.

Each item should show:

Note title

Subject

Chapter

Topic

Year

Semester

Created date

File attachment indicator if applicable

Clicking a note should open the note.

Also include:

Quick Actions

Buttons:

New Note

New Subject

New Chapter

New Topic

Upload File

The interface should make creating a note extremely quick.

9. SIDEBAR NAVIGATION

Create a modern collapsible sidebar.

Navigation:

Dashboard

My Notes

Subjects

Recent Notes

Files

Bottom section:

User profile

User name

Email

Settings

Sign Out

The sidebar should clearly indicate the current page.

On mobile, convert it into a responsive drawer.

10. MY NOTES PAGE

Create a dedicated notes repository page.

Users should be able to browse their notes.

Include:

Search

Search notes by:

Note title

Subject

Chapter

Topic

Note content

Filters

Filter by:

Year

Semester

Subject

Chapter

Topic

Sorting

Allow:

Newest first

Oldest first

A–Z

Z–A

Display notes using either:

Clean cards

Compact list view

Include a toggle between card/list view if it looks good.

11. NOTE CREATION

Create a powerful note editor.

A user should be able to create a note containing:

Title

Year

Semester

Subject

Chapter

Topic

Note content

Attachments

Use a proper rich-text editor.

The editor should support:

Bold

Italic

Underline

Headings

Bullet lists

Numbered lists

Quotes

Links

Code blocks

Inline code

Text alignment

Tables if practical

Undo/Redo

The editor should feel similar to modern applications such as Notion.

Do not make the editor visually complicated.

12. NOTE METADATA

Every note must store:

noteId

ownerId

title

content

yearId

yearName

semesterId

semesterName

subjectId

subjectName

chapterId

chapterName

topicId

topicName

createdAt

updatedAt

attachments

Use Firebase server timestamps wherever appropriate.

The primary date shown to the user should be:

Date Created

Also store updatedAt internally for future functionality.

13. FILE UPLOADS

Users must be able to attach files to notes.

Support common file types, including:

PDF

DOC

DOCX

PPT

PPTX

XLS

XLSX

TXT

CSV

Images

ZIP

RAR

Other common academic files

Do not restrict the frontend to only a few extensions.

Use Firebase Storage.

Each uploaded file should store:

file name

file type

file size

storage path

download URL/reference

uploadedAt

ownerId

Display attachments elegantly inside the note.

For every attachment provide:

File icon based on type

File name

File size

Open/Preview where supported

Download

Delete

Add a confirmation dialog before deleting an attachment.

Use configurable file-size limits and clearly handle files that exceed the limit.

14. FILES PAGE

Create a dedicated Files page.

Show all files uploaded by the current user.

Include:

Search

File type filter

Sort by newest/oldest

File name

Associated note

File size

Upload date

Download/open

Delete

Never show files belonging to another user.

15. SUBJECTS PAGE

Create a clean hierarchical view of the user's BTech curriculum.

Show:

Year 1
→ Semester 1
→ Subjects

Year 1
→ Semester 2
→ Subjects

Continue through:

Year 2

Year 3

Year 4

Each subject should show:

Subject name

Number of chapters

Number of topics

Number of notes

Clicking a subject should open its contents.

16. CHAPTERS AND TOPICS

Inside each subject:

Display chapters.

Example:

Computer Networks

01 — Introduction
02 — Physical Layer
03 — Data Link Layer
04 — Network Layer
05 — Transport Layer


Click a chapter to view topics.

Inside each chapter:

Topics

• OSI Model
• TCP/IP Model
• Network Topologies
• Network Devices


Click a topic to see notes associated with it.

Provide quick buttons:

Add Chapter

Add Topic

Add Note

17. CRUD FUNCTIONALITY

Implement complete CRUD functionality.

Users must be able to:

Create

Subjects

Chapters

Topics

Notes

File attachments

Read

View everything belonging to their account

Update

Rename subjects

Rename chapters

Rename topics

Edit notes

Replace/delete attachments

Delete

Subjects

Chapters

Topics

Notes

Files

Every destructive operation must have a confirmation dialog.

Example:

Delete "Data Structures"?

This action cannot be undone.

[Cancel] [Delete]

18. CASCADE DELETE

Handle deletion carefully.

If a user deletes:

Subject

Warn them that its chapters, topics and notes may also be deleted.

Chapter

Warn them that its topics and notes may also be deleted.

Topic

Warn them that associated notes may also be deleted.

Note

Delete its associated file references and Firebase Storage files where appropriate.

Do not accidentally leave orphaned data.

Use safe deletion logic.

19. EMPTY STATES

Create beautiful empty states instead of showing blank screens.

Examples:

If no subjects exist:

Your BTech journey starts here.
Create your first subject to begin organizing your notes.

Button:

+ Create Subject

If no notes exist:

No notes yet.
Start building your knowledge repository.

Button:

+ Create Note

Make these states visually polished.

20. SEARCH

Implement global note searching.

Search should feel fast and responsive.

Allow searching by:

Note title

Content

Subject

Chapter

Topic

Show relevant results immediately.

Include a clear "No results found" state.

21. DESIGN SYSTEM

The design should be dark-first.

Visual direction:

Modern

Professional

Minimal

Premium

Academic/technical

Clean

Not flashy

Use:

Dark charcoal/near-black background

Slightly lighter cards

Subtle borders

High-quality typography

Good spacing

Rounded corners

Minimal shadows

Subtle gradients only where appropriate

Avoid:

Excessive gradients

Neon colors

Huge text

Overly rounded cartoon-like UI

Excessive animations

Clutter

Use Lucide icons consistently.

Typography should be highly readable.

Recommended font:

Inter

Use a clear hierarchy for:

Page titles

Section titles

Card titles

Metadata

Body text

22. COLOR ACCENTS

Use a restrained professional accent color.

Primary accent can be a subtle blue/indigo.

Use colors meaningfully for:

Primary buttons

Active navigation

Links

Important statistics

Success/error states

Do not make the entire interface colorful.

23. ANIMATIONS

Use subtle animations only.

Examples:

Sidebar transitions

Card hover

Button hover

Modal opening

Page transitions

Loading skeletons

Animations must not interfere with productivity.

24. LOADING STATES

Implement proper loading states throughout the application.

Use skeleton loaders for:

Dashboard statistics

Notes

Subjects

Files

Search results

Never leave the user staring at an empty screen while Firebase loads.

25. ERROR HANDLING

Implement professional error handling.

Handle:

Firebase authentication failures

Firestore errors

Storage upload failures

Network failures

Permission errors

File upload errors

Missing data

Invalid forms

Show useful messages instead of raw Firebase errors.

Example:

Something went wrong while saving your note. Please try again.

26. TOAST NOTIFICATIONS

Use clean toast notifications.

Examples:

Note created successfully.

Note updated successfully.

Note deleted.

File uploaded successfully.

Subject created.

Changes saved.

Failed to upload file.

Do not overuse toasts.

27. USER PROFILE

Create a small profile section.

Show:

Google profile photo

Name

Email

Include:

Sign Out

Do not allow users to edit their Google account information inside the application.

28. FIRESTORE DATABASE DESIGN

Design the Firestore database so that data is cleanly separated by user.

A recommended structure is:

users/{userId}

users/{userId}/years/{yearId}

users/{userId}/years/{yearId}/semesters/{semesterId}

users/{userId}/years/{yearId}/semesters/{semesterId}/subjects/{subjectId}

users/{userId}/years/{yearId}/semesters/{semesterId}/subjects/{subjectId}/chapters/{chapterId}

users/{userId}/years/{yearId}/semesters/{semesterId}/subjects/{subjectId}/chapters/{chapterId}/topics/{topicId}

users/{userId}/notes/{noteId}

users/{userId}/files/{fileId}


You may adjust the exact schema if a better Firestore architecture is appropriate, but maintain strict user isolation.

Avoid unnecessarily deeply nested data if it creates query or maintenance problems.

29. FIREBASE SECURITY

Create Firestore rules so that:

request.auth != null


and the authenticated user's UID must match the data owner's UID.

Users must only access their own:

Profile

Years

Semesters

Subjects

Chapters

Topics

Notes

Files

Also create Firebase Storage rules enforcing the same ownership model.

Do NOT create insecure rules such as:

allow read, write: if true;


or anything equivalent.

30. DATE HANDLING

Use Firebase timestamps for stored dates.

Display dates professionally.

For example:

Created Aug 17, 2026

On note details, show:

Created
August 17, 2026


The dashboard should show the user's current local date and time.

Do not hard-code dates.

31. RESPONSIVE DESIGN

The application must work well on mobile.

On mobile:

Sidebar becomes a drawer

Dashboard cards become a responsive grid

Tables/list views become mobile-friendly

Note editor fits the screen

File cards adapt properly

Buttons remain easy to tap

Do not simply shrink the desktop UI.

32. ACCESSIBILITY

Implement basic accessibility:

Proper button labels

Keyboard navigation

Visible focus states

Good contrast

Semantic HTML

Accessible dialogs

Accessible form inputs

Tooltips where icons may not be obvious

33. COMPONENT ARCHITECTURE

Keep the project organized.

Create reusable components such as:

Layout
Sidebar
TopBar
Dashboard
StatCard
NoteCard
NoteEditor
NoteViewer
SubjectCard
ChapterList
TopicList
FileCard
SearchBar
FilterBar
ConfirmationDialog
EmptyState
LoadingSkeleton
Toast
ProfileMenu


Keep Firebase logic separate from UI components where practical.

Create reusable hooks/services for:

Authentication

Notes

Subjects

Chapters

Topics

Files

Firestore operations

Storage operations

34. NOTE VIEWER

When opening a note, create a distraction-free reading experience.

Show:

Note Title

Then metadata:

Year 2
Semester 3
Data Structures
Trees
Binary Search Trees


Then:

Created August 17, 2026

Then the note content.

Attachments should appear at the bottom.

Actions:

Edit

Delete

Download attachments

The reading experience should be clean and comfortable for studying.

35. QUICK NOTE CREATION

Make adding a note very fast.

The user should be able to click:

+ New Note

and get a form where they can select:

Year → Semester → Subject → Chapter → Topic

Then enter:

Title + Content + Attachments

Save.

After saving, redirect to the note or show the newly created note.

36. INITIAL USER EXPERIENCE

When a new user signs in for the first time:

Show an onboarding/empty dashboard.

Example:

Welcome to BTech Notes 👋

Organize four years of knowledge in one place.

Then provide:

Create Your First Subject

The user should not be forced through a long onboarding process.

37. DEMO DATA

Do NOT permanently insert fake data into the production database.

If useful during development, create optional local/demo seed data that can easily be removed.

The actual user's Firebase account should start empty.

38. PERFORMANCE

Optimize the application for a small but real multi-user environment.

Use:

Efficient Firestore queries

Pagination where appropriate

Lazy loading where useful

Optimized React rendering

Firebase Storage references

Avoid unnecessary reads

Avoid loading every note/file on every page

The dashboard should load quickly.

39. SECURITY AND DATA INTEGRITY

Do not trust client-side user IDs.

Always obtain the authenticated UID from Firebase Authentication.

Validate data before writing.

Prevent unauthorized access through both:

Frontend route protection

Firebase Security Rules

Never expose private Firebase data through publicly accessible endpoints.

40. SETTINGS

Create a simple Settings page.

Include:

Account

Profile photo

Name

Email

Appearance

Since the application is dark-first, provide:

Dark

Light

System

But keep dark as the default.

Data

Potential options:

Export notes

Delete account/data

For destructive account deletion, show a strong confirmation dialog.

If full account deletion requires additional Firebase configuration, clearly indicate what needs to be configured rather than pretending it works.

41. FINAL UI STRUCTURE

The final application should have approximately these routes:

/login

/dashboard

/notes

/notes/:id

/notes/new

/subjects

/subjects/:id

/chapters/:id

/topics/:id

/files

/settings


Protect all routes except /login.

42. IMPORTANT PRODUCT PHILOSOPHY

This is NOT:

A social network

A collaboration platform

A chat application

A task manager

An attendance tracker

An LMS

A general productivity application

It is specifically a:

Personal BTech Notes Repository

The core experience should be:

Sign in → Choose academic location → Create/read notes → Attach files → Search → Organize → Study

Keep the product focused.

43. POLISH REQUIREMENTS

Before considering the implementation complete, test the entire user flow:

Open application

Sign in with Google

Create profile

Open dashboard

Create Year

Create Semester

Create Subject

Create Chapter

Create Topic

Create Note

Add rich text

Upload file

Save note

Open note

Edit note

Search note

Filter notes

Download attachment

Delete attachment

Delete note

Sign out

Sign in again

Verify data persists

Verify only the authenticated user's data is visible

Also test with two different Google accounts and verify that their data remains completely isolated.

44. FIREBASE SETUP PLACEHOLDERS

At the end of the project, clearly identify where I need to provide/configure:

Firebase API Key

Auth Domain

Project ID

Storage Bucket

Messaging Sender ID

App ID

Google Authentication provider

Firestore

Firebase Storage

Firestore Security Rules

Storage Security Rules

Do not fabricate any credentials.

45. MOST IMPORTANT REQUIREMENT

Build the application as a real functioning Firebase-backed application, not merely a visually impressive frontend.

Every button must perform its intended action.

Every CRUD operation must persist to Firebase.

Authentication must work.

File uploads must work.

Search/filtering must work.

Delete operations must work.

Data must persist after logout and login.

User data must be private.

If something cannot be implemented because Firebase configuration has not yet been provided, create the integration and clearly mark the exact configuration needed rather than replacing it with fake/mock functionality.

The final result should look like a polished product that a serious BTech student could use for all four years.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://btechnotes.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bcd6a987-2f92-4d03-94f5-ccf4d78a408a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
