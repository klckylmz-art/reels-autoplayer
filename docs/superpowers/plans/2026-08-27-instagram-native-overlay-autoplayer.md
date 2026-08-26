# Instagram Native Overlay AutoPlayer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Android helper app that overlays controls on Instagram's native app and advances Reels with Accessibility gestures.

**Architecture:** A launcher activity guides the user to Accessibility settings and opens Instagram. An AccessibilityService restricted to `com.instagram.android` creates a `TYPE_ACCESSIBILITY_OVERLAY` control panel and dispatches swipe/tap gestures.

**Tech Stack:** Android Java, AccessibilityService, GestureDescription, WindowManager accessibility overlay, GitHub Actions.

**Spec:** Approved in conversation: native Instagram app, no WebView, no separate Instagram login, floating controls, previous/next/play-pause, timed auto-advance.

## Global Constraints
- Minimum Android 8 (API 26).
- No Instagram API.
- No credential collection.
- Accessibility service restricted to Instagram package.
- Auto-advance uses an adjustable timer because native Instagram does not expose reliable video-ended events externally.

---

### Task 1: Launcher and accessibility setup
- [x] Create launcher activity with buttons for Accessibility settings and Instagram.
- [x] Register accessibility service in manifest.
- [x] Restrict service package to `com.instagram.android`.

### Task 2: Overlay controls
- [x] Create `TYPE_ACCESSIBILITY_OVERLAY`.
- [x] Add Previous, Play/Pause, Next, Auto, −5 sec, +5 sec controls.
- [x] Make overlay draggable.

### Task 3: Gesture automation
- [x] Dispatch swipe-up for next Reel.
- [x] Dispatch swipe-down for previous Reel.
- [x] Dispatch center tap for play/pause.
- [x] Add adjustable timed auto-advance from 5 to 180 seconds.

### Task 4: Cloud APK build
- [x] Add GitHub Actions workflow using JDK 17 and Gradle 8.10.2.
- [x] Upload `app-debug.apk` as workflow artifact.
