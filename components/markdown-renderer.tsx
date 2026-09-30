"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  konten: string;
  className?: string;
};

export function MarkdownRenderer({ konten, className = "" }: Props) {
  return (
    <div
      className={`prose-harvestan ${className}`}
      style={{
        fontSize: "16px",
        lineHeight: 1.75,
        color: "#2c5e2e",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 800,
                marginTop: "32px",
                marginBottom: "16px",
                color: "#2c5e2e",
                lineHeight: 1.3,
                letterSpacing: "-0.5px",
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                fontSize: "26px",
                fontWeight: 800,
                marginTop: "32px",
                marginBottom: "14px",
                color: "#2c5e2e",
                lineHeight: 1.35,
                letterSpacing: "-0.3px",
                paddingBottom: "8px",
                borderBottom: "3px solid rgba(240, 180, 41, 0.4)",
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              style={{
                fontSize: "21px",
                fontWeight: 800,
                marginTop: "26px",
                marginBottom: "12px",
                color: "#2c5e2e",
                lineHeight: 1.4,
              }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              style={{
                fontSize: "18px",
                fontWeight: 700,
                marginTop: "22px",
                marginBottom: "10px",
                color: "#2c5e2e",
              }}
            >
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p
              style={{
                marginTop: "16px",
                marginBottom: "16px",
                lineHeight: 1.75,
                color: "#2c5e2e",
              }}
            >
              {children}
            </p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              style={{
                color: "#2c5e2e",
                textDecoration: "underline",
                textDecorationColor: "rgba(240, 180, 41, 0.6)",
                textDecorationThickness: "2px",
                textUnderlineOffset: "3px",
                fontWeight: 600,
              }}
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong
              style={{
                fontWeight: 800,
                color: "#1f4521",
              }}
            >
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em style={{ fontStyle: "italic", color: "#2c5e2e" }}>
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul
              style={{
                marginTop: "16px",
                marginBottom: "16px",
                paddingLeft: "24px",
                listStyleType: "disc",
              }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              style={{
                marginTop: "16px",
                marginBottom: "16px",
                paddingLeft: "24px",
                listStyleType: "decimal",
              }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li
              style={{
                marginTop: "8px",
                marginBottom: "8px",
                lineHeight: 1.7,
              }}
            >
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                marginTop: "20px",
                marginBottom: "20px",
                paddingLeft: "20px",
                paddingRight: "20px",
                paddingTop: "12px",
                paddingBottom: "12px",
                borderLeft: "6px solid #f0b429",
                background: "rgba(240, 180, 41, 0.08)",
                borderRadius: "0 12px 12px 0",
                fontStyle: "italic",
                color: "#2c5e2e",
              }}
            >
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }: any) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  style={{
                    background: "rgba(44, 94, 46, 0.08)",
                    color: "#1f4521",
                    padding: "2px 6px",
                    borderRadius: "6px",
                    fontSize: "0.9em",
                    fontFamily:
                      "'Courier New', Consolas, Monaco, monospace",
                    fontWeight: 600,
                  }}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={className}
                style={{
                  display: "block",
                  background: "#1f4521",
                  color: "#f0b429",
                  padding: "16px 20px",
                  borderRadius: "16px",
                  overflowX: "auto",
                  fontSize: "14px",
                  fontFamily: "'Courier New', Consolas, Monaco, monospace",
                  lineHeight: 1.6,
                  marginTop: "20px",
                  marginBottom: "20px",
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre style={{ margin: 0 }}>{children}</pre>,
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || ""}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "16px",
                marginTop: "20px",
                marginBottom: "20px",
                border: "2px solid rgba(44, 94, 46, 0.1)",
              }}
            />
          ),
          table: ({ children }) => (
            <div
              style={{
                overflowX: "auto",
                marginTop: "20px",
                marginBottom: "20px",
                borderRadius: "16px",
                border: "2px solid rgba(44, 94, 46, 0.1)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ background: "#2c5e2e", color: "#ffffff" }}>
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: 800,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: "12px 16px",
                borderTop: "1px solid rgba(44, 94, 46, 0.1)",
                color: "#2c5e2e",
              }}
            >
              {children}
            </td>
          ),
          hr: () => (
            <hr
              style={{
                marginTop: "32px",
                marginBottom: "32px",
                border: "none",
                borderTop: "2px solid rgba(240, 180, 41, 0.4)",
              }}
            />
          ),
        }}
      >
        {konten}
      </ReactMarkdown>
    </div>
  );
}
