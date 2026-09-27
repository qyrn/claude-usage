import type { UsageErrorKind } from '../shared/usage'

export class UsageUnavailableError extends Error {
  constructor(
    message: string,
    readonly kind: UsageErrorKind
  ) {
    super(message)
  }
}
