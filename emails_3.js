/*
  Email "worker" config

  Fetches data
  Confirms subscription
  Builds payload (urls, theming, helper functions)
  Renders template + headers
  Sends through
*/

export default {
  namespace: 'mailer', 
  event: 'EMAIL_REQUESTED',
  perform, 
  retries: 5,
  onSuccess: (event, store) => store(setEmailSent(event)), 
  onError: (event, store) => store(setEmailFailed(event))
}


// This method orchestrates all the work to send an email
const perform = ({template, ...event}, getProjection) =>
  fetchAndConfirm(event, getProjection)
    .then(buildPayload) // adds theme vars, urls, img helpers, etc
    .then(renderTemplate(template)) // renders into mjml template strings 
    .then(sendMail) // sends via mailgun api


const fetchAndConfirm = ({email, game_slug, ...event}, fetch) =>
  // Could also be a monolithic projection of all email data
  Promise.all([ 
    fetch(SUBSCRIPTIONS),
    fetch(GAMES),
    fetch(SALES),
    fetch(FILES)
  ]).then(([subscriptions, games, sales, files]) => {
    const subscription_token = subscribed(subscriptions, email, game_slug)
    if (!subscription_token) throw new Error('Send failed: not subscribed.')
    
    return {
      ...event,
      files,
      subscription_token, 
      game: games[game_slug],
      receipt: last(sales[email])
    }
  })
