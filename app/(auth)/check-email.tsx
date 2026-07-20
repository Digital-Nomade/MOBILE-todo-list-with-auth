import { Button, Input } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { getErrorCode, getUserFacingMessage } from "@/config/graphql/errors";
import { useAppDispatch, useAppSelector } from "@/config/redux/hooks";
import { StylesGuide } from "@/constants/StyleGuide";
import {
  useLoginMutation,
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from "@/features/auth/authApi";
import { completeEmailVerification } from "@/features/auth/verificationCompletion";
import { useSession } from "@/hooks/useSession";
import {
  clearVerificationFlow,
  setVerificationFlow,
  setVerificationResendAvailableAt,
} from "@/features/auth/authFlowSlice";
import {
  clearStoredVerificationFlow,
  loadVerificationFlow,
  normalizeVerificationEmail,
  saveVerificationFlow,
} from "@/features/auth/verificationFlowStorage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

const CODE_PATTERN = /^\d{6}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_COOLDOWN_MS = 60000
const RATE_LIMIT_COOLDOWN_MS = 30000

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')

  if (!localPart || !domain) {
    return email
  }

  const visibleLocal = localPart.slice(0, Math.min(2, localPart.length))
  return `${visibleLocal}${'*'.repeat(Math.max(2, localPart.length - visibleLocal.length))}@${domain}`
}

export default function CheckEmailScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useSession()
  const {
    user,
    signupEmail,
    signupPassword,
    verificationEmail,
    verificationMessage,
    verificationResendAvailableAt,
  } = useAppSelector(state => state.auth)
  const storedFlow = useRef(loadVerificationFlow()).current
  const initialEmail = verificationEmail || user?.email || storedFlow?.email || ''
  const initialMessage = verificationMessage || storedFlow?.message || ''
  const initialResendAvailableAt =
    verificationResendAvailableAt ?? storedFlow?.resendAvailableAt ?? null
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [feedback, setFeedback] = useState<string | null>(initialMessage || null)
  const [previousCodeInvalidated, setPreviousCodeInvalidated] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(
    initialResendAvailableAt
  )
  const [submitAvailableAt, setSubmitAvailableAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation()
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation()
  const [login] = useLoginMutation()

  const autoSendStarted = useRef(false)

  useEffect(() => {
    if (!verificationEmail && storedFlow?.email) {
      dispatch(setVerificationFlow(storedFlow))
    }
  }, [dispatch, storedFlow, verificationEmail])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const normalizedEmail = normalizeVerificationEmail(email)
  const resendSeconds = resendAvailableAt
    ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
    : 0
  const submitSeconds = submitAvailableAt
    ? Math.max(0, Math.ceil((submitAvailableAt - now) / 1000))
    : 0

  function handleCodeChange(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, 6))
    setFeedback(null)
  }

  function retainFlow(
    nextEmail: string,
    message: string,
    cooldown: number | null,
    options: { requestCodeOnEntry?: boolean } = {},
  ) {
    const snapshot = {
      email: nextEmail,
      message,
      resendAvailableAt: cooldown,
      requestCodeOnEntry: options.requestCodeOnEntry,
    }
    saveVerificationFlow(snapshot)
    dispatch(setVerificationFlow(snapshot))
  }

  async function sendVerificationCode(
    invalidatePrevious = false,
    emailOverride?: string,
  ): Promise<boolean> {
    const targetEmail = normalizeVerificationEmail(emailOverride ?? email)

    if (!EMAIL_PATTERN.test(targetEmail)) {
      setFeedback('Enter a valid email address to request a new code.')
      return false
    }

    try {
      const response = await resendVerification({ email: targetEmail }).unwrap()
      const nextResendAvailableAt = Date.now() + RESEND_COOLDOWN_MS
      setEmail(targetEmail)
      setCode('')
      setFeedback(response.message)
      setPreviousCodeInvalidated(invalidatePrevious)
      setResendAvailableAt(nextResendAvailableAt)
      dispatch(setVerificationResendAvailableAt(nextResendAvailableAt))
      retainFlow(targetEmail, response.message, nextResendAvailableAt, {
        requestCodeOnEntry: false,
      })
      return true
    } catch (error) {
      setFeedback(getUserFacingMessage(error))
      return false
    }
  }

  useEffect(() => {
    if (autoSendStarted.current || success) {
      return
    }

    const emailToUse = normalizeVerificationEmail(
      verificationEmail || user?.email || storedFlow?.email || email,
    )

    if (!EMAIL_PATTERN.test(emailToUse)) {
      return
    }

    const cooldownActive =
      (resendAvailableAt ?? storedFlow?.resendAvailableAt ?? 0) > Date.now()

    if (cooldownActive) {
      return
    }

    const shouldAutoSend =
      storedFlow?.requestCodeOnEntry === true ||
      (isAuthenticated && user?.status === 'PENDING_VERIFICATION')

    if (!shouldAutoSend) {
      return
    }

    autoSendStarted.current = true

    if (storedFlow?.requestCodeOnEntry) {
      retainFlow(emailToUse, initialMessage, resendAvailableAt, {
        requestCodeOnEntry: false,
      })
    }

    void sendVerificationCode(false, emailToUse)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onVerify() {
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setFeedback('Enter a valid email address.')
      return
    }

    if (!CODE_PATTERN.test(code)) {
      setFeedback('Enter the six-digit confirmation code.')
      return
    }

    setFeedback(null)

    let verifiedUser

    try {
      verifiedUser = await verifyEmail({ email: normalizedEmail, code }).unwrap()
    } catch (error) {
      const errorCode = getErrorCode(error)

      if (errorCode === 'UNAUTHENTICATED') {
        setFeedback('Invalid or expired code')
      } else if (errorCode === 'TOO_MANY_REQUESTS') {
        setSubmitAvailableAt(Date.now() + RATE_LIMIT_COOLDOWN_MS)
        setFeedback('Too many attempts. Wait a moment before trying again.')
      } else if (errorCode === 'BAD_USER_INPUT') {
        setFeedback('Check the email and enter a valid six-digit code.')
      } else {
        setFeedback('Something went wrong. Please try again.')
      }
      return
    }

    const pendingCredentials =
      signupEmail && signupPassword
        ? { email: signupEmail, password: signupPassword }
        : null

    const result = await completeEmailVerification({
      dispatch,
      router,
      verifiedUser,
      isAuthenticated,
      currentUser: user,
      pendingCredentials,
      login,
    })

    if (result === 'home') {
      return
    }

    setCode('')
    setSuccess(true)
  }

  async function onResend() {
    await sendVerificationCode(true)
  }

  function changeEmail() {
    clearStoredVerificationFlow()
    dispatch(clearVerificationFlow())
    router.replace('/(auth)/signup')
  }

  const { colors, fontSizes } = StylesGuide
  const textStyle = {
    color: colors.dangerLight,
    fontSize: fontSizes.md,
    textAlign: 'center' as const,
  }

  return (
    <GlobalWrapper>
      <View
        testID="check-email-screen"
        style={{ flexDirection: 'column', justifyContent: 'center', height: '100%' }}
      >
        <Text style={{ color: colors.dangerLight, fontSize: fontSizes.xll, marginBottom: 24 }}>
          Confirm your email
        </Text>

        {success ? (
          <>
            <Text testID="verification-success-message" style={{ ...textStyle, fontSize: fontSizes.lg, marginBottom: 32 }}>
              Your email has been confirmed. You can now sign in.
            </Text>
            <Button
              testID="verification-login-button"
              buttonType="secondary"
              variant="fill"
              rounded
              onPress={() => router.replace('/(auth)')}
            >
              go to login
            </Button>
          </>
        ) : (
          <>
            {!!initialEmail ? (
              <>
                <Text style={{ ...textStyle, marginBottom: 12 }}>
                  Enter the six-digit code sent to {maskEmail(normalizedEmail)}. The code expires
                  after 10 minutes.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={changeEmail}
                  style={{ marginBottom: 32 }}
                >
                  <Text style={{ ...textStyle, fontWeight: 'bold' }}>change email</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={{ ...textStyle, marginBottom: 24 }}>
                  Enter your registration email to continue, or return to signup.
                </Text>
                <View style={{ marginBottom: 32 }}>
                  <Input
                    testID="verification-email-input"
                    accessibilityLabel="Registration email"
                    placeholder="email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </>
            )}

            <View style={{ marginBottom: 32 }}>
              <Input
                testID="verification-code-input"
                accessibilityLabel="Six-digit confirmation code"
                accessibilityHint="Enter the code from your confirmation email"
                placeholder="000000"
                keyboardType="number-pad"
                inputMode="numeric"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                maxLength={6}
                value={code}
                onChangeText={handleCodeChange}
                onSubmitEditing={onVerify}
                returnKeyType="done"
              />
            </View>

            {!!feedback && (
              <Text
                testID="verification-feedback"
                accessibilityRole="alert"
                style={{ ...textStyle, marginBottom: 16 }}
              >
                {feedback}
              </Text>
            )}

            {previousCodeInvalidated && (
              <Text
                testID="previous-code-invalidated-message"
                style={{ ...textStyle, marginBottom: 16 }}
              >
                A new code was sent. Your previous code no longer works.
              </Text>
            )}

            <View style={{ marginBottom: 16 }}>
              <Button
                testID="verification-submit-button"
                buttonType="secondary"
                variant="fill"
                rounded
                loading={isVerifying}
                disabled={isVerifying || isResending || submitSeconds > 0}
                onPress={onVerify}
              >
                {submitSeconds > 0 ? `try again in ${submitSeconds}s` : 'confirm code'}
              </Button>
            </View>

            <View style={{ marginBottom: 32 }}>
              <Button
                testID="resend-verification-submit-button"
                buttonType="secondary"
                variant="outlined"
                rounded
                loading={isResending}
                disabled={isVerifying || isResending || resendSeconds > 0}
                onPress={onResend}
              >
                {resendSeconds > 0 ? `resend in ${resendSeconds}s` : 'resend code'}
              </Button>
            </View>

            <Pressable accessibilityRole="button" onPress={changeEmail}>
              <Text style={textStyle}>
                Back to <Text style={{ fontWeight: 'bold' }}>Signup</Text>
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </GlobalWrapper>
  )
}
