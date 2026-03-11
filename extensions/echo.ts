/**
 * Echo — Retroactive context agent
 *
 * Captures, time-stamps, and allows replay of any point in your coding session.
 * Every tool call creates a navigable moment in time.
 *
 * Commands:
 *   /echo                 — Show recall overlay with all snapshots
 *   /echo-pause           — Pause auto-capture (manual only)
 *   /echo-resume          — Resume auto-capture
 *   /echo-clear           — Clear all snapshots (with confirm)
 *
 * Tool actions:
 *   capture <description> — Create a named checkpoint
 *   recall                — List all snapshots chronologically
 *   jump <id>             — Show file state at snapshot
 *   diff <id>             — Compare current to past snapshot
 *   note <text>           — Attach note to current moment
 *
 * Usage: pi -e extensions/echo.ts
 */

import type { ExtensionAPI, ToolExecutionEndEvent, MessageEndEvent, SessionEndEvent } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text, Box, type AutocompleteItem, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { applyExtensionDefaults } from "./themeMap.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Snapshot {
	id: string;
	timestamp: number;
	isoTime: string;
	type: "auto" | "manual" | "note";
	toolName?: string;
	inputs?: any;
	outputs?: any;
	duration?: number;
	description?: string;
	note?: string;
	reasoning?: string;
	fileSnapshots?: Record<string, string>;
}

interface EchoMemory {
	sessionId: string;
	startTime: number;
	snapshots: Snapshot[];
	lastSnapshotId: number;
}

const EchoParams = Type.Object({
	action: Type.Union([
		Type.Literal("capture"),
		Type.Literal("recall"),
		Type.Literal("jump"),
		Type.Literal("diff"),
		Type.Literal("note"),
	]),
	id: Type.Optional(Type.Number()),
	description: Type.Optional(Type.String()),
	note: Type.Optional(Type.String()),
	files: Type.Optional(Type.Array(Type.String())),
});

// ── State ────────────────────────────────────────────────────────────────────

let memory: EchoMemory = {
	sessionId: "",
	startTime: 0,
	snapshots: [],
	lastSnapshotId: 0,
};
let isPaused = false;
let widgetCtx: any;
let pendingReasoning: string = "";
let fileCache: Map<string, string> = new Map();

const DEBUG = process.env.ECHO_DEBUG === "1";

function debugLog(...args: unknown[]) {
	if (DEBUG) {
		console.log("[Echo]", ...args);
	}
}

// ── Persistence ───────────────────────────────────────────────────────────────

function loadMemory(cwd: string) {
	const path = join(cwd, ".pi", "echo-memory.json");
	if (existsSync(path)) {
		try {
			const data = JSON.parse(readFileSync(path, "utf-8"));
			// Start a new session but keep lastId for continuity
			const lastId = data.lastSnapshotId || 0;
			memory = {
				sessionId: crypto.randomUUID?.() ?? `session-${Date.now()}`,
				startTime: Date.now(),
				snapshots: [],
				lastSnapshotId: lastId,
			};
		} catch (err) {
			console.error("[Echo] Failed to load memory:", err);
			memory = {
				sessionId: crypto.randomUUID?.() ?? `session-${Date.now()}`,
				startTime: Date.now(),
				snapshots: [],
				lastSnapshotId: 0,
			};
		}
	} else {
		memory = {
			sessionId: crypto.randomUUID?.() ?? `session-${Date.now()}`,
			startTime: Date.now(),
			snapshots: [],
			lastSnapshotId: 0,
		};
	}
}

function saveMemory(cwd: string) {
	const path = join(cwd, ".pi", "echo-memory.json");
	try {
		debugLog(`Saving ${memory.snapshots.length} snapshots to ${path}`);
		writeFileSync(path, JSON.stringify(memory, null, 2));
		debugLog("Memory saved successfully");
	} catch (err) {
		debugLog("Failed to save memory:", err);
		console.error("[Echo] Error saving memory:", err);
	}
}

function addSnapshot(snapshot: Omit<Snapshot, "id">) {
	try {
		memory.lastSnapshotId++;
		const fileSnapshots = Object.fromEntries(fileCache);
		const full: Snapshot = {
			id: memory.lastSnapshotId.toString(),
			fileSnapshots,
			...snapshot,
		};
		memory.snapshots.push(full);
		debugLog(`Added snapshot #${full.id} (${full.type}) with ${Object.keys(fileSnapshots).length} files`);

		// Keep last 500 snapshots to prevent memory bloat
		if (memory.snapshots.length > 500) {
			memory.snapshots = memory.snapshots.slice(-500);
			debugLog("Trimmed snapshots to last 500");
		}

		updateUI();
	} catch (err) {
		debugLog("Failed to add snapshot:", err);
		console.error("[Echo] Error adding snapshot:", err);
	}
}

// ── UI Components ─────────────────────────────────────────────────────────────

function formatElapsed(ms: number): string {
	const secs = Math.floor(ms / 1000);
	if (secs < 60) return `${secs}s`;
	const mins = Math.floor(secs / 60);
	const remaining = secs % 60;
	return remaining > 0 ? `${mins}m${remaining}s` : `${mins}m`;
}

function formatTime(iso: string): string {
	return iso.slice(11, 19);
}

function updateUI() {
	if (widgetCtx?.hasUI) {
		widgetCtx.ui.requestRender?.();
	}
}

// Recall Overlay Component
function RecallOverlayComponent(memory: EchoMemory, theme: any, done: () => void) {
	const text = new Text("", 0, 1);
	let selectedIndex = 0;
	const maxDisplay = 15;

	const render = (width: number): string[] => {
		const header = theme.fg("accent", theme.bold("Echo: Snapshots")) +
			theme.fg("dim", ` — ${memory.snapshots.length} total\n\n`);

		if (memory.snapshots.length === 0) {
			const empty = theme.fg("dim", "No snapshots yet. Work with tools to create history.");
			text.setText(header + empty);
			return text.render(width);
		}

		// Show most recent first
		const display = [...memory.snapshots].reverse();
		const startIdx = Math.max(0, selectedIndex - Math.floor(maxDisplay / 2));
		const endIdx = Math.min(display.length, startIdx + maxDisplay);
		const visible = display.slice(startIdx, endIdx);

		const lines = visible.map((s, idx) => {
			const realIdx = startIdx + idx;
			const isSelected = realIdx === selectedIndex;
			const cursor = isSelected ? theme.fg("accent", "> ") : "  ";
			const typeColor = s.type === "manual" ? "success" : s.type === "note" ? "warning" : "dim";
			const typeLabel = s.type === "manual" ? "✓" : s.type === "note" ? "●" : "○";

			const meta = theme.fg(typeColor, `[${typeLabel}]`);
			const id = theme.fg("muted", `#${s.id}`);
			const time = theme.fg("dim", formatTime(s.isoTime));
			const tool = s.toolName ? theme.fg("accent", s.toolName) + " " : "";
			const desc = s.description || s.note || "";
			const descText = desc ? theme.fg("muted", truncateToWidth(desc, 40)) : "";
			const duration = s.duration ? theme.fg("dim", `(${formatElapsed(s.duration)})`) : "";

			const line = cursor + meta + " " + id + " " + time + " " + tool + descText + " " + duration;
			return isSelected ? theme.bold(line) : line;
		});

		const footer = "\n" + theme.fg("dim", "↑↓ navigate | Enter: details | Esc: close");
		text.setText(header + lines.join("\n") + footer);
		return text.render(width);
	};

	const handleKey = (key: string): boolean => {
		if (key === "escape") {
			done();
			return true;
		}
		if (key === "up" && selectedIndex > 0) {
			selectedIndex--;
			text.invalidate();
			return true;
		}
		if (key === "down" && selectedIndex < memory.snapshots.length - 1) {
			selectedIndex++;
			text.invalidate();
			return true;
		}
		if (key === "enter" && memory.snapshots.length > 0) {
			// Show details - for now just notify
			done();
			return true;
		}
		return false;
	};

	return {
		render(width: number) { return render(width); },
		invalidate() { text.invalidate(); },
		handleKey(key: string) { return handleKey(key); },
		dispose() {},
		focus() {},
	};
}

// ── Extension Entry ─────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	// ── Tool Registration ────────────────────────────────────────────────────────

	pi.registerTool({
		name: "echo",
		label: "Echo",
		description: "Capture, recall, and query coding session history",
		parameters: EchoParams,

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const action = params.action as string;

			switch (action) {
				case "capture": {
					addSnapshot({
						timestamp: Date.now(),
						isoTime: new Date().toISOString(),
						type: "manual",
						description: params.description || "Manual checkpoint",
						reasoning: pendingReasoning || undefined,
					});
					pendingReasoning = "";
					return {
						content: [{ type: "text", text: `✓ Captured: ${params.description || "checkpoint"}` }],
					};
				}

				case "recall": {
					if (memory.snapshots.length === 0) {
						return { content: [{ type: "text", text: "No snapshots yet." }] };
					}

					const list = memory.snapshots.map((s) => {
						const typeLabel = s.type === "manual" ? "✓" : s.type === "note" ? "●" : "○";
						const tool = s.toolName || "";
						const desc = s.description || s.note || "";
						const dur = s.duration ? ` (${formatElapsed(s.duration)})` : "";
						return `[${typeLabel}] #${s.id} ${formatTime(s.isoTime)} ${tool} ${desc}${dur}`;
					}).join("\n");

					return {
						content: [{ type: "text", text: list }],
					};
				}

				case "jump": {
					const id = params.id;
					if (id === undefined) {
						return { content: [{ type: "text", text: "Usage: echo jump <id>" }] };
					}

					const snapshot = memory.snapshots.find((s) => s.id === id.toString());
					if (!snapshot) {
						return { content: [{ type: "text", text: `Snapshot #${id} not found.` }] };
					}

					const files = snapshot.fileSnapshots || {};
					const entries = Object.entries(files);

					if (entries.length === 0) {
						return {
							content: [{ type: "text", text: `Snapshot #${id} has no file data captured.` }],
						};
					}

					const header = `Snapshot #${id} — ${snapshot.isoTime}\n`;
					const fileContents = entries.map(([path, content]) => {
						const preview = content.length > 200 ? content.slice(0, 200) + "\n...[truncated]" : content;
						return `\n--- ${path} ---\n${preview}`;
					}).join("\n");

					return {
						content: [{ type: "text", text: header + fileContents }],
					};
				}

				case "diff": {
					const id = params.id;
					if (id === undefined) {
						return { content: [{ type: "text", text: "Usage: echo diff <id>" }] };
					}

					const snapshot = memory.snapshots.find((s) => s.id === id.toString());
					if (!snapshot) {
						return { content: [{ type: "text", text: `Snapshot #${id} not found.` }] };
					}

					const oldFiles = snapshot.fileSnapshots || {};
					const filesToDiff = params.files || Object.keys(oldFiles);

					const diffs: string[] = [];
					for (const path of filesToDiff) {
						const oldContent = oldFiles[path];
						if (!oldContent) continue;

						try {
							const current = readFileSync(join(ctx.cwd, path), "utf-8");

							if (oldContent === current) {
								diffs.push(`✓ ${path}: unchanged`);
							} else {
								const addedLines: string[] = [];
								const removedLines: string[] = [];
								const oldLines = oldContent.split("\n");
								const newLines = current.split("\n");

								// Simple line-by-line diff
								for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
									const oldLine = oldLines[i];
									const newLine = newLines[i];

									if (oldLine === newLine) continue;
									if (oldLine && !newLine) removedLines.push(`  ${oldLine}`);
									else if (!oldLine && newLine) addedLines.push(`+ ${newLine}`);
									else if (oldLine !== newLine) {
										if (oldLine) removedLines.push(`- ${oldLine}`);
										if (newLine) addedLines.push(`+ ${newLine}`);
									}
								}

								if (addedLines.length === 0 && removedLines.length === 0) {
									diffs.push(`✓ ${path}: unchanged`);
								} else {
									diffs.push(`\n${path}:`);
									if (removedLines.length > 0) {
										diffs.push(removedLines.slice(0, 10).join("\n"));
									}
									if (addedLines.length > 0) {
										diffs.push(addedLines.slice(0, 10).join("\n"));
									}
								}
							}
						} catch {
							diffs.push(`? ${path}: file not found or unreadable`);
						}
					}

					return {
						content: [{ type: "text", text: `Diff vs snapshot #${id}\n\n${diffs.join("\n") || "No differences."}` }],
					};
				}

				case "note": {
					addSnapshot({
						timestamp: Date.now(),
						isoTime: new Date().toISOString(),
						type: "note",
						note: params.note || "",
						reasoning: pendingReasoning || undefined,
					});
					pendingReasoning = "";
					return {
						content: [{ type: "text", text: `✓ Note saved: ${params.note || "empty"}` }],
					};
				}

				default:
					return { content: [{ type: "text", text: `Unknown action: ${action}` }] };
			}
		},

		renderCall(args, theme) {
			const action = (args as any).action || "?";
			const desc = (args as any).description || (args as any).note || "";
			const id = (args as any).id;
			const detail = action === "jump" || action === "diff" ? `#${id}` : desc.slice(0, 40);
			return new Text(
				theme.fg("toolTitle", theme.bold("echo ")) +
				theme.fg("accent", action) +
				(detail ? theme.fg("dim", " — ") + theme.fg("muted", detail) : ""),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const text = result.content[0];
			return new Text(text?.type === "text" ? text.text : "", 0, 0);
		},
	});

	// ── Commands ────────────────────────────────────────────────────────────────

	pi.registerCommand("echo", {
		description: "Show Echo recall overlay",
		handler: async (_args, ctx) => {
			await ctx.ui.custom<void>((_tui, theme, _kb, done) => {
				return RecallOverlayComponent(memory, theme, () => done());
			});
		},
	});

	pi.registerCommand("echo-pause", {
		description: "Pause auto-capture",
		handler: async (_args, ctx) => {
			isPaused = true;
			ctx.ui.notify("Echo paused — manual capture only", "info");
			updateUI();
		},
	});

	pi.registerCommand("echo-resume", {
		description: "Resume auto-capture",
		handler: async (_args, ctx) => {
			isPaused = false;
			ctx.ui.notify("Echo resumed — auto-capture active", "info");
			updateUI();
		},
	});

	pi.registerCommand("echo-clear", {
		description: "Clear all snapshots",
		handler: async (_args, ctx) => {
			const confirm = await ctx.ui.confirm("Clear all snapshots? This cannot be undone.");
			if (confirm) {
				memory.snapshots = [];
				memory.lastSnapshotId = 0;
				ctx.ui.notify("All snapshots cleared", "info");
				updateUI();
			}
		},
	});

	// ── Event Handlers ─────────────────────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		widgetCtx = ctx;
		loadMemory(ctx.cwd);
		fileCache.clear();
		pendingReasoning = "";
		isPaused = false;

		// Setup footer
		ctx.ui.setFooter((_tui, theme, _footerData) => ({
			dispose: () => {},
			invalidate() {},
			render(width: number): string[] {
				const elapsed = formatElapsed(Date.now() - memory.startTime);
				const count = memory.snapshots.length;
				const status = isPaused ? theme.fg("warning", "○ Paused") : theme.fg("success", "● Recording");

				const left = theme.fg("dim", " Echo: ") +
					theme.fg("accent", elapsed) +
					theme.fg("dim", " | ") +
					theme.fg("muted", `${count} snapshots`) +
					theme.fg("dim", " ") +
					status;

				const right = theme.fg("dim", "/echo for history ");
				const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));

				return [truncateToWidth(left + pad + right, width)];
			},
		}));

		// Setup widget
		ctx.ui.setWidget("echo-timeline", (_tui: any, theme: any) => {
			const text = new Text("", 0, 1);

			return {
				render(width: number): string[] {
					if (memory.snapshots.length === 0) {
						text.setText(theme.fg("dim", "Echo: Waiting for activity..."));
						return text.render(width);
					}

					// Show recent snapshots
					const recent = [...memory.snapshots].slice(-5);
					const lines = recent.map((s) => {
						const typeColor = s.type === "manual" ? "success" : s.type === "note" ? "warning" : "dim";
						const typeLabel = s.type === "manual" ? "✓" : s.type === "note" ? "●" : "○";
						const tool = s.toolName ? `${s.toolName} ` : "";
						const desc = s.description || s.note || "";

						return theme.fg(typeColor, `[${typeLabel}]`) +
							theme.fg("muted", " #" + s.id) +
							theme.fg("dim", " " + formatTime(s.isoTime)) +
							theme.fg("accent", " " + tool) +
							theme.fg("dim", truncateToWidth(desc, 30));
					});

					const header = theme.fg("accent", theme.bold("Echo: Recent Activity"));
					const footer = memory.snapshots.length > 5
						? theme.fg("dim", `...and ${memory.snapshots.length - 5} more`)
						: "";

					text.setText([header, ...lines, footer].join("\n"));
					return text.render(width);
				},
				invalidate() {
					text.invalidate();
				},
			};
		});

		ctx.ui.notify(
			"Echo ready — capturing all tool calls\n" +
			"/echo-pause  /echo-resume  /echo-clear  /echo",
			"info",
		);
	});

	pi.on("tool_execution_end", async (event: ToolExecutionEndEvent, ctx) => {
		if (isPaused) return;

		// Cache files that were read/written
		if (event.toolName === "read") {
			try {
				const path = (event.inputs as any)?.path;
				if (path && typeof path === "string") {
					const content = readFileSync(join(ctx.cwd, path), "utf-8");
					fileCache.set(path, content);
				}
			} catch {}
		} else if (event.toolName === "write" || event.toolName === "edit") {
			try {
				const path = (event.inputs as any)?.path;
				if (path && typeof path === "string") {
					const content = readFileSync(join(ctx.cwd, path), "utf-8");
					fileCache.set(path, content);
				}
			} catch {}
		}

		addSnapshot({
			timestamp: Date.now(),
			isoTime: new Date().toISOString(),
			type: "auto",
			toolName: event.toolName,
			inputs: event.inputs,
			outputs: event.outputs,
			duration: event.duration,
			reasoning: pendingReasoning || undefined,
		});

		pendingReasoning = "";
	});

	pi.on("message_end", async (_event: MessageEndEvent) => {
		// Capture reasoning from previous message_end events
		// This would be populated by thinking events if available
	});

	pi.on("session_end", async (_event: SessionEndEvent, ctx) => {
		saveMemory(ctx.cwd);
	});
}
