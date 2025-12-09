import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "./ThemeProvider";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for code block start
    if (line.startsWith("```")) {
      const language = line.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;

      // Collect all lines until closing ```
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }

      const code = codeLines.join("\n");

      elements.push(
        <div key={`code-${i}`} className="my-4 rounded-lg overflow-hidden border border-border">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {language}
            </span>
          </div>
          <SyntaxHighlighter
            language={language}
            style={isDark ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: "0.875rem",
              padding: "1rem",
            }}
            showLineNumbers={codeLines.length > 3}
            lineNumberStyle={{
              minWidth: "2.5em",
              paddingRight: "1em",
              color: isDark ? "#6b7280" : "#9ca3af",
              userSelect: "none",
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );

      i++; // Skip the closing ```
      continue;
    }

    // Check for image (![alt](src))
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      const [, alt, src] = imageMatch;
      elements.push(
        <div key={i} className="my-4">
          <img
            src={src}
            alt={alt}
            className="max-w-full h-auto rounded-lg border border-border"
          />
          {alt && (
            <p className="text-sm text-muted-foreground text-center mt-2 italic">
              {alt}
            </p>
          )}
        </div>
      );
      i++;
      continue;
    }

    // Check for inline code and images
    const renderInlineContent = (text: string) => {
      // Match inline images and inline code
      const parts = text.split(/(!\[[^\]]*\]\([^)]+\)|`[^`]+`)/g);
      return parts.map((part, idx) => {
        // Inline image
        const inlineImageMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (inlineImageMatch) {
          const [, alt, src] = inlineImageMatch;
          return (
            <img
              key={idx}
              src={src}
              alt={alt}
              className="inline-block max-h-64 rounded border border-border mx-1"
            />
          );
        }
        // Inline code
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-sm"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });
    };

    // Headings
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-2xl font-bold mt-8 mb-4 text-foreground">
          {renderInlineContent(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-primary">
          {renderInlineContent(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">
          {renderInlineContent(line.slice(4))}
        </h3>
      );
    }
    // Lists
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-6 mb-1 list-disc text-foreground">
          {renderInlineContent(line.slice(2))}
        </li>
      );
    } else if (line.match(/^\d+\./)) {
      elements.push(
        <li key={i} className="ml-6 mb-1 list-decimal text-foreground">
          {renderInlineContent(line.replace(/^\d+\.\s*/, ""))}
        </li>
      );
    }
    // Empty lines
    else if (line.trim() === "") {
      elements.push(<div key={i} className="h-4" />);
    }
    // Regular paragraphs
    else {
      elements.push(
        <p key={i} className="mb-2 text-foreground leading-relaxed">
          {renderInlineContent(line)}
        </p>
      );
    }

    i++;
  }

  return <div className="prose-content">{elements}</div>;
}
