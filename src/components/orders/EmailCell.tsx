import { Fragment } from "react"

interface EmailCellProps {
  value?: unknown
}

const EMAIL_SEPARATOR_PATTERN = /([@.])/g

export function EmailCell({ value }: EmailCellProps) {
  const email = typeof value === "string" ? value.trim() : ""

  if (!email) {
    return <span>-</span>
  }

  const parts = email.split(EMAIL_SEPARATOR_PATTERN)

  return (
    <span
      className="block max-w-[130px] overflow-hidden text-ellipsis line-clamp-2 whitespace-normal break-normal"
      title={email}
    >
      {parts.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {part}
          {(part === "@" || part === ".") && <wbr />}
        </Fragment>
      ))}
    </span>
  )
}
