import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

// Renders chat message bodies (project chat, AI chat) as Markdown so text
// copied from tools like ChatGPT (bold, lists, code, links, line breaks)
// keeps its formatting instead of showing raw ** / # / - characters inline.
// remarkBreaks turns single newlines into <br> (GFM alone only breaks on
// blank lines), matching how chat apps usually treat pasted paragraphs.
const components = {
  a: ({ node, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="underline decoration-brand-400/50 text-brand-300 hover:text-brand-200 break-all"
    />
  ),
  p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-1.5 last:mb-0 space-y-0.5" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-1.5 last:mb-0 space-y-0.5" {...props} />,
  li: ({ node, ...props }) => <li {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  del: ({ node, ...props }) => <del className="opacity-70" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-2 border-white/20 pl-2.5 my-1.5 opacity-80" {...props} />
  ),
  // react-markdown v10 no longer tells us inline vs block via a prop, so
  // block code (wrapped in <pre>) picks up styling from the `pre` rule below
  // and this only needs to style the inline case.
  code: ({ node, ...props }) => (
    <code className="px-1 py-0.5 rounded bg-black/25 font-mono text-[0.85em]" {...props} />
  ),
  pre: ({ node, ...props }) => (
    <pre
      className="rounded-lg bg-black/25 px-2.5 py-2 my-1.5 overflow-x-auto [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
  h1: ({ node, ...props }) => <p className="font-bold text-[1.05em] mb-1" {...props} />,
  h2: ({ node, ...props }) => <p className="font-bold text-[1.03em] mb-1" {...props} />,
  h3: ({ node, ...props }) => <p className="font-bold mb-1" {...props} />,
  h4: ({ node, ...props }) => <p className="font-bold mb-1" {...props} />,
  h5: ({ node, ...props }) => <p className="font-bold mb-1" {...props} />,
  h6: ({ node, ...props }) => <p className="font-bold mb-1" {...props} />,
  hr: () => <hr className="border-white/10 my-1.5" />,
};

export default function MarkdownMessage({ text, className = "" }) {
  return (
    <div className={`text-sm break-words [&_p]:break-words ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {String(text ?? "")}
      </ReactMarkdown>
    </div>
  );
}
