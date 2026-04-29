interface EmptyStateProps {
  heading: string
  body: string
}

export function EmptyState({ heading, body }: EmptyStateProps) {
  return (
    <div className="py-12 px-6 text-center">
      <h2 className="text-xl font-semibold text-text-primary">{heading}</h2>
      <p className="text-base text-text-secondary mt-2">{body}</p>
    </div>
  )
}
