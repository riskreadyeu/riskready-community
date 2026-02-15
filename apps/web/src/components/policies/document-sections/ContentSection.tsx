"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Target,
  Maximize2,
  FileCheck,
  ListChecks,
  Scale,
  AlertTriangle,
  FileText,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentSectionType } from "./types";

interface ContentSectionProps {
  sectionType: DocumentSectionType;
  title?: string;
  content: string;
  className?: string;
  icon?: LucideIcon;
  variant?: "default" | "highlight" | "warning";
}

const sectionIcons: Partial<Record<DocumentSectionType, LucideIcon>> = {
  PURPOSE: Target,
  SCOPE: Maximize2,
  POLICY_STATEMENTS: FileCheck,
  REQUIREMENTS: ListChecks,
  COMPLIANCE: Scale,
  EXCEPTIONS: AlertTriangle,
  CUSTOM: FileText,
};

const variantStyles = {
  default: "",
  highlight: "border-l-4 border-l-primary bg-primary/5",
  warning: "border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
};

export function ContentSection({
  sectionType,
  title,
  content,
  className,
  icon,
  variant = "default",
}: ContentSectionProps) {
  const Icon = icon || sectionIcons[sectionType] || FileText;

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="policy-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Headings
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mt-8 mb-4 first:mt-0 text-foreground">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold mt-8 mb-4 first:mt-0 text-foreground">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold mt-6 mb-3 first:mt-0 text-foreground">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-sm font-semibold mt-5 mb-2 first:mt-0 text-foreground">{children}</h4>
            ),
            // Paragraphs
            p: ({ children }) => (
              <p className="text-sm leading-7 my-4 first:mt-0 last:mb-0 text-foreground/90">{children}</p>
            ),
            // Unordered Lists
            ul: ({ children }) => (
              <ul className="my-4 space-y-2 pl-0">{children}</ul>
            ),
            // Ordered Lists
            ol: ({ children }) => (
              <ol className="my-4 space-y-2 pl-0 list-none counter-reset-[item]">{children}</ol>
            ),
            // List items - with bullet styling
            li: ({ children }: any) => (
              <li className="text-sm leading-7 text-foreground/90 flex items-start gap-3 pl-1">
                <span className="text-primary shrink-0 select-none">•</span>
                <span className="flex-1">{children}</span>
              </li>
            ),
            // Strong/Bold
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            // Emphasis/Italic
            em: ({ children }) => (
              <em className="italic">{children}</em>
            ),
            // Blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/30 pl-4 my-6 italic text-muted-foreground bg-muted/20 py-3 rounded-r">
                {children}
              </blockquote>
            ),
            // Tables
            table: ({ children }) => (
              <div className="my-6 overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-border rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted">{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody>{children}</tbody>
            ),
            tr: ({ children }) => (
              <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">{children}</tr>
            ),
            th: ({ children }) => (
              <th className="px-4 py-3 text-left font-semibold text-foreground text-sm border-r border-border last:border-r-0">{children}</th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-3 text-foreground/90 text-sm border-r border-border last:border-r-0">{children}</td>
            ),
            // Code
            code: ({ children, className: codeClassName }) => {
              const isInline = !codeClassName;
              return isInline ? (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">{children}</code>
              ) : (
                <code className={cn("block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto my-4", codeClassName)}>
                  {children}
                </code>
              );
            },
            // Links
            a: ({ children, href }) => (
              <a 
                href={href} 
                className="text-primary underline underline-offset-2 hover:no-underline" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            // Horizontal rule
            hr: () => <hr className="my-8 border-border" />,
          }}
        >
          {content}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
}
