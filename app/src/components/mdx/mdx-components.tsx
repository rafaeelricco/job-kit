export { mdxComponents }

import type { ComponentProps } from "react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

const mdxComponents = {
  h1: (props: ComponentProps<"h1">) => <h1 className="text-2xl font-bold tracking-tight md:text-4xl" {...props} />,
  h2: (props: ComponentProps<"h2">) => <h2 className="text-xl font-semibold tracking-tight md:text-2xl" {...props} />,
  h3: (props: ComponentProps<"h3">) => <h3 className="text-lg font-semibold md:text-xl" {...props} />,
  h4: (props: ComponentProps<"h4">) => <h4 className="text-base font-semibold md:text-lg" {...props} />,

  p: (props: ComponentProps<"p">) => <p className="text-base leading-relaxed" {...props} />,
  ul: (props: ComponentProps<"ul">) => <ul className="list-disc pl-5 text-base" {...props} />,
  ol: (props: ComponentProps<"ol">) => <ol className="list-decimal pl-5 text-base" {...props} />,
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote className="border-l-4 border-border pl-4 italic" {...props} />
  ),
  hr: () => <hr className="my-6 border-t border-border" />,

  img: ({ alt, ...props }: ComponentProps<"img">) => (
    <img {...props} loading="lazy" className="my-4 rounded-lg" alt={alt ?? ""} />
  ),

  // In-page anchors and external links stay native; everything else is client-routed.
  a: (props: ComponentProps<"a">) => {
    const href = props.href ?? ""

    if (href.startsWith("#")) return <a {...props} />

    const isExternal = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")
    if (isExternal) return <a {...props} target="_blank" rel="noopener noreferrer" />

    return (
      <Link to={href} className={props.className}>
        {props.children}
      </Link>
    )
  },

  // rehype-pretty-code sets data-language on block code only; bare backticks get the chip.
  code: ({ className, ...props }: ComponentProps<"code">) => {
    const isBlock = "data-language" in props

    if (isBlock) return <code className={cn("relative", className)} {...props} />

    return (
      <code
        className={cn(
          "relative rounded-sm bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[0.8rem]! font-normal wrap-break-word",
          className
        )}
        {...props}
      />
    )
  },

  table: (props: ComponentProps<"table">) => (
    <div className="my-6 w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-base" {...props} />
    </div>
  ),
  thead: (props: ComponentProps<"thead">) => <thead className="border-b border-border" {...props} />,
  tbody: (props: ComponentProps<"tbody">) => <tbody className="divide-y divide-border" {...props} />,
  th: (props: ComponentProps<"th">) => <th className="px-4 py-3 text-left font-semibold text-foreground" {...props} />,
  td: (props: ComponentProps<"td">) => <td className="px-4 py-3 align-middle text-foreground" {...props} />,
}
