import * as React from 'react'

interface AnnouncementContentProps {
  content: string
  className?: string
}

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'link'; text: string; url: string }
  | { type: 'email'; address: string }

/**
 * Safely parses inline markdown (bold, italic, links, emails)
 * without ever using innerHTML.
 */
function parseInline(text: string): React.ReactNode[] {
  // Regex matches:
  // 1. [text](url) -> markdown link
  // 2. **bold** or __bold__
  // 3. *italic* or _italic_
  // 4. bare emails
  // 5. bare URLs
  const tokenRegex =
    /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+\*(?!\*)|(?<!_)_[^_]+_(?!_)|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|https?:\/\/[^\s]+)/g

  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(text)) !== null) {
    // Add text preceding match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const matchedStr = match[0]

    if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      // Markdown link: [label](url)
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(matchedStr)
      if (linkMatch) {
        const [, label, url] = linkMatch
        nodes.push(
          <a
            key={`link-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-700 hover:text-purple-900 underline font-semibold transition-colors"
          >
            {label}
          </a>
        )
      } else {
        nodes.push(matchedStr)
      }
    } else if (
      (matchedStr.startsWith('**') && matchedStr.endsWith('**')) ||
      (matchedStr.startsWith('__') && matchedStr.endsWith('__'))
    ) {
      // Bold: **text** or __text__
      const boldText = matchedStr.slice(2, -2)
      nodes.push(
        <strong key={`b-${match.index}`} className="font-bold text-slate-900">
          {boldText}
        </strong>
      )
    } else if (
      (matchedStr.startsWith('*') && matchedStr.endsWith('*')) ||
      (matchedStr.startsWith('_') && matchedStr.endsWith('_'))
    ) {
      // Italic: *text* or _text_
      const italicText = matchedStr.slice(1, -1)
      nodes.push(
        <em key={`i-${match.index}`} className="italic text-slate-800">
          {italicText}
        </em>
      )
    } else if (matchedStr.includes('@') && !matchedStr.startsWith('http')) {
      // Bare email address
      nodes.push(
        <a
          key={`mail-${match.index}`}
          href={`mailto:${matchedStr}`}
          className="text-purple-700 hover:text-purple-900 underline font-medium"
        >
          {matchedStr}
        </a>
      )
    } else if (matchedStr.startsWith('http')) {
      // Bare URL
      nodes.push(
        <a
          key={`url-${match.index}`}
          href={matchedStr}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-700 hover:text-purple-900 underline font-medium break-all"
        >
          {matchedStr}
        </a>
      )
    } else {
      nodes.push(matchedStr)
    }

    lastIndex = match.index + matchedStr.length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

type Block =
  | { type: 'paragraph'; lines: string[]; isSignature?: boolean }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }

const SIGNATURE_GREETINGS = [
  'warm regards',
  'best regards',
  'with regards',
  'regards',
  'sincerely',
  'yours sincerely',
  'thank you',
  'thanks & regards',
  'faculty mentor',
  '— j. siddhartha varma',
]

/**
 * Parses multi-line message content into structured blocks (paragraphs, lists, signatures)
 * while preserving paragraph breaks and single line-breaks.
 */
function parseMessageBlocks(raw: string): Block[] {
  const lines = raw.split(/\r?\n/)
  const blocks: Block[] = []

  let currentPara: string[] = []
  let currentBullets: string[] = []
  let currentNumbers: string[] = []

  const flushParagraph = () => {
    if (currentPara.length > 0) {
      // Check if this paragraph is a faculty signature block
      const firstLine = currentPara[0].trim().toLowerCase()
      const isSignature = SIGNATURE_GREETINGS.some((g) => firstLine.startsWith(g))

      blocks.push({
        type: 'paragraph',
        lines: [...currentPara],
        isSignature,
      })
      currentPara = []
    }
  }

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      blocks.push({
        type: 'bullet-list',
        items: [...currentBullets],
      })
      currentBullets = []
    }
  }

  const flushNumbers = () => {
    if (currentNumbers.length > 0) {
      blocks.push({
        type: 'numbered-list',
        items: [...currentNumbers],
      })
      currentNumbers = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      // Empty line -> flush all active lists or paragraphs to create distinct blocks
      flushBullets()
      flushNumbers()
      flushParagraph()
      continue
    }

    // Bullet list item: line starting with - or * or • followed by space
    const bulletMatch = /^[*\-•]\s+(.*)$/.exec(trimmed)
    if (bulletMatch) {
      flushParagraph()
      flushNumbers()
      currentBullets.push(bulletMatch[1])
      continue
    }

    // Numbered list item: line starting with "1." or "1)"
    const numberMatch = /^\d+[\.)]\s+(.*)$/.exec(trimmed)
    if (numberMatch) {
      flushParagraph()
      flushBullets()
      currentNumbers.push(numberMatch[1])
      continue
    }

    // Normal line (part of paragraph or signature)
    flushBullets()
    flushNumbers()
    currentPara.push(line)
  }

  flushBullets()
  flushNumbers()
  flushParagraph()

  return blocks
}

export const AnnouncementContent: React.FC<AnnouncementContentProps> = ({
  content,
  className = '',
}) => {
  if (!content || !content.trim()) {
    return null
  }

  const blocks = parseMessageBlocks(content)

  return (
    <div className={`space-y-3 text-xs sm:text-sm text-slate-700 ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'bullet-list') {
          return (
            <ul
              key={`b-list-${bIdx}`}
              className="space-y-1.5 my-2 pl-5 list-disc text-slate-700 marker:text-purple-600"
            >
              {block.items.map((item, iIdx) => (
                <li key={`b-item-${iIdx}`} className="leading-relaxed">
                  {parseInline(item)}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'numbered-list') {
          return (
            <ol
              key={`n-list-${bIdx}`}
              className="space-y-1.5 my-2 pl-5 list-decimal text-slate-700 marker:font-bold marker:text-purple-700"
            >
              {block.items.map((item, iIdx) => (
                <li key={`n-item-${iIdx}`} className="leading-relaxed">
                  {parseInline(item)}
                </li>
              ))}
            </ol>
          )
        }

        // Paragraph block: multiple lines are joined with <br /> to preserve faculty line breaks & signatures
        const isSignature = block.isSignature

        return (
          <p
            key={`p-${bIdx}`}
            className={`leading-relaxed ${
              isSignature
                ? 'pt-2 mt-2 border-t border-purple-100/80 text-slate-600 font-medium'
                : ''
            }`}
          >
            {block.lines.map((line, lIdx) => (
              <React.Fragment key={`l-${lIdx}`}>
                {parseInline(line)}
                {lIdx < block.lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
