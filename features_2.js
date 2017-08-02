/*
  Assign users to control or experimental condition

  All visitors assigned an UUID
  UUID used to generate deterministic enrolments
*/

// Express middleware to assign UUIDs
// When email available, associate across UUIDs from different devices
export const assignID = ({
  url, 
  headers, 
  ip,
  ...req
}, res, next) => {
  if (isStaticOrBotRequest(url)) return next()
  const {email, id_token} = combineData(req)

  if (url.startsWith('/api')) {
    if (email && id_token) associateVisitorEmail(email, id_token)
  } else if (id_token) {
    returnVisitor(id_token, url, headers, ip)
  } else {
    res.cookie('id_token', uniqueVisitor(url, headers, ip), {maxAge: HUNDRED_YEARS})
  }

  return next()
}

// Express middleware to add experiment enrolments 
// throughout the entire request lifecycle
export const experimentEnrolments = ({
  url,
  ...req
}, res, next) => {
  if (isStaticOrBotRequest(url)) return next()
  const {id_token} = combineData(req)

  getExperimentEnrolment(id_token).then((experiments) => {
    res.locals.experiments = experiments
    next()
  })
}


export const getExperimentEnrolment = (token) => 
  getProjection(EXPERIMENTS)
    .then((experiments) => experimentEnrolment(experiments, token))


// Given a list of experiments, user is enroled in experiment if
// percentage from id_token is < experiment rollout
// or if manually overridden as true|false for that id_token
export const experimentEnrolment ({experimentList, ...experiments}, token) => {
  const enrolment = digest(token)
  return experimentList.reduce((acc, experiment, i) => ({
    ...acc,
    [experiment]: isBool(acc[experiment]) 
      ? acc[experiment] 
      : experiments[experiment].rollout >= enrolment[i]
  }), experiments[token] || {})
}


const digest = (token = '') => hexToPercent(sha512(token).toString('hex'))


// Convert id_token to array of percentages
const hexToPercent = (hex = '') => {
  const percentages = []
  for (let c = 0; c < hex.length; c += 2) {
    percentages.push(parseInt(hex.substr(c, 2), 16) / 255 * 100)
  }
  return percentages
}

