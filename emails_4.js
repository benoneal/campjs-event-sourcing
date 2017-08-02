/*
  The lens for the EMAILS projection
*/

export const requestEmail = createEmailAction('EMAIL_REQUESTED',
  (projection, {id, ...payload}) => ({
    ...projection,
    [id]: {id, ...payload}
  })
)

export const setEmailSent = createEmailAction('EMAIL_SENT',
  (projection, {id, ...payload}) => ({
    ...projection,
    [id]: {
      ...projection[id],
      ...payload, 
      sent: true
    }
  })
)

export const setEmailFailed = createEmailAction('EMAIL_FAILED',
  (projection, {id, ...payload}) => ({
    ...projection,
    [id]: {
      ...projection[id],
      ...payload, 
      failed: true
    }
  })
)
