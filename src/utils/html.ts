/** Escape text for safe insertion into HTML content. */
export function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Append a paragraph to an HTML string (before the closing </html> tag). */
export function appendHtmlParagraph(html: string, text: string): string {
	const escaped = escapeHtml(text);
	return html.replace(/<\/html>\s*$/, `<p>${escaped}</p>\n</html>`);
}
