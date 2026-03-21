import { htmlToMarkdown } from "@/utils/html-to-markdown";

describe("htmlToMarkdown", () => {
  describe("headings", () => {
    it("converts h1 to markdown heading", () => {
      const result = htmlToMarkdown("<h1>Title</h1>");
      expect(result).toContain("# Title");
    });

    it("converts h2 to markdown heading", () => {
      const result = htmlToMarkdown("<h2>Subtitle</h2>");
      expect(result).toContain("## Subtitle");
    });

    it("converts h3 to markdown heading", () => {
      const result = htmlToMarkdown("<h3>Section</h3>");
      expect(result).toContain("### Section");
    });
  });

  describe("inline formatting", () => {
    it("converts bold/strong to **text**", () => {
      const result = htmlToMarkdown("<p>This is <strong>bold</strong> text</p>");
      expect(result).toContain("**bold**");
    });

    it("converts <b> to **text**", () => {
      const result = htmlToMarkdown("<p>This is <b>bold</b> text</p>");
      expect(result).toContain("**bold**");
    });

    it("converts italic/em to *text*", () => {
      const result = htmlToMarkdown("<p>This is <em>italic</em> text</p>");
      expect(result).toContain("*italic*");
    });

    it("converts <i> to *text*", () => {
      const result = htmlToMarkdown("<p>This is <i>italic</i> text</p>");
      expect(result).toContain("*italic*");
    });
  });

  describe("lists", () => {
    it("converts unordered lists to - items", () => {
      const html = "<ul><li>First</li><li>Second</li><li>Third</li></ul>";
      const result = htmlToMarkdown(html);

      expect(result).toContain("- First");
      expect(result).toContain("- Second");
      expect(result).toContain("- Third");
    });

    it("converts ordered lists to numbered items", () => {
      const html = "<ol><li>First</li><li>Second</li><li>Third</li></ol>";
      const result = htmlToMarkdown(html);

      expect(result).toContain("1. First");
      expect(result).toContain("2. Second");
      expect(result).toContain("3. Third");
    });
  });

  describe("blockquotes", () => {
    it("converts blockquotes to > prefixed lines", () => {
      const html = "<blockquote>A wise quote</blockquote>";
      const result = htmlToMarkdown(html);

      expect(result).toContain("> A wise quote");
    });
  });

  describe("images", () => {
    it("strips inline images", () => {
      const html = '<p>Text before <img src="photo.jpg" alt="photo"> text after</p>';
      const result = htmlToMarkdown(html);

      expect(result).not.toContain("<img");
      expect(result).not.toContain("photo.jpg");
      expect(result).toContain("Text before");
      expect(result).toContain("text after");
    });
  });

  describe("frontmatter", () => {
    it("generates YAML frontmatter with date, emotions, and location", () => {
      const frontmatter = {
        date: "2026-03-20",
        emotions: ["happy", "grateful"],
        location: "Home",
      };

      const result = htmlToMarkdown("<p>Journal entry</p>", frontmatter);

      expect(result).toMatch(/^---\n/);
      expect(result).toContain("date: 2026-03-20");
      expect(result).toContain("emotions:");
      expect(result).toContain("happy");
      expect(result).toContain("grateful");
      expect(result).toContain("location: Home");
      expect(result).toContain("---\n");
      expect(result).toContain("Journal entry");
    });

    it("handles empty frontmatter fields", () => {
      const frontmatter = {
        date: "2026-03-20",
        emotions: [],
        location: "",
      };

      const result = htmlToMarkdown("<p>Entry</p>", frontmatter);

      expect(result).toMatch(/^---\n/);
      expect(result).toContain("date: 2026-03-20");
      expect(result).toContain("Entry");
    });
  });

  describe("HTML entities", () => {
    it("decodes HTML entities", () => {
      const html = "<p>Tom &amp; Jerry &lt;friends&gt; said &quot;hello&quot;</p>";
      const result = htmlToMarkdown(html);

      expect(result).toContain("Tom & Jerry");
      expect(result).toContain("<friends>");
      expect(result).toContain('"hello"');
    });
  });
});
