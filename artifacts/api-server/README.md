# Newsletter email behavior

Newsletter confirmation email is sent through the configured Replit Resend connector. It includes an unsubscribe link in both its plain-text and HTML content.

The link opens `/unsubscribe?token=…` on the education site. A GET only displays a confirmation page; the recipient must submit the page to unsubscribe. This keeps automated email link scanners from changing subscription state. The API stores a SHA-256 hash of the random token. When used, the active token is revoked; a hash of that revoked token is retained only so duplicate requests remain harmless. A new subscription replaces the current token and clears the previous replay marker.

The sender uses `NEWSLETTER_UNSUBSCRIBE_BASE_URL` when configured, or the first domain in `REPLIT_DOMAINS`. A public site URL must be available or newsletter signup returns a delivery error rather than sending a broken link.

Only Resend delivery through the Replit connector is supported by this implementation. It does not set RFC 8058 `List-Unsubscribe` or `List-Unsubscribe-Post` headers; unsubscribe is handled through the linked confirmation page. Any future newsletter campaign sender must select only rows where `unsubscribed_at IS NULL`.
