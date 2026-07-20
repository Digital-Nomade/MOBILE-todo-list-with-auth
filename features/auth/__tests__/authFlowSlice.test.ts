import authReducer, {
  sessionRestorationFinished,
  setCredentials,
  setOfflineSession,
  signOut,
} from '@/features/auth/authFlowSlice'
import { authPayloadFixture } from '@/test-utils'

describe('authFlowSlice startup transitions', () => {
  it('marks restoration finished only from initializing', () => {
    let state = authReducer(undefined, { type: 'init' })

    state = authReducer(state, sessionRestorationFinished())
    expect(state.sessionStatus).toBe('unauthenticated')

    state = authReducer(state, setCredentials(authPayloadFixture()))
    state = authReducer(state, sessionRestorationFinished())
    expect(state.sessionStatus).toBe('authenticated')
  })

  it('stores an offline session without access tokens', () => {
    const state = authReducer(
      undefined,
      setOfflineSession(authPayloadFixture().user),
    )

    expect(state.sessionStatus).toBe('offline-authenticated')
    expect(state.accessToken).toBeNull()
    expect(state.user?.email).toBe('user@example.com')
  })

  it('clears offline sessions on sign out', () => {
    let state = authReducer(undefined, setOfflineSession(authPayloadFixture().user))

    state = authReducer(state, signOut())

    expect(state.sessionStatus).toBe('unauthenticated')
    expect(state.user).toBeNull()
  })
})
