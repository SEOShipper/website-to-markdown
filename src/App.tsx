"use client";

import { useState } from "react";
import TurndownService from "@joplin/turndown";
import TurndownPluginGfm from "@joplin/turndown-plugin-gfm";
import ContentSelector from "./components/content-selector";

const DEBUG = true;

// Declare chrome variable for use in non-chrome environments (e.g., testing)

function App() {
	const [success, setSuccess] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [markdown, setMarkdown] = useState<string>("");
	// const [hasMain, setHasMain] = useState<boolean>(false);
	const [contentType, setContentType] = useState<string>("main");

	const turndownService = new TurndownService({
		headingStyle: "atx",
		codeBlockStyle: "fenced",
		emDelimiter: "_",
	});

	if (TurndownPluginGfm) {
		const gfm = TurndownPluginGfm.gfm;
		turndownService.use(gfm);
	}

	turndownService.addRule("removeStyles", {
		filter: ["style", "script"],
		replacement: () => "",
	});

	const convertToMarkdown = async (source: "body" | "main" | "all") => {
		try {
			let tabs = await chrome.tabs.query({
				currentWindow: true,
				url: ["https://*/*", "http://*/*"],
			});

			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
				url: ["https://*/*", "http://*/*"],
			});

			tabs = tabs.filter((tab) => tab.id !== undefined);

			if (!tab.id) throw new Error("No active tab found");

			if (source === "all") {
				const results = await Promise.all(
					tabs.map(async (tab) => {
						if (!tab.id) throw new Error("No active tab found");

						const result = await chrome.scripting.executeScript({
							target: { tabId: tab.id },
							func: (contentType) => {
								// Get the title
								const title = document.title;
								const url = document.URL;
								let content =
									contentType === "main" && document.querySelector("main")
										? document.querySelector("main")?.innerHTML
										: document.body.innerHTML;

								const temp = document.createElement("div");
								temp.innerHTML = content || "";

								const scripts = temp.getElementsByTagName("script");
								const styles = temp.getElementsByTagName("style");

								for (let i = scripts.length - 1; i >= 0; i--) {
									scripts[i].remove();
								}
								for (let i = styles.length - 1; i >= 0; i--) {
									styles[i].remove();
								}

								content = temp.innerHTML;

								return {
									title,
									content,
									url,
								};
							},
							args: [contentType],
						});

						return result[0].result as {
							title: string;
							content: string;
							url: string;
						};
					}),
				);

				const md = results
					.map((result) => {
						const content = turndownService.turndown(result.content);

						return `
-------------------------------------------
############## CONTENT START ##############
-------------------------------------------

Source: ${result.title} (${result.url})

${content}

-------------------------------------------
############## CONTENT END ###############
-------------------------------------------
      `;
					})
					.join("\n\n");

				setMarkdown(md);
				setSuccess("Website converted to Markdown!");
				setError(null);
			} else {
				const result = await chrome.scripting.executeScript({
					target: { tabId: tab.id },
					func: (source) => {
						// Get the title
						const title = document.title;
						let content = "";

						switch (source) {
							case "body":
								content = document.body.innerHTML;
								break;

							default:
								const mainElement = document.querySelector("main");
								content = mainElement?.innerHTML || document.body.innerHTML;
								break;
						}

						const temp = document.createElement("div");
						temp.innerHTML = content;

						const scripts = temp.getElementsByTagName("script");
						const styles = temp.getElementsByTagName("style");

						for (let i = scripts.length - 1; i >= 0; i--) {
							scripts[i].remove();
						}
						for (let i = styles.length - 1; i >= 0; i--) {
							styles[i].remove();
						}

						content = temp.innerHTML;

						return {
							title,
							content,
							url: document.URL,
						};
					},
					args: [source],
				});

				const { title, content, url } = result[0].result as {
					title: string;
					content: string;
					url: string;
				};

				// Combine title and content
				const md = `# ${title} (${url})\n\n${turndownService.turndown(content)}`;

				setMarkdown(md);
				setSuccess("Website converted to Markdown!");
				setError(null);
			}
		} catch (err) {
			setError(`Failed to convert website: ${(err as Error).message}`);
			setSuccess(null);
		}
	};

	const downloadMarkdown = async () => {
		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (!tab.id) throw new Error("No active tab found");

			const titleResult = await chrome.scripting.executeScript({
				target: { tabId: tab.id },
				func: () => {
					// Get the title
					const title = document.title;

					return {
						title,
					};
				},
			});

			const blob = new Blob([markdown], { type: "text/markdown" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${titleResult[0].result?.title}.md`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			setSuccess("Markdown file downloaded!");
			setError(null);
		} catch (err) {
			setError(`Failed to download file: ${(err as Error).message}`);
			setSuccess(null);
		}
	};

	return (
		<div className="min-h-[300px] min-w-[500px] bg-[#d5f0f8]">
			<div className="container mx-auto p-4 flex flex-col items-center">
				<div className="w-full flex justify-end mb-4">
					<ContentSelector
						selectedOption={contentType}
						onOptionChange={setContentType}
					/>
				</div>

				<img
					src="logo.png"
					alt="Website To Markdown"
					className="w-[80px] h-[80px] mb-4"
				/>
				<h1 className="text-xl font-bold mb-4 text-[#222]">
					Website To Markdown
				</h1>
				<div className="flex flex-col items-center gap-4 justify-center mb-4">
					{/* Debug buttons */}
					{DEBUG ? <></> : null}

					<button
						type="submit"
						onClick={() => convertToMarkdown("all")}
						className="w-[220px] px-4 py-2 bg-[#51b0ef] hover:bg-[#438dd2] text-white text-sm font-bold rounded-md"
					>
						<div className="flex flex-col items-center gap-2">
							<div>Convert All Tabs</div>
							<div className="text-xs text-gray-300">
								({contentType === "main" ? "main content" : "body content"})
							</div>
						</div>
					</button>

					<button
						type="submit"
						onClick={() => convertToMarkdown("main")}
						className="w-[220px] px-4 py-2 bg-[#51b0ef] hover:bg-[#438dd2] text-white text-sm font-bold rounded-md"
					>
						<div className="flex flex-col items-center gap-2">
							<div>Convert Current Tab</div>
							<div className="text-xs text-gray-300">
								(Current tab,{" "}
								{contentType === "main" ? "main content" : "body content"})
							</div>
						</div>
					</button>

					{markdown && (
						<button
							type="submit"
							onClick={downloadMarkdown}
							className="w-[220px] px-4 py-2 bg-[#45e08b] hover:bg-[#43d27a] text-white text-sm font-bold rounded-md"
						>
							Download Markdown
						</button>
					)}
				</div>
				{success && (
					<div className="text-green-500 text-sm text-center p-4 bg-green-50 rounded-md border border-green-200">
						{success}
					</div>
				)}
				{error && (
					<div className="text-red-500 text-sm text-center p-4 bg-red-50 rounded-md border border-red-200">
						{error}
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
