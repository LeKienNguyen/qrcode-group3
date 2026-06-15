import { moderateFreeText, moderateText, moderateUrl } from './moderation.js'
import { isValidPhone } from './phone.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const TEXT_MAX_LENGTH = 2000

export function validateUrl(values) {
  const errors = {}

  const moderation = moderateUrl(values.url)
  if (moderation.blocked) {
    errors.url = moderation.message
  }

  return errors
}

export function validateWifi(values) {
  const errors = {}

  if (!values.ssid.trim()) {
    errors.ssid = 'Please enter the network name (SSID).'
  } else {
    const ssidModeration = moderateText(values.ssid)
    if (ssidModeration.blocked) errors.ssid = ssidModeration.message
  }

  if (values.encryption !== 'nopass' && !values.password.trim()) {
    errors.password = 'Please enter the network password.'
  }

  return errors
}

export function validateEmail(values) {
  const errors = {}
  const trimmed = values.email.trim()

  if (!trimmed) {
    errors.email = 'Please enter an email address.'
  } else if (!EMAIL_REGEX.test(trimmed)) {
    errors.email = 'Please enter a valid email address.'
  } else {
    const emailModeration = moderateText(values.email)
    if (emailModeration.blocked) errors.email = emailModeration.message
  }

  if (values.subject.trim()) {
    const subjectModeration = moderateText(values.subject)
    if (subjectModeration.blocked) errors.subject = subjectModeration.message
  }

  if (values.body.trim()) {
    const bodyModeration = moderateText(values.body)
    if (bodyModeration.blocked) errors.body = bodyModeration.message
  }

  return errors
}

export function validateText(values) {
  const errors = {}
  const trimmed = values.text.trim()

  if (!trimmed) {
    errors.text = 'Please enter some text.'
  } else if (trimmed.length > TEXT_MAX_LENGTH) {
    errors.text = `Text must be ${TEXT_MAX_LENGTH} characters or fewer.`
  } else {
    const moderation = moderateFreeText(trimmed)
    if (moderation.blocked) errors.text = moderation.message
  }

  return errors
}

export function validatePhone(values) {
  const errors = {}
  const trimmed = values.phone.trim()

  if (!trimmed) {
    errors.phone = 'Please enter a phone number.'
  } else if (!isValidPhone(trimmed)) {
    errors.phone = 'Please enter a valid phone number (e.g. 0901234567 or +84901234567).'
  } else {
    const moderation = moderateText(trimmed)
    if (moderation.blocked) errors.phone = moderation.message
  }

  return errors
}
