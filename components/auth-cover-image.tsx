const DEFAULT_COVER_SRC =
  "https://images.unsplash.com/photo-1592887302112-b87aca16ad2c?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"

type AuthCoverImageProps = {
  /** Override image URL (e.g. signup uses a different photo). */
  src?: string
}

/** Cover image for login/signup (shadcn login-02 style). */
export function AuthCoverImage({ src = DEFAULT_COVER_SRC }: AuthCoverImageProps) {
  return (
    <div className="relative hidden bg-muted md:block">
      <div className="absolute inset-0 bg-gradient-to-br from-black/35 via-black/10 to-black/45 z-10" />
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  )
}
