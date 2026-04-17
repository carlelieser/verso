const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = (config) =>
	withProjectBuildGradle(config, (mod) => {
		const { contents } = mod.modResults;
		const repo = `maven { url 'https://www.beatunes.com/repo/maven2' }`;
		if (contents.includes('beatunes.com')) return mod;
		mod.modResults.contents = contents.replace(
			/maven\s*\{\s*url\s*['"]https:\/\/www\.jitpack\.io['"]\s*\}/,
			`maven { url 'https://www.jitpack.io' }\n    ${repo}`,
		);
		return mod;
	});
