/*
  Game release - mass email on behavioural trigger

  Send to all eligible recipients on specific triggers
  Typically the trickiest logic to get right with RDBMS
  Can be combined with campaign tracks
*/

// Top level
onProjectionChange(GAMES, notifyOfNewReleases)


// Get newly released games
// Email subscribers to those games with the 'game_release' template
const notifyOfNewReleases = emailSubscribers(newReleases, 'game_release')


const newReleases = gameChanged(isNewRelease)


const gameChanged = (condition) = (prev, current) => 
  keys(current).reduce((acc, slug) =>
    condition(prev, current, slug) ? [...acc, slug] : acc, [])


const isNewRelease = (prev, current, slug) =>
  (!prev || !prev[slug] || !prev[slug].releaseDate) && current[slug].releaseDate


const emailSubscribers = (filter, template) => ({prevProjection, projection}, fetch, store) =>
  buildListPayloads(filter(prevProjection, projection), 'game_release', fetch)
    .then(sendList(store))


const buildListPayloads = (slugs, template, fetch) => 
  !slugs.length 
    ? Promise.reject()
    : Promise.all([
        fetch(SUBSCRIPTIONS),
        fetch(VISITORS),
        fetch(FEATURES)
      ]).then(([subscriptions, visitors, features]) =>
        slugs.reduce((acc, slug) => 
          [...acc, ...subscribedToGame(subscriptions, slug).reduce((acc, email) => 
            [...acc, {
              template,
              email,
              slug,
              id_token: last(visitors[email]),
              features: featureEnrolment(features, last(visitors[email]))
            }]
          , [])
          ]
        , [])
      )


const subscribedToGame = (subscriptions = {}, slug = '') => 
  values(subscriptions).reduce((acc, {email, subscribed, slugs = []}) =>
    subscribed && slugs.includes(slug) ? [...acc, email] : acc, [])


const sendList = (store) => (list) => 
  list.forEach((payload) => store(requestEmail(payload)))
