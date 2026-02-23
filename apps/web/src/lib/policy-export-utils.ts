import type { PolicyDocument } from "@/lib/policies-api";

/**
 * Export a policy document to PDF via the browser's print dialog.
 * Uses window.open and DOM manipulation to render a printable HTML page.
 */
export function exportPolicyToPDF(doc: PolicyDocument): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const pwDoc = printWindow.document;

  // Build head
  const style = pwDoc.createElement('style');
  style.textContent = `
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 8px; }
    .section { margin-top: 24px; }
    .section-title { font-size: 14px; font-weight: bold; color: #666; margin-bottom: 8px; }
    .content { white-space: pre-wrap; line-height: 1.6; }
    @media print { body { padding: 20px; } }
  `;
  pwDoc.head.appendChild(style);
  pwDoc.title = `${doc.documentId} - ${doc.title}`;

  // Build body via DOM manipulation
  const body = pwDoc.body;

  const h1 = pwDoc.createElement('h1');
  h1.textContent = doc.title;
  body.appendChild(h1);

  const meta = pwDoc.createElement('div');
  meta.className = 'meta';

  const addBadge = (text: string, bg: string) => {
    const span = pwDoc.createElement('span');
    span.className = 'badge';
    span.style.background = bg;
    span.textContent = text;
    meta.appendChild(span);
  };
  addBadge(doc.documentId, '#e3f2fd');
  addBadge(doc.status, '#e8f5e9');
  addBadge(doc.classification, '#fff3e0');

  const versionSpan = pwDoc.createElement('span');
  versionSpan.textContent = `Version ${doc.version}`;
  meta.appendChild(versionSpan);
  body.appendChild(meta);

  const addSection = (title: string, content: string) => {
    const section = pwDoc.createElement('div');
    section.className = 'section';
    const sTitle = pwDoc.createElement('div');
    sTitle.className = 'section-title';
    sTitle.textContent = title;
    section.appendChild(sTitle);
    const sContent = pwDoc.createElement('div');
    sContent.className = 'content';
    sContent.textContent = content;
    section.appendChild(sContent);
    body.appendChild(section);
  };

  addSection('Purpose', doc.purpose);
  addSection('Scope', doc.scope);
  addSection('Content', doc.content);

  // Footer metadata - using DOM manipulation with safe textContent
  const footer = pwDoc.createElement('div');
  footer.className = 'section';
  footer.style.marginTop = '40px';
  footer.style.paddingTop = '20px';
  footer.style.borderTop = '1px solid #ddd';
  const footerMeta = pwDoc.createElement('div');
  footerMeta.className = 'meta';

  const lines = [
    `Document Owner: ${doc.documentOwner}`,
    `Author: ${doc.author}`,
    `Review Frequency: ${doc.reviewFrequency}`,
  ];
  if (doc.effectiveDate) {
    lines.push(`Effective Date: ${new Date(doc.effectiveDate).toLocaleDateString()}`);
  }
  if (doc.nextReviewDate) {
    lines.push(`Next Review: ${new Date(doc.nextReviewDate).toLocaleDateString()}`);
  }
  // Use safe DOM methods: create text nodes and <br> elements
  lines.forEach((line, idx) => {
    footerMeta.appendChild(pwDoc.createTextNode(line));
    if (idx < lines.length - 1) {
      footerMeta.appendChild(pwDoc.createElement('br'));
    }
  });

  footer.appendChild(footerMeta);
  body.appendChild(footer);

  pwDoc.close();
  printWindow.print();
}

/**
 * Export a policy document to Markdown format and trigger download.
 */
export function exportPolicyToMarkdown(doc: PolicyDocument): void {
  const markdown = `# ${doc.title}

**Document ID:** ${doc.documentId}
**Version:** ${doc.version}
**Status:** ${doc.status}
**Classification:** ${doc.classification}
**Document Type:** ${doc.documentType}

---

## Document Metadata

- **Owner:** ${doc.documentOwner}
- **Author:** ${doc.author}
- **Review Frequency:** ${doc.reviewFrequency}
${doc.effectiveDate ? `- **Effective Date:** ${new Date(doc.effectiveDate).toLocaleDateString()}` : ''}
${doc.nextReviewDate ? `- **Next Review:** ${new Date(doc.nextReviewDate).toLocaleDateString()}` : ''}

---

## Purpose

${doc.purpose}

---

## Scope

${doc.scope}

---

## Content

${doc.content}

---

${doc.tags && doc.tags.length > 0 ? `## Tags\n\n${doc.tags.join(', ')}\n\n---` : ''}

*Generated on ${new Date().toLocaleDateString()} from RiskReady GRC*
`;

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = `${doc.documentId}-${doc.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export a policy document to HTML format and trigger download.
 * The exported HTML is a static file download, not rendered in the browser DOM.
 */
export function exportPolicyToHTML(doc: PolicyDocument): void {
  // Build the tag elements as safe text
  const tagsSection = doc.tags && doc.tags.length > 0
    ? `<div class="section">
    <div class="section-title">Tags</div>
    <div class="tags">${doc.tags.map(t => {
      // Escape HTML entities in tag text for safe inclusion
      const escaped = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<span class="tag">${escaped}</span>`;
    }).join('')}</div>
  </div>`
    : '';

  // Escape user content for safe HTML embedding in the downloaded file
  const esc = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(doc.documentId)} - ${esc(doc.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; line-height: 1.6; color: #333; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { margin: 0 0 10px; font-size: 28px; }
    .badges { display: flex; gap: 8px; margin-bottom: 15px; }
    .badge { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-primary { background: #e3f2fd; color: #1565c0; }
    .badge-success { background: #e8f5e9; color: #2e7d32; }
    .badge-warning { background: #fff3e0; color: #ef6c00; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px; color: #666; }
    .section { margin-top: 30px; }
    .section-title { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .content { white-space: pre-wrap; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag { background: #f5f5f5; padding: 4px 10px; border-radius: 4px; font-size: 12px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${esc(doc.title)}</h1>
    <div class="badges">
      <span class="badge badge-primary">${esc(doc.documentId)}</span>
      <span class="badge badge-success">${esc(doc.status)}</span>
      <span class="badge badge-warning">${esc(doc.classification)}</span>
      <span class="badge">v${esc(String(doc.version))}</span>
    </div>
    <div class="meta-grid">
      <div><strong>Owner:</strong> ${esc(doc.documentOwner)}</div>
      <div><strong>Author:</strong> ${esc(doc.author)}</div>
      <div><strong>Type:</strong> ${esc(doc.documentType)}</div>
      <div><strong>Review:</strong> ${esc(doc.reviewFrequency)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Purpose</div>
    <div class="content">${esc(doc.purpose)}</div>
  </div>

  <div class="section">
    <div class="section-title">Scope</div>
    <div class="content">${esc(doc.scope)}</div>
  </div>

  <div class="section">
    <div class="section-title">Content</div>
    <div class="content">${esc(doc.content)}</div>
  </div>

  ${tagsSection}

  <div class="footer">
    Generated on ${new Date().toLocaleString()} from RiskReady GRC
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = `${doc.documentId}-${doc.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
