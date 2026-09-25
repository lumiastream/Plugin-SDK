const PRIVATE_EXAMPLES = ["openrgb"];

const GPT_KNOWLEDGE_FILE_LIMIT = 20;

const EXAMPLE_BUNDLES = [
	{
		slug: "starters",
		title: "Starter Templates",
		useWhen:
			"Start here: the `npx lumia-plugin create` template, a TypeScript build setup, and a reference plugin covering every settings field type, OAuth, and a custom auth display.",
		examples: ["base_plugin", "typescript_plugin", "settings_showcase"],
		categories: ["development"],
	},
	{
		slug: "audio-tts-song-requests",
		title: "Audio, TTS And Song Requests",
		useWhen:
			"Text-to-speech voice providers (`hasTtsVoices`), generating and playing audio, and song-request sources (`hasSongRequests`).",
		examples: ["elevenlabs_tts", "tts_monster", "song_request_source"],
		categories: ["audio"],
	},
	{
		slug: "ai-and-chat-tools",
		title: "AI And Chat Tools",
		useWhen:
			"AI providers (`hasAI`, `aiPrompt`, `aiModels`), template variable functions, and processing chat messages.",
		examples: ["ollama", "openclaw", "chat_summarizer"],
		categories: ["apps", "chat"],
	},
	{
		slug: "streaming-platforms",
		title: "Streaming Platforms",
		useWhen:
			"Streaming and social platform integrations: live status, chat display, native chatbot (`hasChatbot`), moderation commands (`modcommandOptions`), OAuth, and posting.",
		examples: ["trovo", "rumble", "x"],
		categories: ["platforms"],
	},
	{
		slug: "games",
		title: "Games",
		useWhen:
			"Polling third-party game APIs into variables and alerts, with request timeouts, backoff, and change detection.",
		examples: ["steam", "retro_achievements", "eveonline", "minecraft_server"],
		categories: ["games"],
	},
	{
		slug: "devices-feeds-monitors",
		title: "Devices, Feeds And Monitors",
		useWhen:
			"LAN devices, notification and RSS feeds, system stats, and scheduled alerts; persisted state and long-running subscriptions.",
		examples: [
			"divoom_pixoo",
			"ntfy",
			"rss_feed_monitor",
			"system_monitor",
			"mawakit",
		],
		categories: [],
		fallback: true,
	},
];

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const privateExamplePattern = new RegExp(
	`examples/(${PRIVATE_EXAMPLES.map(escapeRegExp).join("|")})(?![\\w-])`,
);

function isPrivateExample(name) {
	return PRIVATE_EXAMPLES.includes(name);
}

function stripPrivateExampleLines(markdown) {
	return markdown
		.split("\n")
		.filter((line) => !privateExamplePattern.test(line))
		.join("\n");
}

function findPrivateExampleMentions(text) {
	const lower = text.toLowerCase();
	return PRIVATE_EXAMPLES.filter((name) => lower.includes(name.toLowerCase()));
}

module.exports = {
	EXAMPLE_BUNDLES,
	GPT_KNOWLEDGE_FILE_LIMIT,
	PRIVATE_EXAMPLES,
	findPrivateExampleMentions,
	isPrivateExample,
	stripPrivateExampleLines,
};
